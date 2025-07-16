
const BaseModel = require('../../../baas/core/BaseModel');

class preference extends BaseModel {
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
        "name": "first_name",
        "type": "string",
        "validation": [],
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "last_name",
        "type": "string",
        "validation": [],
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
        "name": "photo",
        "type": "string",
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
      }
    ];
  }




}

module.exports = preference;
