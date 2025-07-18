const TokenMiddleware = require("../../../baas/middleware/TokenMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");

module.exports = function (app) {
  // Assign equipment to client
  app.post(
    "/v1/api/longtermhire/super_admin/assign-equipment",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId(req.projectId);

        const { client_user_id, equipment_ids } = req.body;

        if (
          !client_user_id ||
          !equipment_ids ||
          !Array.isArray(equipment_ids)
        ) {
          return res.status(400).json({
            error: true,
            message: "Client user ID and equipment IDs array are required",
          });
        }

        // Remove existing assignments for this client
        sdk.setTable("client_equipment");
        await sdk.delete({ client_user_id: client_user_id });

        // Add new assignments
        for (const equipment_id of equipment_ids) {
          await sdk.insert({
            client_user_id: client_user_id,
            equipment_id: equipment_id,
            assigned_by: req.user_id,
            created_at: new Date(),
          });
        }

        return res.status(200).json({
          error: false,
          message: "Equipment assigned successfully",
        });
      } catch (error) {
        console.error("Assign equipment error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Get client equipment assignments
  app.get(
    "/v1/api/longtermhire/super_admin/client-equipment/:client_user_id",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId(req.projectId);

        sdk.setTable("client_equipment");
        const assignments = await sdk.callRawQuery(
          `
          SELECT ce.*, e.equipment_name, e.category_name, e.base_price
          FROM longterm-hire_client_equipment ce
          JOIN longterm-hire_equipment_item e ON ce.equipment_id = e.id
          WHERE ce.client_user_id = ?
        `,
          [req.params.client_user_id]
        );

        return res.status(200).json({
          error: false,
          data: assignments,
        });
      } catch (error) {
        console.error("Get client equipment error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Assign pricing package to client
  app.post(
    "/v1/api/longtermhire/super_admin/assign-pricing",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId(req.projectId);

        const { client_user_id, pricing_package_id } = req.body;

        if (!client_user_id || !pricing_package_id) {
          return res.status(400).json({
            error: true,
            message: "Client user ID and pricing package ID are required",
          });
        }

        // Remove existing pricing assignment for this client
        sdk.setTable("client_pricing");
        await sdk.delete({ client_user_id: client_user_id });

        // Add new pricing assignment
        await sdk.insert({
          client_user_id: client_user_id,
          pricing_package_id: pricing_package_id,
          assigned_by: req.user_id,
          created_at: new Date(),
        });

        return res.status(200).json({
          error: false,
          message: "Pricing package assigned successfully",
        });
      } catch (error) {
        console.error("Assign pricing error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Get client pricing assignment
  app.get(
    "/v1/api/longtermhire/super_admin/client-pricing/:client_user_id",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId(req.projectId);

        sdk.setTable("client_pricing");
        const assignment = await sdk.callRawQuery(
          `
          SELECT cp.*, pp.name, pp.description, pp.discount_type, pp.discount_value
          FROM longterm-hire_client_pricing cp
          JOIN longterm-hire_pricing_package pp ON cp.pricing_package_id = pp.id
          WHERE cp.client_user_id = ?
        `,
          [req.params.client_user_id]
        );

        return res.status(200).json({
          error: false,
          data: assignment.length > 0 ? assignment[0] : null,
        });
      } catch (error) {
        console.error("Get client pricing error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );
};
