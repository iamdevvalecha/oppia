# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Models related to Oppia improvement tasks."""

from __future__ import absolute_import
from __future__ import unicode_literals

from core.constants import constants
from core.platform import models

from typing import Dict, List, Optional

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services

(base_models,) = models.Registry.import_models([models.NAMES.base_model])

datastore_services = models.Registry.import_datastore_services()

TASK_ENTITY_TYPE_EXPLORATION = constants.TASK_ENTITY_TYPE_EXPLORATION
TASK_ENTITY_TYPES = (
    TASK_ENTITY_TYPE_EXPLORATION,
)

TASK_STATUS_OPEN = constants.TASK_STATUS_OPEN
TASK_STATUS_OBSOLETE = constants.TASK_STATUS_OBSOLETE
TASK_STATUS_RESOLVED = constants.TASK_STATUS_RESOLVED
TASK_STATUS_CHOICES = (
    TASK_STATUS_OPEN,
    TASK_STATUS_OBSOLETE,
    TASK_STATUS_RESOLVED,
)

TASK_TARGET_TYPE_STATE = constants.TASK_TARGET_TYPE_STATE
TASK_TARGET_TYPES = (
    TASK_TARGET_TYPE_STATE,
)

TASK_TYPE_HIGH_BOUNCE_RATE = constants.TASK_TYPE_HIGH_BOUNCE_RATE
TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP = (
    constants.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP)
TASK_TYPE_NEEDS_GUIDING_RESPONSES = constants.TASK_TYPE_NEEDS_GUIDING_RESPONSES
TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS = (
    constants.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS)
TASK_TYPES = (
    TASK_TYPE_HIGH_BOUNCE_RATE,
    TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP,
    TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS,
    TASK_TYPE_NEEDS_GUIDING_RESPONSES,
)


