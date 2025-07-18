const BaseModel = require("../../../baas/core/BaseModel");

class content extends BaseModel {
  static schema() {
    return [
      {
        name: "id",
        type: "primary key",
        validation: [],
        defaultValue: null,
        mapping: null,
      },
      {
        name: "equipment_id",
        type: "string",
        validation: "required",
        defaultValue: null,
        mapping: null,
      },
      {
        name: "equipment_name",
        type: "string",
        validation: "required",
        defaultValue: null,
        mapping: null,
      },
      {
        name: "description",
        type: "text",
        validation: [],
        defaultValue: null,
        mapping: null,
      },
      {
        name: "banner_description",
        type: "text",
        validation: [],
        defaultValue: null,
        mapping: null,
      },
      {
        name: "image_url",
        type: "string",
        validation: [],
        defaultValue: null,
        mapping: null,
      },
      {
        name: "user_id",
        type: "integer",
        validation: "required",
        defaultValue: null,
        mapping: null,
      },
      {
        name: "created_at",
        type: "timestamp",
        validation: "date",
        defaultValue: "CURRENT_TIMESTAMP",
        mapping: null,
      },
      {
        name: "updated_at",
        type: "timestamp",
        validation: "date",
        defaultValue: "CURRENT_TIMESTAMP",
        mapping: null,
      },
    ];
  }
}

module.exports = content;
