
const BaseModel = require('../../../baas/core/BaseModel');

class uploads extends BaseModel {
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
        "name": "url",
        "type": "string",
        "validation": "required",
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "caption",
        "type": "string",
        "validation": [],
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "user_id",
        "type": "foreign key",
        "validation": [],
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "width",
        "type": "integer",
        "validation": [],
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "height",
        "type": "integer",
        "validation": [],
        "defaultValue": null,
        "mapping": null
      },
      {
        "name": "type",
        "type": "mapping",
        "validation": "required,enum:0,1,2,3",
        "defaultValue": "0",
        "mapping": "0:Image,1:s3,2:Video,3:base64"
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


  transformType(value) {
    const mappings = {
      '0': 'Image',
      '1': 's3',
      '2': 'Video',
      '3': 'base64'
    };
    return mappings[value] || value;
  }

  static mapping () {
    return {
      "type": {
        "0": "Image",
        "1": "s3",
        "2": "Video",
        "3": "base64"
      }
    };
  }

}

module.exports = uploads;
