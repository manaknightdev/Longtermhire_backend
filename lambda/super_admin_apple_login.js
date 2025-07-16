const AuthService = require("../../../baas/services/AuthService");
const JwtService = require("../../../baas/services/JwtService");
const jwt = require("jsonwebtoken");
const appleSignin = require("apple-signin-auth");
const BackendSDK = require("../../../baas/core/BackendSDK");

const middlewares = [

];

module.exports = function (app) {

  app.get("/v1/api/longtermhire/super_admin/lambda/apple/login", middlewares, async function (req, res) {
    try {
      const config = app.get("configuration");
      const projectId = "longtermhire";
      if (req.query.role === "admin" || req.query.role === "super_admin")
        return res
          .status(403)
          .json({ error: true, message: "Can't register admin with this API" });

      const Role = require(`./roles/super_admin`);
      if (!Role.permissions.canAppleLogin) {
        return res.status(403).json({
          error: true,
          message: "Forbidden access.",
        });
      }

      let companyState = "";
      if (req.query.company_id != undefined) {
        companyState += "~" + req.query.company_id;
      }

      const hostname = projectId + ".manaknightdigital.com";

      const options = {
        clientID: config.apple.client_id, // Apple Client ID
        redirectUri: config.apple.redirect_url,
        state: "longtermhire" + "~" + req.query.role ?? "super_admin" + "~" + hostname + companyState,
        responseMode: "query" | "fragment" | "form_post",
        scope: "name email",
      };

      const authorizationUrl = appleSignin.getAuthorizationUrl(options);


      return res.send(authorizationUrl);
    } catch (err) {
      return res.status(403).json({
        error: true,
        message: err.message,
      });
    }
  });

  app.post("/v1/api/longtermhire/super_admin/lambda/apple/code", async function (req, res) {
    let project = { hostname: "mkdlabs.com" };

    try {
      const config = app.get("configuration");
      const { code, state } = req.body;

      // Part: Sample Req Body
      // req.body = {
      //   state: "ZXJnbzprNWdvNGU5MTh4MnVsanV2OHJxcXAyYXM=~customer",
      //   code: "cf6ebfa17f96737efea8dc55a.0.rrsuw.YZcHfL15sPkt_bXw6QtXSg",
      //   user: '{"name":{"firstName":"ABC","lastName":"DEF"},"email":"j86sfvg@privaterelay.appleid.com"}'
      // };

      const parts = state.split("~");
      const base64DecodeBuffer = Buffer.from(parts[0], "base64");
      let base64Decode = base64DecodeBuffer.toString("ascii").split(":");
      const projectId = base64Decode[0] ?? "longtermhire";
      const role = parts[1] ?? "super_admin";
      const database = base64Decode[2] ?? config.databaseName;

      let sdk = app.get("sdk");
      sdk.setDatabase(database);
      sdk.setProjectId(projectId);

      // Remark: Fetching Project
      if (config.env == "production") {
        project = require("../project");
      } else {
        sdk.setProjectId("manaknight");
        sdk.setTable("projects");

        project = (
          await sdk.get({
            project_id: projectId,
          })
        )[0];
      }

      const clientSecret = appleSignin.getClientSecret({
        clientID: config.apple.client_id, // Apple Client ID
        teamID: config.apple.team_id, // Apple Developer Team ID.
        privateKey: config.apple.private_key, // private key associated with your client ID. -- Or provide a `privateKeyPath` property instead.
        keyIdentifier: config.apple.key_id, // identifier of the private key.
      });

      const options = {
        clientID: config.apple.client_id, // Apple Client ID
        redirectUri: config.apple.redirect_url, // use the same value which you passed to authorisation URL.
        clientSecret: clientSecret,
      };

      const tokenResponse = await appleSignin.getAuthorizationToken(
        code,
        options
      );

      const identityToken = tokenResponse.id_token;

      const data = jwt.decode(identityToken, { complete: true });

      if (!data) {
        throw new Error("Invalid_grant");
      }

      const kid = data.header.kid;

      const appleSigningKey = await JwtService.getAppleSigningKeys(kid);

      const payload = await JwtService.verifyAppleLogin(
        identityToken,
        appleSigningKey
      );
      // Part: Sample Payload Res
      // payload = {
      //   iss: "https://appleid.apple.com",
      //   aud: "mkd.baas.serviceid",
      //   exp: 1695751588,
      //   iat: 1695665188,
      //   sub: "001246.76ff24dgh1a8ce0f9ba236.1806",
      //   at_hash: "xN29677PtPM-wycU2S8GQ",
      //   email: "j86sfvgqq@privaterelay.appleid.com",
      //   email_verified: "true",
      //   is_private_email: "true",
      //   auth_time: 1695665186,
      //   nonce_supported: true
      // };

      const user_details = {
        first_name: " ",
        last_name: " ",
        email: payload.email,
      };

      if (req.body.user) {
        const { name, email } = JSON.parse(req.body.user);

        // Part: Sample Parsed User Info
        // parsedUser = {
        //   name: { firstName: "ABC", lastName: "DEF" },
        //   email: "jknsmbsyq8@privaterelay.appleid.com"
        // };

        user_details.first_name = name.firstName;
        user_details.last_name = name.lastName;
      }

      const service = new AuthService();
      if (!user_details.email) {
        throw new Error("Could not access email address");
      }

      let apple_login_res;
      if (parts[2]) {
        const company_id = parts[2];
        sdk.setProjectId(projectId);
        sdk.setTable("company");
        const company = await sdk.findOne("company", { id: company_id });
        if (!company) {
          return res
            .status(404)
            .json({ message: "Company Not found", error: true });
        }
        apple_login_res = await service.appleLogin(
          sdk,
          projectId,
          user_details,
          identityToken,
          role,
          company_id
        );
      } else {
        apple_login_res = await service.appleLogin(
          sdk,
          projectId,
          user_details,
          identityToken,
          role
        );
      }

      const { id, is_newuser } = apple_login_res;
      let new_jwt = JwtService.createAccessToken(
        {
          user_id: id,
          role: role,
        },
        config.access_jwt_expire,
        config.jwt_key
      );

      let refreshToken = JwtService.createAccessToken(
        {
          user_id: id,
          role: role,
        },
        config.refresh_jwt_expire,
        config.jwt_key
      );
      let expireDate = new Date();
      expireDate.setSeconds(
        expireDate.getSeconds() + config.refresh_jwt_expire
      );
      await service.saveRefreshToken(
        sdk,
        projectId,
        id,
        refreshToken,
        expireDate
      );

      const resData = JSON.stringify({
        error: false,
        role: role,
        access_token: new_jwt,
        refresh_token: refreshToken,
        expire_at: config.access_jwt_expire,
        user_id: id,
        state: state,
        is_newuser: is_newuser,
      });

      const encodedURI = encodeURI(resData);

      res.redirect(
        `https://${project.hostname}/login/oauth?data=${encodedURI}`
      );
    } catch (err) {
      console.log(err);

      const data = JSON.stringify({
        error: true,
        message: err.message,
      });

      const encodedURI = encodeURI(data);
      res.redirect(
        `https://${project.hostname}/login/oauth?data=${encodedURI}`
      );
      // return res.status(403).json({
      //   error: true,
      //   message: err.message
      // });
    }
  });

  return [
    {
      method: "POST",
      name: "Apple Code API",
      url: "/v2/api/lambda/apple/code",
      successPayload:
        "{error: false, role: 'admin', token: 'jwt token', expire_at: 60, user_id: 1}",
      sucessBody: [{ code: "role", state: "projectId~secret" }],
      needToken: false,
      errors: [
        {
          name: "403",
          body: { key: "state", value: "projectId~secret" },
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
      name: "Apple Login API",
      url: "/v2/api/lambda/apple/login",
      successPayload: "['Will redirect to apple login with auth link']",
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
      method: "POST",
      name: "Apple Code API",
      url: "/v2/api/lambda/apple/code",
      successPayload:
        "{error: false, role: 'admin', token: 'jwt token', expire_at: 60, user_id: 1}",
      sucessBody: [{ code: "role", state: "projectId~secret" }],
      needToken: false,
      errors: [
        {
          name: "403",
          body: { key: "state", value: "projectId~secret" },
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
      name: "Apple Login API",
      url: "/v2/api/lambda/apple/login",
      successPayload: "['Will redirect to apple login with auth link']",
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
