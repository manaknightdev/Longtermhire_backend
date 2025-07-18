const BaseModel = require('../../../baas/core/BaseModel');

class client_equipment extends BaseModel {
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
        "name": "assigned_by",
        "type": "integer",
        "validation": "required",
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
}

module.exports = client_equipment;
