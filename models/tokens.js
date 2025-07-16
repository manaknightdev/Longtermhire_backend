
const BaseModel = require('../../../baas/core/BaseModel');

class tokens extends BaseModel {
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
        "name": "user_id",
        "type": "foreign key",
        "validation": "required",
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "token",
        "type": "string",
        "validation": "required",
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "code",
        "type": "string",
        "validation": "required",
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "type",
        "type": "mapping",
        "validation": "required,enum:0,1,2,3,4",
        "defaultValue": "0",
        "mapping": "0:Access,1:Refresh,2:Reset,3:Verify,4:Magic"
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
        "validation": "required,enum:0,1",
        "defaultValue": "1",
        "mapping": "0:Inactive,1:Active"
      },
      {
        "name": "created_at",
        "type": "timestamp",
        "validation": "date",
        "defaultValue": "CURRENT_TIMESTAMP",
        "mapping": null
      },
      {
        "name": "updated_at",
        "type": "timestamp",
        "validation": "date",
        "defaultValue": "CURRENT_TIMESTAMP",
        "mapping": null
      },
      {
        "name": "expired_at",
        "type": "timestamp",
        "validation": "date",
        "defaultValue": null,
        "mapping": null
      }
    ];
  }


  transformType(value) {
    const mappings = {
      '0': 'Access',
      '1': 'Refresh',
      '2': 'Reset',
      '3': 'Verify',
      '4': 'Magic'
    };
    return mappings[value] || value;
  }


  transformStatus(value) {
    const mappings = {
      '0': 'Inactive',
      '1': 'Active'
    };
    return mappings[value] || value;
  }

  static mapping () {
    return {
      "type": {
        "0": "Access",
        "1": "Refresh",
        "2": "Reset",
        "3": "Verify",
        "4": "Magic"
      },
      "status": {
        "0": "Inactive",
        "1": "Active"
      }
    };
  }

}

module.exports = tokens;
