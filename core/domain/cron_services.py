# Copyright 2019 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Service functions relating to cron controllers."""

from __future__ import absolute_import
from __future__ import unicode_literals

import datetime

from core import feconf
from core.platform import models

(base_models, job_models, user_models) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.job, models.NAMES.user])
datastore_services = models.Registry.import_datastore_services()

# Only non-versioned models should be included in this list. Activities that
# use versioned models should have their own delete functions.
MODEL_CLASSES_TO_MARK_AS_DELETED = (user_models.UserQueryModel,)


def delete_models_marked_as_deleted():
    """Hard-delete all models that are marked as deleted (have deleted field set
    to True) and were last updated more than eight weeks ago.
    """
    date_now = datetime.datetime.utcnow()
    date_before_which_to_hard_delete = (
        date_now - feconf.PERIOD_TO_HARD_DELETE_MODELS_MARKED_AS_DELETED)
    for model_class in models.Registry.get_all_storage_model_classes():
        deleted_models = model_class.query(
            model_class.deleted == True  # pylint: disable=singleton-comparison
        ).fetch()
        models_to_hard_delete = [
            deleted_model for deleted_model in deleted_models
            if deleted_model.last_updated < date_before_which_to_hard_delete
        ]
        if issubclass(model_class, base_models.VersionedModel):
            model_ids_to_hard_delete = [
                model.id for model in models_to_hard_delete
            ]
            model_class.delete_multi(
                model_ids_to_hard_delete, '', '', force_deletion=True)
        else:
            model_class.delete_multi(models_to_hard_delete)


def mark_outdated_models_as_deleted():
    """Mark models in MODEL_CLASSES_TO_MARK_AS_DELETED, as deleted if they were
    last updated more than four weeks ago.
    """
    date_before_which_to_mark_as_deleted = (
        datetime.datetime.utcnow() - feconf.PERIOD_TO_MARK_MODELS_AS_DELETED)
    models_to_mark_as_deleted = []
    for model_class in MODEL_CLASSES_TO_MARK_AS_DELETED:
        models_to_mark_as_deleted.extend(
            model_class.query(
                model_class.last_updated < date_before_which_to_mark_as_deleted
            ).fetch()
        )
    for model_to_mark_as_deleted in models_to_mark_as_deleted:
        model_to_mark_as_deleted.deleted = True
    datastore_services.update_timestamps_multi(models_to_mark_as_deleted)
    datastore_services.put_multi(models_to_mark_as_deleted)
