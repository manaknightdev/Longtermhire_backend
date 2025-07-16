
const BaseModel = require('../../../baas/core/BaseModel');

class job extends BaseModel {
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
        "name": "task",
        "type": "string",
        "validation": "required",
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "arguments",
        "type": "json",
        "validation": [],
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "time_interval",
        "type": "string",
        "validation": [],
        "defaultValue": "once",
        "mapping": null
      },
      {
        "name": "retries",
        "type": "integer",
        "validation": [],
        "defaultValue": "1",
        "mapping": null
      },
      {
        "name": "status",
        "type": "mapping",
        "validation": [],
        "defaultValue": "0",
        "mapping": "0:Pending,1:Failed,2:Processing,3:Completed"
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
      '1': 'Failed',
      '2': 'Processing',
      '3': 'Completed'
    };
    return mappings[value] || value;
  }

  static mapping () {
    return {
      "status": {
        "0": "Pending",
        "1": "Failed",
        "2": "Processing",
        "3": "Completed"
      }
    };
  }

}

module.exports = job;
