const TokenMiddleware = require("../../../baas/middleware/TokenMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");

module.exports = function (app) {
  console.log("Loading equipment routes...");

  // Get all equipment with pagination and search
  app.get(
    "/v1/api/longtermhire/super_admin/equipment",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        console.log("GET /v1/api/longtermhire/super_admin/equipment called");
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        // Extract query parameters for pagination and search
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const categoryId = req.query.categoryId || "";
        const categoryName = req.query.categoryName || "";
        const equipmentId = req.query.equipmentId || "";
        const equipmentName = req.query.equipmentName || "";
        const offset = (page - 1) * limit;

        // Build search conditions
        let searchConditions = [];
        let searchParams = [];

        if (categoryId) {
          searchConditions.push("category_id = ?");
          searchParams.push(categoryId);
        }
        if (categoryName) {
          searchConditions.push("category_name LIKE ?");
          searchParams.push(`%${categoryName}%`);
        }
        if (equipmentId) {
          searchConditions.push("e.equipment_id = ?");
          searchParams.push(equipmentId);
        }
        if (equipmentName) {
          searchConditions.push("e.equipment_name LIKE ?");
          searchParams.push(`%${equipmentName}%`);
        }

        const whereClause =
          searchConditions.length > 0
            ? `WHERE ${searchConditions.join(" AND ")}`
            : "";

        // Get equipment with pagination and content details
        const equipmentQuery = `
        SELECT 
          e.*,
          c.description,
          c.banner_description,
          c.image_url as content_image,
          CASE WHEN ci.id IS NOT NULL THEN 
            GROUP_CONCAT(
              JSON_OBJECT(
                'id', ci.id,
                'image_url', ci.image_url,
                'image_order', ci.image_order,
                'is_main', ci.is_main,
                'caption', ci.caption
              ) SEPARATOR '|||'
            )
          ELSE NULL END as images
        FROM longtermhire_equipment_item e
        LEFT JOIN longtermhire_content c ON e.id = c.equipment_id
        LEFT JOIN longtermhire_content_images ci ON c.id = ci.content_id
        ${whereClause}
        GROUP BY e.id
        ORDER BY e.category_name, e.position ASC, e.equipment_name
        LIMIT ? OFFSET ?
      `;

        // Get total count for pagination
        const countQuery = `
        SELECT COUNT(*) as total
        FROM longtermhire_equipment_item e
        ${whereClause}
      `;

        const equipment = await sdk.rawQuery(equipmentQuery, [
          ...searchParams,
          limit,
          offset,
        ]);
        const countResult = await sdk.rawQuery(countQuery, searchParams);
        const total = countResult[0]?.total || 0;

        // Process equipment data to parse images array
        const processedEquipment = equipment.map((item) => {
          const processedItem = { ...item };

          // Parse images array if it exists
          if (item.images) {
            try {
              const imageStrings = item.images.split("|||");
              const parsedImages = imageStrings
                .map((imgStr) => {
                  try {
                    return JSON.parse(imgStr.trim());
                  } catch (e) {
                    return null;
                  }
                })
                .filter(
                  (img) =>
                    img !== null && img.id !== null && img.image_url !== null
                );

              processedItem.images = parsedImages;
            } catch (e) {
              console.error("Error parsing images for equipment:", item.id, e);
              processedItem.images = [];
            }
          } else {
            processedItem.images = [];
          }

          return processedItem;
        });

        return res.status(200).json({
          error: false,
          data: processedEquipment,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
          },
        });
      } catch (error) {
        console.error("Get equipment error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Add equipment
  app.post(
    "/v1/api/longtermhire/super_admin/equipment",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        console.log("POST /v1/api/longtermhire/super_admin/equipment called");
        console.log("Equipment data:", req.body);

        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const {
          categoryId,
          category,
          equipmentId,
          equipmentName,
          basePrice,
          minimumDuration,
          availability,
          description,
          position,
        } = req.body;

        // Get a valid user ID (use the current admin user ID 2)
        const userQuery = `SELECT id FROM longtermhire_user WHERE role_id = 'super_admin' LIMIT 1`;
        const userResult = await sdk.rawQuery(userQuery, []);
        const userId = userResult.length > 0 ? userResult[0].id : 2; // fallback to current admin ID 2

        const currentTime = new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

        // Insert equipment into database using raw SQL
        const insertSQL = `
        INSERT INTO longtermhire_equipment_item
        (category_id, category_name, equipment_id, equipment_name, base_price, minimum_duration, availability, position, user_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

        const result = await sdk.rawQuery(insertSQL, [
          categoryId || `C${Date.now()}`,
          category,
          equipmentId || `E${Date.now()}`,
          equipmentName,
          basePrice,
          `${minimumDuration} Months`,
          availability !== undefined ? availability : true,
          position || 0,
          userId,
          currentTime,
          currentTime,
        ]);

        console.log("Equipment created with ID:", result.insertId);

        return res.status(200).json({
          error: false,
          message: "Equipment added successfully",
          data: {
            id: result.insertId,
            category_id: categoryId || `C${Date.now()}`,
            category_name: category,
            equipment_id: equipmentId || `E${Date.now()}`,
            equipment_name: equipmentName,
            base_price: basePrice,
            minimum_duration: `${minimumDuration} Months`,
            availability: availability !== undefined ? availability : true,
          },
        });
      } catch (error) {
        console.error("Add equipment error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Update equipment
  app.put(
    "/v1/api/longtermhire/super_admin/equipment/:id",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        console.log(
          "PUT /v1/api/longtermhire/super_admin/equipment/:id called"
        );
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const {
          categoryId,
          category,
          equipmentId,
          equipmentName,
          basePrice,
          minimumDuration,
          availability,
          description,
          position,
        } = req.body;

        const equipmentIdParam = req.params.id;
        const currentTime = new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

        // Update equipment in database
        const updateSQL = `
          UPDATE longtermhire_equipment_item
          SET
            category_id = ?,
            category_name = ?,
            equipment_id = ?,
            equipment_name = ?,
            base_price = ?,
            minimum_duration = ?,
            availability = ?,
            position = ?,
            updated_at = ?
          WHERE id = ?
        `;

        await sdk.rawQuery(updateSQL, [
          categoryId,
          category,
          equipmentId,
          equipmentName,
          basePrice,
          minimumDuration || "3 Months",
          availability !== undefined ? availability : 1,
          position || 0,
          currentTime,
          equipmentIdParam,
        ]);

        return res.status(200).json({
          error: false,
          message: "Equipment updated successfully",
        });
      } catch (error) {
        console.error("Update equipment error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Update equipment availability
  app.put(
    "/v1/api/longtermhire/super_admin/equipment/:id/availability",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        console.log(
          "PUT /v1/api/longtermhire/super_admin/equipment/:id/availability called"
        );
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const { availability } = req.body;
        const equipmentId = req.params.id;
        const currentTime = new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

        // Update availability in database
        const updateSQL = `
          UPDATE longtermhire_equipment_item
          SET availability = ?, updated_at = ?
          WHERE id = ?
        `;

        await sdk.rawQuery(updateSQL, [availability, currentTime, equipmentId]);

        return res.status(200).json({
          error: false,
          message: "Equipment availability updated successfully",
        });
      } catch (error) {
        console.error("Update equipment availability error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Delete equipment
  app.delete(
    "/v1/api/longtermhire/super_admin/equipment/:id",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        console.log(
          "DELETE /v1/api/longtermhire/super_admin/equipment/:id called"
        );

        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const equipmentId = req.params.id;

        // Check if equipment exists
        const checkSQL =
          "SELECT id FROM longtermhire_equipment_item WHERE id = ?";
        const equipmentExists = await sdk.rawQuery(checkSQL, [equipmentId]);

        if (!equipmentExists || equipmentExists.length === 0) {
          return res.status(404).json({
            error: true,
            message: "Equipment not found",
          });
        }

        // Delete related records first (client equipment assignments)
        await sdk.rawQuery(
          "DELETE FROM longtermhire_client_equipment WHERE equipment_id = ?",
          [equipmentId]
        );

        // Delete equipment content if any (using correct table name)
        try {
          await sdk.rawQuery(
            "DELETE FROM longtermhire_content WHERE equipment_id = ?",
            [equipmentId]
          );
        } catch (contentError) {
          console.log("No content to delete for equipment:", equipmentId);
        }

        // Delete the equipment
        await sdk.rawQuery(
          "DELETE FROM longtermhire_equipment_item WHERE id = ?",
          [equipmentId]
        );

        return res.status(200).json({
          error: false,
          message: "Equipment deleted successfully",
        });
      } catch (error) {
        console.error("Delete equipment error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Remove equipment discount for custom pricing
  app.delete(
    "/v1/api/longtermhire/super_admin/remove-equipment-discount",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        console.log(
          "DELETE /v1/api/longtermhire/super_admin/remove-equipment-discount called"
        );

        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const { client_user_id, equipment_id } = req.body;

        if (!client_user_id || !equipment_id) {
          return res.status(400).json({
            error: true,
            message: "Client user ID and equipment ID are required",
          });
        }

        console.log(
          "Removing equipment discount for client:",
          client_user_id,
          "equipment:",
          equipment_id
        );

        // Check if client exists
        const clientCheckSQL = `
          SELECT id FROM longtermhire_client 
          WHERE user_id = ?
        `;
        const clientExists = await sdk.rawQuery(clientCheckSQL, [
          client_user_id,
        ]);

        if (!clientExists || clientExists.length === 0) {
          return res.status(404).json({
            error: true,
            message: "Client not found",
          });
        }

        // Check if equipment exists
        const equipmentCheckSQL = `
          SELECT id FROM longtermhire_equipment_item 
          WHERE id = ?
        `;
        const equipmentExists = await sdk.rawQuery(equipmentCheckSQL, [
          equipment_id,
        ]);

        if (!equipmentExists || equipmentExists.length === 0) {
          return res.status(404).json({
            error: true,
            message: "Equipment not found",
          });
        }

        // Remove custom equipment discount (if it exists in a custom discount table)
        // For now, we'll remove the equipment assignment which effectively removes the discount
        const removeAssignmentSQL = `
          DELETE FROM longtermhire_client_equipment 
          WHERE client_user_id = ? AND equipment_id = ?
        `;

        const result = await sdk.rawQuery(removeAssignmentSQL, [
          client_user_id,
          equipment_id,
        ]);

        console.log("Equipment discount removed successfully");

        return res.status(200).json({
          error: false,
          message: "Equipment discount removed successfully",
          data: {
            client_user_id,
            equipment_id,
            removed: true,
          },
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

  // Original add equipment route (keeping for compatibility)
  app.post(
    "/v1/api/longtermhire/super_admin/equipment_old",
    TokenMiddleware,
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId(req.projectId);

        const {
          category_id,
          category_name,
          equipment_id,
          equipment_name,
          base_price,
          minimum_duration,
        } = req.body;

        sdk.setTable("equipment_item");
        const result = await sdk.insert({
          category_id,
          category_name,
          equipment_id,
          equipment_name,
          base_price,
          minimum_duration: minimum_duration || "3 Months",
          availability: true,
          user_id: req.user_id,
          created_at: new Date(),
          updated_at: new Date(),
        });

        return res.status(200).json({
          error: false,
          message: "Equipment added successfully",
          data: { id: result.insertId },
        });
      } catch (error) {
        console.error("Add equipment error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Get all equipment
  app.get(
    "/v1/api/longterm-hire/super_admin/equipment",
    TokenMiddleware,
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId(req.projectId);

        sdk.setTable("equipment_item");
        const equipment = await sdk.get({}, "*", "id", "DESC");

        return res.status(200).json({
          error: false,
          data: equipment,
        });
      } catch (error) {
        console.error("Get equipment error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Update equipment availability
  app.put(
    "/v1/api/longterm-hire/super_admin/equipment/:id/availability",
    TokenMiddleware,
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId(req.projectId);

        const { availability } = req.body;

        sdk.setTable("equipment_item");
        await sdk.update(
          {
            availability: availability,
            updated_at: new Date(),
          },
          req.params.id
        );

        return res.status(200).json({
          error: false,
          message: "Equipment availability updated successfully",
        });
      } catch (error) {
        console.error("Update equipment availability error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Update equipment
  app.put(
    "/v1/api/longterm-hire/super_admin/equipment/:id",
    TokenMiddleware,
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId(req.projectId);

        const {
          category_id,
          category_name,
          equipment_id,
          equipment_name,
          base_price,
          minimum_duration,
        } = req.body;

        sdk.setTable("equipment_item");
        await sdk.update(
          {
            category_id,
            category_name,
            equipment_id,
            equipment_name,
            base_price,
            minimum_duration,
            updated_at: new Date(),
          },
          req.params.id
        );

        return res.status(200).json({
          error: false,
          message: "Equipment updated successfully",
        });
      } catch (error) {
        console.error("Update equipment error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Delete equipment
  app.delete(
    "/v1/api/longterm-hire/super_admin/equipment/:id",
    TokenMiddleware,
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId(req.projectId);

        sdk.setTable("equipment_item");
        await sdk.delete({}, req.params.id);

        return res.status(200).json({
          error: false,
          message: "Equipment deleted successfully",
        });
      } catch (error) {
        console.error("Delete equipment error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );
};
