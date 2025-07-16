
const BaseRole = require('../../../baas/core/BaseRole');

class member extends BaseRole {
  static id = 'role_member_1752663808666';
  static name = 'Member';
  static slug = 'member';
  static permissions = {
    "routes": [],
    "canCreateUsers": false,
    "canEditUsers": false,
    "canDeleteUsers": false,
    "canManageRoles": false,
    "canUpdateOtherUsers": false,
    "companyScoped": false
  };
  static index = 1;

  // Helper method to check route permission
  static hasRoutePermission(routeId) {
    return this.permissions?.routes?.includes(routeId) || false;
  }

  // List of models this role can access
  static allowedModels = [];

  /**
  * Check if role can access a specific model
  * @param {string} modelName - Name of the model to check
  * @returns {boolean} Whether model access is allowed
  */
  static canAccessModel(modelName) {
    return this.permissions?.treeql?.models?.[modelName]?.allowed || false;
  }

  /**
  * Get blacklisted fields for a model
  * @param {string} modelName - Name of the model
  * @returns {string[]} Array of blacklisted field names
  */
  static getBlacklistedFields(modelName) {
    return this.permissions?.treeql?.models?.[modelName]?.blacklistedFields || [];
  }

  /**
  * Check if role can perform an operation on a model
  * @param {string} modelName - Name of the model
  * @param {string} operation - Operation to check (get, getOne, getAll, post, put, delete, paginate, join)
  * @returns {boolean} Whether operation is allowed
  */
  static canPerformOperation(modelName, operation) {
    const modelConfig = this.permissions?.treeql?.models?.[modelName];
    if (!modelConfig?.allowed) {
      return false;
    }
    return modelConfig.operations?.[operation] || false;
  }

  /**
  * Get all allowed operations for a model
  * @param {string} modelName - Name of the model
  * @returns {Object<string, boolean>} Object mapping operations to permission status
  */
  static getAllowedOperations(modelName) {
    return this.permissions?.treeql?.models?.[modelName]?.operations || {};
  }

  /**
  * Check if TreeQL is enabled for this role
  * @returns {boolean} Whether TreeQL is enabled
  */
  static isTreeQLEnabled() {
    return this.permissions?.treeql?.enabled || false;
  }
}

module.exports = member;
