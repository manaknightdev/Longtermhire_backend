
const BaseModel = require('../../../baas/core/BaseModel');

class user extends BaseModel {
  static schema() {
    return [
      {
        "name": "id",
        "type": "primary key",
        "validation": [],
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "email",
        "type": "string",
        "validation": "required,email",
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "password",
        "type": "password",
        "validation": "required",
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "login_type",
        "type": "mapping",
        "validation": "required,enum:0,1,2,3,4,5",
        "defaultValue": "0",
        "mapping": "0:Regular,1:Google,2:Microsoft,3:Apple,4:Twitter,5:Facebook"
      },
      {
        "name": "role_id",
        "type": "string",
        "validation": [],
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "data",
        "type": "json",
        "validation": [],
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "status",
        "type": "mapping",
        "validation": "required,enum:0,1,2",
        "defaultValue": "0",
        "mapping": "0:Active,1:Inactive,2:Suspend"
      },
      {
        "name": "verify",
        "type": "boolean",
        "validation": "required",
        "defaultValue": "0",
        "mapping": null
      },
      {
        "name": "two_factor_authentication",
        "type": "boolean",
        "validation": [],
        "defaultValue": "0",
        "mapping": null
      },
      {
        "name": "company_id",
        "type": "integer",
        "validation": [],
        "defaultValue": "0",
        "mapping": null
      },
      {
        "name": "stripe_uid",
        "type": "string",
        "validation": [],
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "created_at",
        "type": "timestamp",
        "validation": "date",
        "defaultValue": "CURRENT_TIMESTAMP",
        "mapping": null
      }
    ];
  }


  transformLoginType(value) {
    const mappings = {
      '0': 'Regular',
      '1': 'Google',
      '2': 'Microsoft',
      '3': 'Apple',
      '4': 'Twitter',
      '5': 'Facebook'
    };
    return mappings[value] || value;
  }


  transformStatus(value) {
    const mappings = {
      '0': 'Active',
      '1': 'Inactive',
      '2': 'Suspend'
    };
    return mappings[value] || value;
  }

  static mapping () {
    return {
      "login_type": {
        "0": "Regular",
        "1": "Google",
        "2": "Microsoft",
        "3": "Apple",
        "4": "Twitter",
        "5": "Facebook"
      },
      "status": {
        "0": "Active",
        "1": "Inactive",
        "2": "Suspend"
      }
    };
  }

}

module.exports = user;
