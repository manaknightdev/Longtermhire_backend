const BaseModel = require('../../../baas/core/BaseModel');

class client extends BaseModel {
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
        "type": "integer",
        "validation": "required",
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "client_name",
        "type": "string",
        "validation": "required",
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "company_name",
        "type": "string",
        "validation": "required",
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "phone",
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
}

module.exports = client;
