

module.exports = function (app) {
  app.get("/v1/api/longtermhire/member/lambda/microsoft/login", async (req, res) => {
    const config = app.get("configuration");
    const role = "member";
    const projectId = "longtermhire";
    const hostname = projectId + ".manaknightdigital.com";

    const Role = require(`../roles/member`);
    if (!Role.permissions.canMicrosoftLogin) {
      return res.status(403).json({
        error: true,
        message: "Forbidden access.",
      });
    }

    const scope = "openid profile User.Read"; // Adjust the scopes as per your requirements

    const authorizeUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${config.microsoft.application_id}&response_type=code&redirect_uri=${config.microsoft.redirect_url}&scope=${scope}`;
    
    let authURL = authorizeUrl + "&state=" + projectId + "~" + hostname + "~" + role;
    
    if (req.query.company_id != undefined) {
      authURL += "~" + req.query.company_id; 
    }

    if (req.query.is_refresh != undefined) {
      authURL += "~" + "with_refresh";
    }

    return res.send(authURL);
  });


  return [
    {
      method: "GET",
      name: "microsoft Code API",
      url: "/v2/api/lambda/microsoft/code",
      successPayload:
        "{error: false, role: 'admin', token: 'jwt token', expire_at: 60, user_id: 1}",
      queryBody: [{ code: "role", state: "projectId~secret" }],
      needToken: false,
      errors: [
        {
          name: "403",
          query: [{ key: "state", value: "projectId~secret" }],
          response:
            '{"error": true, "failure": "access token", "message": "Something went wrong"}',
        },
        {
          name: "403",
          query: [{ key: "state", value: "projectId~secret" }],
          response:
            '{"error": true, "failure": "me", "message": "Something went wrong"}',
        },
      ],
    },
    {
      method: "GET",
      name: "microsoft Login API",
      url: "/v2/api/lambda/microsoft/login",
      successPayload: "['Will redirect to microsoft login with auth link']",
      queryBody: [{ key: "role", value: "admin" }],
      needToken: false,
      errors: [
        {
          name: "403",
          query: [{ key: "state", value: "projectId~secret" }],
          response:
            '{"error": true, "failure": "access token", "message": "Something went wrong"}',
        },
        {
          name: "403",
          query: [{ key: "state", value: "projectId~secret" }],
          response:
            '{"error": true, "failure": "me", "message": "Something went wrong"}',
        },
      ],
    },
  ];
};

// API definition for Postman collection
module.exports.getPostmanDefinition = function () {
  return [
    {
      method: "GET",
      name: "microsoft Code API",
      url: "/v2/api/lambda/microsoft/code",
      successPayload:
        "{error: false, role: 'admin', token: 'jwt token', expire_at: 60, user_id: 1}",
      queryBody: [{ code: "role", state: "projectId~secret" }],
      needToken: false,
      errors: [
        {
          name: "403",
          query: [{ key: "state", value: "projectId~secret" }],
          response:
            '{"error": true, "failure": "access token", "message": "Something went wrong"}',
        },
        {
          name: "403",
          query: [{ key: "state", value: "projectId~secret" }],
          response:
            '{"error": true, "failure": "me", "message": "Something went wrong"}',
        },
      ],
    },
    {
      method: "GET",
      name: "microsoft Login API",
      url: "/v2/api/lambda/microsoft/login",
      successPayload: "['Will redirect to microsoft login with auth link']",
      queryBody: [{ key: "role", value: "admin" }],
      needToken: false,
      errors: [
        {
          name: "403",
          query: [{ key: "state", value: "projectId~secret" }],
          response:
            '{"error": true, "failure": "access token", "message": "Something went wrong"}',
        },
        {
          name: "403",
          query: [{ key: "state", value: "projectId~secret" }],
          response:
            '{"error": true, "failure": "me", "message": "Something went wrong"}',
        },
      ],
    },
  ];
};