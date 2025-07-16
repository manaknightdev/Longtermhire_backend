// import queryString from 'query-string';


module.exports = function (app) {
  // url = https://graph.facebook.com/v4.0/oauth/access_token
  // params = client_id, client_secret, code, redirect_uri

  app.get(
    "/v1/api/longtermhire/member/lambda/facebook/login",
    async function (req, res) {
      const config = app.get("configuration");
      const role = "member";

      const projectId = "longtermhire";
      const hostname = projectId + ".manaknightdigital.com";


      const Role = require(`../roles/member`);
      if (!Role.permissions.canFacebookLogin) {
        return res.status(403).json({
          error: true,
          message: "Forbidden access.",
        });
      }

      const stringifiedParams = Object.entries({
        client_id: config.facebook.client_id,
        redirect_uri: config.facebook.callback_uri,
        scope: ["email", "user_friends"].join(","), 
        response_type: "code",
        auth_type: "rerequest",
        display: "popup"
      }).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');

      // generate facebookLoginUrl with stringifiedParams and '&state=' + req.headers['x-project'] + '~' + (req.query.role ? req.query.role : 'admin');

      let facebookLoginUrl = `https://www.facebook.com/v4.0/dialog/oauth?${stringifiedParams}&state=${projectId}~${hostname}~${role}`;
      if (req.query.company_id != undefined) {
        facebookLoginUrl += `~${req.query.company_id}`;
      }

      if (req.query.is_refresh != undefined) {
        facebookLoginUrl += "~" + "with_refresh";
      }
      // console.log(facebookLoginUrl);
      return res.send(facebookLoginUrl);
    }
  );

  return [
    {
      method: "GET",
      name: "Facebook Login API",
      url: "/v2/api/lambda/facebook/lambda",
      successPayload: "['Will redirect to facebook login with auth link']",
      queryBody: [{ key: "role", value: "admin" }],
      needToken: false,
      errors: [],
    },
    {
      method: "GET",
      name: "Facebook Code Webhook",
      url: "/v2/api/lambda/facebook/code",
      successPayload:
        '{"error": false,"role": "admin","qr_code": "qrCode","one_time_token": "token","expire_at": 60,"user_id": 1}',
      queryBody: [{ key: "state", value: "projectId~secret" }],
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
  [
    {
      method: "GET",
      name: "Facebook Login API",
      url: "/v2/api/lambda/facebook/lambda",
      successPayload: "['Will redirect to facebook login with auth link']",
      queryBody: [{ key: "role", value: "admin" }],
      needToken: false,
      errors: [],
    },
    {
      method: "GET",
      name: "Facebook Code Webhook",
      url: "/v2/api/lambda/facebook/code",
      successPayload:
        '{"error": false,"role": "admin","qr_code": "qrCode","one_time_token": "token","expire_at": 60,"user_id": 1}',
      queryBody: [{ key: "state", value: "projectId~secret" }],
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


