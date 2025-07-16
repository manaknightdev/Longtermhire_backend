const AuthService = require("../../../baas/services/AuthService");
const JwtService = require("../../../baas/services/JwtService");
const NodeGoogleLogin = require("node-google-login");
const ManaKnightSDK = require("../../../baas/core/ManaKnightSDK");
const BackendSDK = require("../../../baas/core/BackendSDK");
const { ideahub_v1alpha } = require("googleapis");


module.exports = function (app) {

  app.get("/v1/api/longtermhire/member/lambda/google/code/mobile", async function (req, res) {
    //You have to add these userinfo.email,
    // userinfo.profile in the content screen through google console to be abble to use this endpoint.
    // It will require serverAuthcode from the Android/ IOS app, which we simply call code in backend.
    // For IOS/Android dev pass the server client id from config file, and the clientId will be
    // the ones generated for their app.

    const projectId = "longtermhire";
    const Role = require(`./roles/member`);
    if (!Role.permissions.canGoogleLogin) {
      return res.status(403).json({
        error: true,
        message: "Forbidden access",
      });
    }
    const config = app.get("configuration");

    const role = req.query.role ?? "member";
    const needRefreshToken = req.query.is_refresh ?? false;
    let refreshToken = undefined;

    const googleConfig = {
      clientID: config.google.client_id,
      clientSecret: config.google.client_secret,
      redirectURL: config.google.redirect_url,
      defaultScope: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
    };

    let sdk = app.get("sdk")

    const googleLogin = new NodeGoogleLogin(googleConfig);

    try {
      const userProfile = await googleLogin.getUserProfile(req.query.code);
      let service = new AuthService();

      let id;
      if (req.query.company_id) {
        const company_id = req.query.company_id;
        sdk.setProjectId(projectId);
        sdk.setTable("company");
        const company = await sdk.findOne("company", { id: company_id });
        if (!company) {
          return res
            .status(404)
            .json({ message: "Company Not found", error: true });
        }
        id = await service.googleLogin(
          sdk,
          projectId,
          userProfile.user,
          userProfile.tokens,
          role,
          company_id
        );
      } else {
        id = await service.googleLogin(
          sdk,
          projectId,
          userProfile.user,
          userProfile.tokens,
          role
        );
      }

      if (typeof id == "string") {
        return res.status(403).json({
          error: true,
          message: id,
        });
      }

      if (needRefreshToken) {
        refreshToken = JwtService.createAccessToken(
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
      }

      return res.status(200).json({
        error: false,
        role: role,
        token: JwtService.createAccessToken(
          {
            user_id: id,
            role: role,
          },
          config.access_jwt_expire,
          config.jwt_key
        ),
        expire_at: config.access_jwt_expire,
        user_id: id,
        refresh_token: refreshToken,
      });
    } catch (error) {
      console.log(error);
      return res.status(403).json({
        error: true,
        message: "Invalid Credentials",
        trace: error,
      });
    }
  });

  app.get("/v1/api/longtermhire/member/lambda/google/login", async function (req, res) {
    const Role = require(`../roles/member`);
    if (!Role.permissions.canGoogleLogin) {
      return res.status(403).json({
        error: true,
        message: "Forbidden access",
      });
    }

    const config = app.get("configuration");

    const googleConfig = {
      clientID: config.google.client_id,
      clientSecret: config.google.client_secret,
      redirectURL: config.google.redirect_url,
      defaultScope: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
    };
    const googleLogin = new NodeGoogleLogin(googleConfig);
    const encodedProjectId = Buffer.from(`longtermhire:_`).toString("base64");
    const userRole = "member";

    let state = {
      project_id: encodedProjectId,
      role: userRole,
      hostname: "longtermhire.manaknightdigital.com"
    }

    if (req.query.company_id != undefined) {
      state.company_id = req.query.company_id;
    }
    if (req.query.is_refresh != undefined) {
      state.is_refresh = "with_refresh";
    }


    let authURL =
    googleLogin.generateAuthUrl() +
    "&state=" + JSON.stringify(state);
     


    return res.send(authURL);
  });

  return [
    {
      method: "GET",
      name: "Google Code API",
      url: "/v2/api/lambda/google/code",
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
      name: "Google Login API",
      url: "/v2/api/lambda/google/login",
      successPayload: "['Will redirect to google login with auth link']",
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
      name: "Google Code API",
      url: "/v2/api/lambda/google/code",
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
      name: "Google Login API",
      url: "/v2/api/lambda/google/login",
      successPayload: "['Will redirect to google login with auth link']",
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


