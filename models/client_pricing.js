const BaseModel = require("../../../baas/core/BaseModel");

class client_pricing extends BaseModel {
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
        name: "client_user_id",
        type: "integer",
        validation: "required",
        defaultValue: null,
        mapping: null,
      },
      {
        name: "pricing_package_id",
        type: "integer",
        validation: [], // Remove required validation for custom discounts
        defaultValue: null,
        mapping: null,
      },
      {
        name: "assigned_by",
        type: "integer",
        validation: "required",
        defaultValue: null,
        mapping: null,
      },
      {
        name: "custom_discount_type",
        type: "varchar(20)",
        validation: [],
        defaultValue: null,
        mapping: null,
      },
      {
        name: "custom_discount_value",
        type: "decimal(10,2)",
        validation: [],
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
    ];
  }
}

module.exports = client_pricing;
