const TokenMiddleware = require("../../../baas/middleware/TokenMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");

module.exports = function (app) {
  console.log("Loading request routes...");

  // Get equipment requests
  app.get(
    "/v1/api/longtermhire/super_admin/requests",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        console.log("GET /v1/api/longtermhire/super_admin/requests called");

        // For now, return empty array
        const requests = [];

        return res.status(200).json({
          error: false,
          data: requests,
        });
      } catch (error) {
        console.error("Get requests error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Update request status
  app.put(
    "/v1/api/longtermhire/super_admin/requests/:id/status",
    async (req, res) => {
      try {
        console.log(
          "PUT /v1/api/longtermhire/super_admin/requests/:id/status called"
        );

        // For now, return success
        return res.status(200).json({
          error: false,
          message: "Request status updated successfully",
        });
      } catch (error) {
        console.error("Update request status error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Update request status
  app.put(
    "/v1/api/longterm-hire/super_admin/requests/:id/status",
    TokenMiddleware,
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId(req.projectId);

        const { status, notes } = req.body;

        if (status === undefined) {
          return res.status(400).json({
            error: true,
            message: "Status is required",
          });
        }

        sdk.setTable("request");
        await sdk.update(
          {
            status: status,
            notes: notes || null,
            reviewed_by: req.user_id,
            updated_at: new Date(),
          },
          req.params.id
        );

        return res.status(200).json({
          error: false,
          message: "Request status updated successfully",
        });
      } catch (error) {
        console.error("Update request status error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Client routes for submitting requests
  app.post(
    "/v1/api/longterm-hire/member/requests",
    TokenMiddleware,
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId(req.projectId);

        const { equipment_id, notes } = req.body;

        if (!equipment_id) {
          return res.status(400).json({
            error: true,
            message: "Equipment ID is required",
          });
        }

        sdk.setTable("request");
        const result = await sdk.insert({
          client_user_id: req.user_id,
          equipment_id: equipment_id,
          status: 0, // Pending
          notes: notes || null,
          created_at: new Date(),
          updated_at: new Date(),
        });

        return res.status(200).json({
          error: false,
          message: "Request submitted successfully",
          data: { id: result.insertId },
        });
      } catch (error) {
        console.error("Submit request error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Get client's own requests
  app.get(
    "/v1/api/longtermhire/member/requests",
    TokenMiddleware(),
    RoleMiddleware(["member"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const requests = await sdk.rawQuery(
          `
          SELECT r.*, e.equipment_name, e.category_name, e.base_price
          FROM longtermhire_request r
          JOIN longtermhire_equipment_item e ON r.equipment_id = e.id
          WHERE r.client_user_id = ?
          ORDER BY r.created_at DESC
        `,
          [req.user_id]
        );

        return res.status(200).json({
          error: false,
          data: requests,
        });
      } catch (error) {
        console.error("Get client requests error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );
};
