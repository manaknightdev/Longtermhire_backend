const TokenMiddleware = require("../../../baas/middleware/TokenMiddleware");

const middlewares = [TokenMiddleware()];

const handleGetProfile = async (req, res, sdk) => {
  try {
    // Get user data
    sdk.setProjectId("longtermhire");
    const user = await sdk.findOne("user", { id: req.user_id });

    if (!user) {
      return res.status(401).json({
        error: true,
        message: "Invalid Credentials",
      });
    }
    const userData = JSON.parse(user?.data ?? "");
    // console.log('user', userData)

    // Get user preferences
    const preferences = await sdk.findOne("preference", {
      user_id: req.user_id,
    });

    return res.status(200).json({
      error: false,
      model: {
        ...user,
        id: user.id,
        email: user.email,
        status: user.status,
        role_id: user.role_id,
        first_name: preferences?.first_name ?? userData?.first_name,
        last_name: preferences?.last_name ?? userData?.last_name,
        phone: preferences?.phone ?? userData?.phone,
        photo: preferences?.photo ?? userData?.photo,
        data: userData,
      },
    });
  } catch (err) {
    console.error("Get profile error:", err);
    return res.status(403).json({
      error: true,
      message: err.message,
    });
  }
};

const handleUpdateProfile = async (req, res, sdk) => {
  try {
    // Check if user exists
    sdk.setProjectId("longtermhire");
    sdk.setTable("user");
    const user = await sdk.findOne("user", { id: req.user_id });

    if (!user) {
      return res.status(401).json({
        error: true,
        message: "Invalid Credentials",
      });
    }

    const userData = JSON.parse(user?.data ?? "");

    const payload = req.body.payload || req.body;
    const personalData = {
      ...userData,
      ...payload,
      first_name: payload?.first_name ?? userData?.first_name,
      last_name: payload?.last_name ?? userData?.last_name,
      phone: payload?.phone ?? userData?.phone,
      photo: payload?.photo ?? userData?.photo,
    };

    const updateData = {
      status: payload.status ?? user.status,
      data: JSON.stringify(personalData),
    };

    const updateResult = await sdk.updateById("user", req.user_id, updateData);

    if (!updateResult) {
      return res.status(403).json({
        error: true,
        message: "Update failed",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Updated",
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(403).json({
      error: true,
      message: err.message,
    });
  }
};

module.exports = function (app) {
  app.get("/v1/api/longtermhire/super_admin/lambda/profile", middlewares, async (req, res) => {
    await handleGetProfile(req, res, app.get("sdk"));
  });

  app.post("/v1/api/longtermhire/super_admin/lambda/profile", middlewares, async (req, res) => {
    await handleUpdateProfile(req, res, app.get("sdk"));
  });
};

// API definition for Postman collection
module.exports.getPostmanDefinition = function () {
  return [
    {
      method: "GET",
      name: "User Profile API",
      url: "/v1/api/longtermhire/super_admin/lambda/profile",
      successBody: "",
      successPayload:
        '{"error":false, "user": {"id": 1, "email": "user@example.com", "name": "Test User", "created_at": "2023-01-01T00:00:00.000Z"}}',
      errors: [
        {
          name: "401",
          body: "",
          response: '{"error":true,"message":"Authentication required"}',
        },
      ],
      needToken: true,
    },
    {
      method: "PUT",
      name: "Update User Profile API",
      url: "/v1/api/longtermhire/super_admin/lambda/profile",
      successBody:
        '{ "name": "Updated Name", "profile_image": "https://example.com/image.jpg" }',
      successPayload:
        '{"error":false, "message": "Profile updated successfully", "user": {"id": 1, "email": "user@example.com", "name": "Updated Name", "profile_image": "https://example.com/image.jpg"}}',
      errors: [
        {
          name: "401",
          body: '{ "name": "Updated Name" }',
          response: '{"error":true,"message":"Authentication required"}',
        },
        {
          name: "400",
          body: "{}",
          response: '{"error":true,"message":"No profile data provided"}',
        },
      ],
      needToken: true,
    },
  ];
};
