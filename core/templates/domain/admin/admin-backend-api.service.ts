// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Backend api service for fetching the admin data;
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { AdminPageConstants } from
  'pages/admin-page/admin-page.constants';
import {
  CreatorTopicSummary,
  CreatorTopicSummaryBackendDict
} from 'domain/topic/creator-topic-summary.model';
import {
  PlatformParameter,
  PlatformParameterBackendDict
} from 'domain/platform_feature/platform-parameter.model';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { Schema } from 'services/schema-default-value.service';


export interface UserRolesBackendResponse {
  roles: string[];
  'managed_topic_ids': string[];
  banned: boolean;
}

export interface AssignedUsersBackendResponse {
  usernames: string[];
}

export interface HumanReadableRolesBackendResponse {
  [role: string]: string;
}

export interface RoleToActionsBackendResponse {
  [role: string]: string[];
}

export interface ConfigPropertiesBackendResponse {
  [key: string]: ConfigProperty;
}

interface PendingDeletionRequestBackendResponse {
  'number_of_pending_deletion_models': string
}

export interface ModelsRelatedToUserBackendResponse {
  'related_models_exist': boolean
}

export interface SignupEmailContent {
  'html_body': string,
  'subject': string
}

export interface ClassroomPageData {
  'name': string,
  'topic_ids': string[],
  'course_details': string,
  'url_fragment': string,
  'topic_list_intro': string
}

export interface VmidSharedSecretKeyMapping {
  'shared_secret_key': string,
  'vm_id': string
}

export interface ConfigProperty {
  description: string,
  schema: Schema,
  value: number | boolean | string | string[] | Object | Object[]
}

export interface ConfigPropertyValues {
  'always_ask_learners_for_answer_details': boolean,
  'classroom_pages_data': ClassroomPageData,
  'classroom_promos_are_enabled': boolean,
  'contributor_can_suggest_questions': boolean,
  'contributor_dashboard_is_enabled': boolean,
  'contributor_dashboard_reviewer_emails_is_enabled': boolean,
  'email_footer': string,
  'email_sender_name': string,
  'enable_admin_notifications_for_reviewer_shortage': boolean,
  'featured_translation_languages': string[],
  'high_bounce_rate_task_minimum_exploration_starts': number,
  'high_bounce_rate_task_state_bounce_rate_creation_threshold': number,
  'high_bounce_rate_task_state_bounce_rate_obsoletion_threshold': number,
  'is_improvements_tab_enabled': boolean,
  'max_number_of_explorations_in_math_svgs_batch': number,
  'max_number_of_suggestions_per_reviewer': number,
  'max_number_of_svgs_in_math_svgs_batch': number,
  'notification_user_ids_for_failed_tasks': string[],
  'notify_admins_suggestions_waiting_too_long_is_enabled': boolean,
  'oppia_csrf_secret': string,
  'promo_bar_enabled': boolean,
  'promo_bar_message': string,
  'record_playthrough_probability': number,
  'signup_email_content': SignupEmailContent,
  'unpublish_exploration_email_html_body': string,
  'vmid_shared_secret_key_mapping': VmidSharedSecretKeyMapping,
  'whitelisted_exploration_ids_for_playthroughs': string[]
}

export interface AdminPageDataBackendDict {
  'demo_explorations': string[][];
  'demo_collections': string[][];
  'demo_exploration_ids': string[];
  'human_readable_current_time': string;
  'updatable_roles': string[];
  'role_to_actions': RoleToActionsBackendResponse;
  'config_properties': ConfigPropertiesBackendResponse;
  'viewable_roles': string[];
  'human_readable_roles': HumanReadableRolesBackendResponse;
  'topic_summaries': CreatorTopicSummaryBackendDict[];
  'feature_flags': PlatformParameterBackendDict[];
}

export interface AdminPageData {
  demoExplorations: string[][];
  demoCollections: string[][];
  demoExplorationIds: string[];
  updatableRoles: string[];
  roleToActions: RoleToActionsBackendResponse;
  configProperties: ConfigPropertiesBackendResponse;
  viewableRoles: string[];
  humanReadableRoles: HumanReadableRolesBackendResponse;
  topicSummaries: CreatorTopicSummary[];
  featureFlags: PlatformParameter[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService) {}

