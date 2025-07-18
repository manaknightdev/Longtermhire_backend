const BaseModel = require('../../../baas/core/BaseModel');

class equipment_item extends BaseModel {
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
        "name": "category_id",
        "type": "string",
        "validation": "required",
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "category_name",
        "type": "string",
        "validation": "required",
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "equipment_id",
        "type": "string",
        "validation": "required",
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "equipment_name",
        "type": "string",
        "validation": "required",
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "base_price",
        "type": "string",
        "validation": "required",
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "minimum_duration",
        "type": "string",
        "validation": "required",
        "defaultValue": "3 Months",
        "mapping": null
      },
      {
        "name": "availability",
        "type": "boolean",
        "validation": "required",
        "defaultValue": "1",
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

module.exports = equipment_item;