class TaskEntryModel(base_models.BaseModel):
    """Model representation of an actionable task from the improvements tab.

    The ID of a task has the form: "[entity_type].[entity_id].[entity_version].
                                    [task_type].[target_type].[target_id]".
    """

    # Utility field which results in a 20% speedup compared to querying by each
    # of the invididual fields used to compose it.
    # Value has the form: "[entity_type].[entity_id].[entity_version]".
    composite_entity_id = datastore_services.StringProperty(
        required=True, indexed=True)

    # The type of entity a task entry refers to.
    entity_type = datastore_services.StringProperty(
        required=True, indexed=True, choices=TASK_ENTITY_TYPES)
    # The ID of the entity a task entry refers to.
    entity_id = datastore_services.StringProperty(
        required=True, indexed=True)
    # The version of the entity a task entry refers to.
    entity_version = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # The type of task a task entry tracks.
    task_type = datastore_services.StringProperty(
        required=True, indexed=True, choices=TASK_TYPES)
    # The type of sub-entity a task entry focuses on. Value is None when an
    # entity does not have any meaningful sub-entities to target.
    target_type = datastore_services.StringProperty(
        required=True, indexed=True, choices=TASK_TARGET_TYPES)
    # Uniquely identifies the sub-entity a task entry focuses on. Value is None
    # when an entity does not have any meaningful sub-entities to target.
    target_id = datastore_services.StringProperty(
        required=True, indexed=True)

    # A sentence generated by Oppia to describe why the task was created.
    issue_description = datastore_services.StringProperty(
        default=None, required=False, indexed=True)
    # Tracks the state/progress of a task entry.
    status = datastore_services.StringProperty(
        required=True, indexed=True, choices=TASK_STATUS_CHOICES)
    # ID of the user who closed the task, if any.
    resolver_id = datastore_services.StringProperty(
        default=None, required=False, indexed=True)
    # The date and time at which a task was closed or deprecated.
    resolved_on = datastore_services.DateTimeProperty(
        default=None, required=False, indexed=True)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether any TaskEntryModel references the given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(cls.resolver_id == user_id).get() is not None

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user:
        resolver_id field.

        It is okay to delete task entries since, after they are resolved, they
        only act as a historical record. The removal just removes the historical
        record.
        """
        return base_models.DELETION_POLICY.DELETE

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instances of TaskEntryModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        task_entry_keys = (
            cls.query(cls.resolver_id == user_id).fetch(keys_only=True))
        datastore_services.delete_multi(task_entry_keys)

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as one instance shared across users since multiple
        users resolve tasks.
        """
        return (
            base_models
            .MODEL_ASSOCIATION_TO_USER
            .ONE_INSTANCE_SHARED_ACROSS_USERS)

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user:
        TaskEntryModel contains the ID of the user that acted on a task.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'composite_entity_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'entity_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'entity_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'entity_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'task_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'target_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'target_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'issue_description': base_models.EXPORT_POLICY.EXPORTED,
            'status': base_models.EXPORT_POLICY.EXPORTED,
            'resolver_id': base_models.EXPORT_POLICY.EXPORTED,
            'resolved_on': base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def get_field_name_mapping_to_takeout_keys(cls) -> Dict[str, str]:
        """Defines the mapping of field names to takeout keys since this model
        is exported as one instance shared across users.
        """
        return {
            'resolver_id': 'task_ids_resolved_by_user',
            'issue_description': 'issue_descriptions',
            'status': 'statuses',
            'resolved_on': 'resolution_msecs'
        }

    @staticmethod
    def export_data(user_id: str) -> Dict[str, List[str]]:
        """Returns the user-relevant properties of TaskEntryModels.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. The user-relevant properties of TaskEntryModel in a dict
            format. In this case, we are returning all the ids of the tasks
            which were closed by this user.
        """
        task_ids_resolved_by_user = TaskEntryModel.query(
            TaskEntryModel.resolver_id == user_id)
        return {
            'task_ids_resolved_by_user': (
                [t.id for t in task_ids_resolved_by_user]),
            'issue_descriptions': (
                [t.issue_description for t in task_ids_resolved_by_user]),
            'statuses': (
                [t.status for t in task_ids_resolved_by_user]),
            'resolution_msecs': (
                [t.resolved_on for t in task_ids_resolved_by_user]),
        }

    @classmethod
    def generate_task_id(
            cls,
            entity_type: str,
            entity_id: str,
            entity_version: int,
            task_type: str,
            target_type: str,
            target_id: str
    ) -> str:
        """Generates a new task entry ID.

        Args:
            entity_type: str. The type of entity a task entry refers to.
            entity_id: str. The ID of the entity a task entry refers to.
            entity_version: int. The version of the entity a task entry refers
                to.
            task_type: str. The type of task a task entry tracks.
            target_type: str. The type of sub-entity a task entry refers to.
            target_id: str. The ID of the sub-entity a task entry refers to.

        Returns:
            str. The ID for the given task.
        """
        return '%s.%s.%d.%s.%s.%s' % (
            entity_type, entity_id, entity_version, task_type, target_type,
            target_id)

    @classmethod
    def generate_composite_entity_id(
            cls,
            entity_type: str,
            entity_id: str,
            entity_version: int
    ) -> str:
        """Generates a new composite_entity_id value.

        Args:
            entity_type: str. The type of entity a task entry refers to.
            entity_id: str. The ID of the entity a task entry refers to.
            entity_version: int. The version of the entity a task entry refers
                to.

        Returns:
            str. The composite_entity_id for the given task.
        """
        return '%s.%s.%d' % (entity_type, entity_id, entity_version)

    @classmethod
    def create(
            cls,
            entity_type: str,
            entity_id: str,
            entity_version: int,
            task_type: str,
            target_type: str,
            target_id: str,
            issue_description: Optional[str] = None,
            status: str = TASK_STATUS_OBSOLETE,
            resolver_id: Optional[str] = None,
            resolved_on: Optional[str] = None
    ) -> str:
        """Creates a new task entry and puts it in storage.

        Args:
            entity_type: str. The type of entity a task entry refers to.
            entity_id: str. The ID of the entity a task entry refers to.
            entity_version: int. The version of the entity a task entry refers
                to.
            task_type: str. The type of task a task entry tracks.
            target_type: str. The type of sub-entity a task entry refers to.
            target_id: str. The ID of the sub-entity a task entry refers to.
            issue_description: str. Sentence generated by Oppia to describe why
                the task was created.
            status: str. Tracks the state/progress of a task entry.
            resolver_id: str. ID of the user who closed the task, if any.
            resolved_on: str. The date and time at which a task was closed or
                deprecated.

        Returns:
            str. The ID of the new task.

        Raises:
            Exception. A task corresponding to the provided identifier values
                (entity_type, entity_id, entity_version, task_type, target_type,
                target_id) already exists in storage.
        """
        task_id = cls.generate_task_id(
            entity_type, entity_id, entity_version, task_type, target_type,
            target_id)
        if cls.get_by_id(task_id) is not None:
            raise Exception('Task id %s already exists' % task_id)
        composite_entity_id = cls.generate_composite_entity_id(
            entity_type, entity_id, entity_version)
        task_entry = cls(
            id=task_id,
            composite_entity_id=composite_entity_id,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_version=entity_version,
            task_type=task_type,
            target_type=target_type,
            target_id=target_id,
            issue_description=issue_description,
            status=status,
            resolver_id=resolver_id,
            resolved_on=resolved_on)
        task_entry.update_timestamps()
        task_entry.put()
        return task_id
