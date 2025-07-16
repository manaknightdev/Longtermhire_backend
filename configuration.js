const super_admin = require("./roles/super_admin");
const member = require("./roles/member");
      module.exports = function(app) {
          return {
              roles: ["super_admin", "member"],
              super_admin: new super_admin(),
member: new member(),
              configuration: {}
          };
      }