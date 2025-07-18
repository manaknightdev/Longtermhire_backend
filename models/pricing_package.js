const BaseModel = require("../../../baas/core/BaseModel");

class pricing_package extends BaseModel {
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
        name: "package_id",
        type: "string",
        validation: "required",
        defaultValue: null,
        mapping: null,
      },
      {
        name: "name",
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
        name: "discount_type",
        type: "mapping",
        validation: "required,enum:0,1",
        defaultValue: "0",
        mapping: "0:Percentage,1:Fixed",
      },
      {
        name: "discount_value",
        type: "decimal",
        validation: "required,numeric",
        defaultValue: null,
        mapping: null,
      },
      {
        name: "applicable_categories",
        type: "json",
        validation: [],
        defaultValue: null,
        mapping: null,
      },
      {
        name: "minimum_duration",
        type: "string",
        validation: [],
        defaultValue: null,
        mapping: null,
      },
      {
        name: "terms",
        type: "text",
        validation: [],
        defaultValue: null,
        mapping: null,
      },
      {
        name: "status",
        type: "mapping",
        validation: "required,enum:0,1",
        defaultValue: "0",
        mapping: "0:Active,1:Inactive",
      },
      {
        name: "created_by",
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

  transformDiscountType(value) {
    const mappings = {
      0: "Percentage",
      1: "Fixed",
    };
    return mappings[value] || value;
  }

  transformStatus(value) {
    const mappings = {
      0: "Active",
      1: "Inactive",
    };
    return mappings[value] || value;
  }

  static mapping() {
    return {
      discount_type: {
        0: "Percentage",
        1: "Fixed",
      },
      status: {
        0: "Active",
        1: "Inactive",
      },
    };
  }
}

module.exports = pricing_package;