  async getDataAsync(): Promise<AdminPageData> {
    return new Promise((resolve, reject) => {
      this.http.get<AdminPageDataBackendDict>(
        AdminPageConstants.ADMIN_HANDLER_URL).toPromise().then(response => {
        resolve({
          demoExplorations: response.demo_explorations,
          demoCollections: response.demo_collections,
          demoExplorationIds: response.demo_exploration_ids,
          updatableRoles: response.updatable_roles,
          roleToActions: response.role_to_actions,
          configProperties: response.config_properties,
          humanReadableRoles: response.human_readable_roles,
          viewableRoles: response.viewable_roles,
          topicSummaries: response.topic_summaries.map(
            CreatorTopicSummary.createFromBackendDict),
          featureFlags: response.feature_flags.map(
            dict => PlatformParameter.createFromBackendDict(
              dict)
          )
        });
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  // This is a helper function to handle all post<void>
  // requests in admin page.
  private async _postRequestAsync(
      handlerUrl: string, payload?: Object, action?: string):
      Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.post<void>(
        handlerUrl, { action, ...payload }).toPromise()
        .then(response => {
          resolve(response);
        }, errorResponse => {
          reject(errorResponse.error.error);
        });
    });
  }

  // Admin Roles Tab Services.
  async viewUsersRoleAsync(
      username: string): Promise<UserRolesBackendResponse> {
    return new Promise((resolve, reject) => {
      this.http.get<UserRolesBackendResponse>(
        AdminPageConstants.ADMIN_ROLE_HANDLER_URL, {
          params: {
            filter_criterion: 'username',
            username: username
          }
        }
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async fetchUsersAssignedToRoleAsync(
      role: string): Promise<AssignedUsersBackendResponse> {
    return new Promise((resolve, reject) => {
      this.http.get<AssignedUsersBackendResponse>(
        AdminPageConstants.ADMIN_ROLE_HANDLER_URL, {
          params: {
            filter_criterion: 'role',
            role: role
          }
        }
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async addUserRoleAsync(
      newRole: string, username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.put<void>(
        AdminPageConstants.ADMIN_ROLE_HANDLER_URL, {
          role: newRole,
          username: username
        }
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async removeUserRoleAsync(
      roleToRemove: string, username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.delete<void>(
        AdminPageConstants.ADMIN_ROLE_HANDLER_URL, {
          params: {
            role: roleToRemove,
            username: username
          }
        }
      ).toPromise().then(resolve, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async assignManagerToTopicAsync(
      username: string, topicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.put<void>(
        AdminPageConstants.TOPIC_MANAGER_ROLE_HANDLER_URL, {
          username: username,
          topic_id: topicId,
          action: 'assign'
        }
      ).toPromise().then(resolve, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async deassignManagerFromTopicAsync(
      username: string, topicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.put<void>(
        AdminPageConstants.TOPIC_MANAGER_ROLE_HANDLER_URL, {
          username: username,
          topic_id: topicId,
          action: 'deassign'
        }
      ).toPromise().then(resolve, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  // Admin Misc Tab Services.
  async clearSearchIndexAsync(): Promise<void> {
    return this._postRequestAsync (
      AdminPageConstants.ADMIN_HANDLER_URL);
  }

  async regenerateOpportunitiesRelatedToTopicAsync(
      topicId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.http.post<number>(
        AdminPageConstants.ADMIN_HANDLER_URL, {
          action: 'regenerate_topic_related_opportunities',
          topic_id: topicId
        }
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async uploadTopicSimilaritiesAsync(data: string):
  Promise<void> {
    let action = 'upload_topic_similarities';
    let payload = {
      data: data
    };
    return this._postRequestAsync (
      AdminPageConstants.ADMIN_HANDLER_URL, payload, action);
  }

  async sendDummyMailToAdminAsync(): Promise<void> {
    return this._postRequestAsync (
      AdminPageConstants.ADMIN_SEND_DUMMY_MAIL_HANDLER_URL);
  }

  async updateUserNameAsync(
      oldUsername: string, newUsername: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.put<void>(
        AdminPageConstants.ADMIN_UPDATE_USERNAME_HANDLER_URL, {
          old_username: oldUsername,
          new_username: newUsername
        }
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async updateBlogPostDataAsync(
      blogPostId: string, authorUsername: string, publishedOn: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.put<void>(
        AdminPageConstants.ADMIN_UPDATE_BLOG_POST_DATA_HANDLER, {
          blog_post_id: blogPostId,
          author_username: authorUsername,
          published_on: publishedOn,
        }
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async getNumberOfPendingDeletionRequestAsync(
  ): Promise<PendingDeletionRequestBackendResponse> {
    return new Promise((resolve, reject) => {
      this.http.get<PendingDeletionRequestBackendResponse>(
        AdminPageConstants.ADMIN_NUMBER_OF_DELETION_REQUEST_HANDLER_URL, {}
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async grantSuperAdminPrivilegesAsync(username: string): Promise<void> {
    return this.http.put<void>(
      AdminPageConstants.ADMIN_SUPER_ADMIN_PRIVILEGES_HANDLER_URL, {username}
    ).toPromise();
  }

  async revokeSuperAdminPrivilegesAsync(username: string): Promise<void> {
    return this.http.delete<void>(
      AdminPageConstants.ADMIN_SUPER_ADMIN_PRIVILEGES_HANDLER_URL, {
        params: {username},
      }
    ).toPromise();
  }

  async getModelsRelatedToUserAsync(userId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.http.get<ModelsRelatedToUserBackendResponse>(
        AdminPageConstants.ADMIN_VERIFY_USER_MODELS_DELETED_HANDLER_URL, {
          params: {
            user_id: userId
          }
        }
      ).toPromise().then(response => {
        resolve(response.related_models_exist);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async deleteUserAsync(userId: string, username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.delete<void>(
        AdminPageConstants.ADMIN_DELETE_USER_HANDLER_URL, {
          params: {
            user_id: userId,
            username: username
          }
        }
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  // Admin Config Tab Services.
  async revertConfigPropertyAsync(configPropertyId: string):
  Promise<void> {
    let action = 'revert_config_property';
    let payload = {
      config_property_id: configPropertyId
    };
    return this._postRequestAsync (
      AdminPageConstants.ADMIN_HANDLER_URL, payload, action);
  }

  async saveConfigPropertiesAsync(
      newConfigPropertyValues: ConfigPropertyValues):
      Promise<void> {
    let action = 'save_config_properties';
    let payload = {
      new_config_property_values: newConfigPropertyValues
    };
    return this._postRequestAsync (
      AdminPageConstants.ADMIN_HANDLER_URL, payload, action);
  }

  // Admin Dev Mode Activities Tab Services.
  async generateDummyExplorationsAsync(
      numDummyExpsToGenerate: number,
      numDummyExpsToPublish: number): Promise<void> {
    return this._postRequestAsync(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'generate_dummy_explorations',
      num_dummy_exps_to_generate: numDummyExpsToGenerate,
      num_dummy_exps_to_publish: numDummyExpsToPublish
    });
  }

  async reloadExplorationAsync(explorationId: string):
  Promise<void> {
    return this._postRequestAsync(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'reload_exploration',
      exploration_id: String(explorationId)
    });
  }

  async generateDummyNewStructuresDataAsync(): Promise<void> {
    return this._postRequestAsync(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'generate_dummy_new_structures_data'
    });
  }

  async generateDummyNewSkillDataAsync(): Promise<void> {
    return this._postRequestAsync(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'generate_dummy_new_skill_data'
    });
  }

  async reloadCollectionAsync(collectionId: string):
  Promise<void> {
    return this._postRequestAsync(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'reload_collection',
      collection_id: String(collectionId)
    });
  }

  async markUserBannedAsync(username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.put<void>(
        AdminPageConstants.ADMIN_BANNED_USERS_HANDLER,
        { username }).toPromise()
        .then(response => {
          resolve(response);
        }, errorResponse => {
          reject(errorResponse.error.error);
        });
    });
  }

  async unmarkUserBannedAsync(username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.delete<void>(
        AdminPageConstants.ADMIN_BANNED_USERS_HANDLER,
        { params: { username } }).toPromise()
        .then(response => {
          resolve(response);
        }, errorResponse => {
          reject(errorResponse.error.error);
        });
    });
  }
}

angular.module('oppia').factory(
  'AdminBackendApiService',
  downgradeInjectable(AdminBackendApiService));
