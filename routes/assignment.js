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

  // Assign custom discount to specific equipment for a client
  app.post(
    "/v1/api/longtermhire/super_admin/assign-equipment-discount",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        console.log("🔧 Assign equipment discount request body:", req.body);

        const sdk = app.get("sdk");
        sdk.setProjectId(req.projectId);

        const { client_user_id, equipment_id, discount_type, discount_value } =
          req.body;

        if (
          !client_user_id ||
          !equipment_id ||
          !discount_type ||
          !discount_value
        ) {
          return res.status(400).json({
            error: true,
            message:
              "Client user ID, equipment ID, discount type, and discount value are required",
          });
        }

        // Validate discount type
        if (!["percentage", "fixed"].includes(discount_type)) {
          return res.status(400).json({
            error: true,
            message: "Discount type must be 'percentage' or 'fixed'",
          });
        }

        // Validate discount value
        const discountValue = parseFloat(discount_value);
        if (isNaN(discountValue) || discountValue <= 0) {
          return res.status(400).json({
            error: true,
            message: "Discount value must be a positive number",
          });
        }

        if (discount_type === "percentage" && discountValue > 100) {
          return res.status(400).json({
            error: true,
            message: "Percentage discount cannot exceed 100%",
          });
        }

        // Check if equipment is assigned to this client
        console.log("🔍 Looking for equipment assignment:", {
          client_user_id,
          equipment_id,
          client_user_id_type: typeof client_user_id,
          equipment_id_type: typeof equipment_id,
        });

        sdk.setTable("client_equipment");

        // Ensure values are properly converted to numbers
        const searchClientId = parseInt(client_user_id);
        const searchEquipmentId = parseInt(equipment_id);

        if (isNaN(searchClientId) || isNaN(searchEquipmentId)) {
          return res.status(400).json({
            error: true,
            message: "Invalid client user ID or equipment ID format",
          });
        }

        // Use raw SQL query instead of findOne to avoid the object conversion issue
        const findAssignmentSQL = `
          SELECT id FROM longtermhire_client_equipment 
          WHERE client_user_id = ? AND equipment_id = ?
        `;

        const existingAssignment = await sdk.rawQuery(findAssignmentSQL, [
          searchClientId,
          searchEquipmentId,
        ]);

        console.log(
          "🔍 Equipment assignment search result:",
          existingAssignment
        );

        if (!existingAssignment || existingAssignment.length === 0) {
          return res.status(400).json({
            error: true,
            message: "Equipment is not assigned to this client",
          });
        }

        // ALTERNATING LOGIC: When assigning equipment-specific custom discount, remove pricing package
        const deletePricingSQL = `DELETE FROM longtermhire_client_pricing WHERE client_user_id = ?`;
        await sdk.rawQuery(deletePricingSQL, [searchClientId]);
        console.log(
          "Removed existing pricing package assignment for client (equipment custom discount assignment):",
          searchClientId
        );

        const assignmentId = existingAssignment[0].id;

        // Update the assignment with custom discount using raw SQL
        const updateSQL = `
          UPDATE longtermhire_client_equipment 
          SET custom_discount_type = ?, custom_discount_value = ?
          WHERE id = ?
        `;

        await sdk.rawQuery(updateSQL, [
          discount_type,
          discountValue,
          assignmentId,
        ]);

        return res.status(200).json({
          error: false,
          message:
            "Custom discount assigned to equipment successfully (pricing package removed)",
          data: {
            client_user_id: searchClientId,
            equipment_id: searchEquipmentId,
            pricing_removed: true,
          },
        });
      } catch (error) {
        console.error("Assign equipment discount error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Get all equipment-specific custom discounts for a client
  app.get(
    "/v1/api/longtermhire/super_admin/client-equipment-discounts/:client_user_id",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId(req.projectId);

        const { client_user_id } = req.params;

        if (!client_user_id) {
          return res.status(400).json({
            error: true,
            message: "Client user ID is required",
          });
        }

        // Get all equipment assignments with custom discounts for this client
        const getDiscountsSQL = `
          SELECT 
            ce.id as assignment_id,
            ce.client_user_id,
            ce.equipment_id,
            ce.custom_discount_type,
            ce.custom_discount_value,
            ce.assigned_by,
            ce.created_at,
            e.equipment_name,
            e.category_name,
            e.base_price,
            e.minimum_duration,
            u.email as assigned_by_email
          FROM longtermhire_client_equipment ce
          JOIN longtermhire_equipment_item e ON ce.equipment_id = e.id
          LEFT JOIN longtermhire_user u ON ce.assigned_by = u.id
          WHERE ce.client_user_id = ? 
          AND (ce.custom_discount_type IS NOT NULL OR ce.custom_discount_value IS NOT NULL)
          ORDER BY e.category_name, e.equipment_name
        `;

        const discounts = await sdk.rawQuery(getDiscountsSQL, [client_user_id]);

        return res.status(200).json({
          error: false,
          data: discounts || [],
          message: "Equipment-specific custom discounts retrieved successfully",
        });
      } catch (error) {
        console.error("Get client equipment discounts error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Remove custom discount from equipment
  app.delete(
    "/v1/api/longtermhire/super_admin/remove-equipment-discount",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId(req.projectId);

        const { client_user_id, equipment_id } = req.body;

        if (!client_user_id || !equipment_id) {
          return res.status(400).json({
            error: true,
            message: "Client user ID and equipment ID are required",
          });
        }

        // Check if equipment is assigned to this client
        sdk.setTable("client_equipment");
        const existingAssignment = await sdk.findOne({
          client_user_id: client_user_id,
          equipment_id: equipment_id,
        });

        if (!existingAssignment) {
          return res.status(400).json({
            error: true,
            message: "Equipment is not assigned to this client",
          });
        }

        // Remove custom discount
        await sdk.update(existingAssignment.id, {
          custom_discount_type: null,
          custom_discount_value: null,
        });

        return res.status(200).json({
          error: false,
          message: "Custom discount removed from equipment successfully",
        });
      } catch (error) {
        console.error("Remove equipment discount error:", error);
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
