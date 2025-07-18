const BaseModel = require('../../../baas/core/BaseModel');

class request extends BaseModel {
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
        "name": "client_user_id",
        "type": "integer",
        "validation": "required",
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "equipment_id",
        "type": "integer",
        "validation": "required",
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "status",
        "type": "mapping",
        "validation": "required,enum:0,1,2",
        "defaultValue": "0",
        "mapping": "0:Pending,1:Approved,2:Rejected"
      },
      {
        "name": "notes",
        "type": "text",
        "validation": [],
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "reviewed_by",
        "type": "integer",
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
      },
      {
        "name": "updated_at",
        "type": "timestamp",
        "validation": "date",
        "defaultValue": "CURRENT_TIMESTAMP",
        "mapping": null
      }
    ];
  }

  transformStatus(value) {
    const mappings = {
      '0': 'Pending',
      '1': 'Approved',
      '2': 'Rejected'
    };
    return mappings[value] || value;
  }

  static mapping() {
    return {
      "status": {
        "0": "Pending",
        "1": "Approved",
        "2": "Rejected"
      }
    };
  }
}

module.exports = request;
