const TokenMiddleware = require("../../../baas/middleware/TokenMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");

module.exports = function (app) {
  console.log("Loading content routes...");

  // Get all content with pagination and search
  app.get(
    "/v1/api/longtermhire/super_admin/content",
    TokenMiddleware(),
    async (req, res) => {
      try {
        console.log("GET /v1/api/longtermhire/super_admin/content called");
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        // Extract query parameters for pagination and search
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const equipmentId = req.query.equipmentId || "";
        const equipmentName = req.query.equipmentName || "";
        const offset = (page - 1) * limit;

        // Build search conditions
        let searchConditions = [];
        let searchParams = [];

        if (equipmentId) {
          searchConditions.push("equipment_id = ?");
          searchParams.push(equipmentId);
        }
        if (equipmentName) {
          searchConditions.push("equipment_name LIKE ?");
          searchParams.push(`%${equipmentName}%`);
        }

        const whereClause =
          searchConditions.length > 0
            ? `WHERE ${searchConditions.join(" AND ")}`
            : "";

        // Get content with pagination
        const contentQuery = `
        SELECT * FROM longtermhire_content
        ${whereClause}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `;

        // Get total count for pagination
        const countQuery = `
        SELECT COUNT(*) as total
        FROM longtermhire_content
        ${whereClause}
      `;

        const content = await sdk.rawQuery(contentQuery, [
          ...searchParams,
          limit,
          offset,
        ]);
        const countResult = await sdk.rawQuery(countQuery, searchParams);
        const total = countResult[0]?.total || 0;

        return res.status(200).json({
          error: false,
          data: content,
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
        console.error("Get content error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Add content
  app.post(
    "/v1/api/longtermhire/super_admin/content",
    TokenMiddleware(),
    async (req, res) => {
      try {
        console.log("POST /v1/api/longtermhire/super_admin/content called");
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const {
          equipment_id,
          equipment_name,
          description,
          banner_description,
          image_url,
        } = req.body;

        if (!equipment_id || !equipment_name) {
          return res.status(400).json({
            error: true,
            message: "Equipment ID and name are required",
          });
        }

        const currentTime = new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

        // Get a valid user ID (use the first admin user)
        const userQuery = `SELECT id FROM longtermhire_user WHERE role_id = 'super_admin' LIMIT 1`;
        const userResult = await sdk.rawQuery(userQuery, []);
        const createdBy = userResult.length > 0 ? userResult[0].id : 1;

        // Insert content into database
        const insertSQL = `
        INSERT INTO longtermhire_content
        (equipment_id, equipment_name, description, banner_description, image_url, user_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

        const result = await sdk.rawQuery(insertSQL, [
          equipment_id,
          equipment_name,
          description || null,
          banner_description || null,
          image_url || null,
          createdBy,
          currentTime,
          currentTime,
        ]);

        return res.status(200).json({
          error: false,
          message: "Content created successfully",
          data: { id: result.insertId },
        });
      } catch (error) {
        console.error("Save content error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Get content by equipment ID
  app.get(
    "/v1/api/longtermhire/super_admin/content/:equipmentId",
    TokenMiddleware(),
    async (req, res) => {
      try {
        console.log(
          "GET /v1/api/longtermhire/super_admin/content/:equipmentId called"
        );

        // For now, return empty content
        return res.status(200).json({
          error: false,
          data: null,
        });
      } catch (error) {
        console.error("Get content by equipment error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Update content
  app.put("/v1/api/longtermhire/super_admin/content/:id", async (req, res) => {
    try {
      console.log("PUT /v1/api/longtermhire/super_admin/content/:id called");
      const sdk = app.get("sdk");
      sdk.setProjectId("longtermhire");

      const {
        equipment_id,
        equipment_name,
        description,
        banner_description,
        image_url,
      } = req.body;
      const contentId = req.params.id;
      const currentTime = new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      // Check if content exists
      const checkSQL = "SELECT id FROM longtermhire_content WHERE id = ?";
      const contentExists = await sdk.rawQuery(checkSQL, [contentId]);

      if (!contentExists || contentExists.length === 0) {
        return res.status(404).json({
          error: true,
          message: "Content not found",
        });
      }

      // Update content in database
      const updateSQL = `
          UPDATE longtermhire_content
          SET
            equipment_id = ?,
            equipment_name = ?,
            description = ?,
            banner_description = ?,
            image_url = ?,
            updated_at = ?
          WHERE id = ?
        `;

      await sdk.rawQuery(updateSQL, [
        equipment_id,
        equipment_name,
        description || null,
        banner_description || null,
        image_url || null,
        currentTime,
        contentId,
      ]);

      return res.status(200).json({
        error: false,
        message: "Content updated successfully",
      });
    } catch (error) {
      console.error("Update content error:", error);
      return res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  });

  // Delete content
  app.delete(
    "/v1/api/longtermhire/super_admin/content/:contentId",
    async (req, res) => {
      try {
        console.log(
          "DELETE /v1/api/longtermhire/super_admin/content/:contentId called"
        );
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const contentId = req.params.contentId;

        // Check if content exists
        const checkSQL = "SELECT id FROM longtermhire_content WHERE id = ?";
        const contentExists = await sdk.rawQuery(checkSQL, [contentId]);

        if (!contentExists || contentExists.length === 0) {
          return res.status(404).json({
            error: true,
            message: "Content not found",
          });
        }

        // Delete the content
        await sdk.rawQuery("DELETE FROM longtermhire_content WHERE id = ?", [
          contentId,
        ]);

        return res.status(200).json({
          error: false,
          message: "Content deleted successfully",
        });
      } catch (error) {
        console.error("Delete content error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Add/Update content for equipment
  app.post(
    "/v1/api/longterm-hire/super_admin/content",
    TokenMiddleware,
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId(req.projectId);

        const {
          equipment_id,
          equipment_name,
          description,
          banner_description,
          image,
        } = req.body;

        if (!equipment_id || !equipment_name) {
          return res.status(400).json({
            error: true,
            message: "Equipment ID and name are required",
          });
        }

        sdk.setTable("content");

        // Check if content already exists for this equipment
        const existing = await sdk.get({ equipment_id: equipment_id });

        if (existing.length > 0) {
          // Update existing content
          await sdk.update(
            {
              equipment_name,
              description: description || null,
              banner_description: banner_description || null,
              image: image || null,
              user_id: req.user_id,
              updated_at: new Date(),
            },
            existing[0].id
          );

          return res.status(200).json({
            error: false,
            message: "Content updated successfully",
          });
        } else {
          // Create new content
          const result = await sdk.insert({
            equipment_id,
            equipment_name,
            description: description || null,
            banner_description: banner_description || null,
            image: image || null,
            user_id: req.user_id,
            created_at: new Date(),
            updated_at: new Date(),
          });

          return res.status(200).json({
            error: false,
            message: "Content created successfully",
            data: { id: result.insertId },
          });
        }
      } catch (error) {
        console.error("Add/Update content error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Get content by equipment ID
  app.get(
    "/v1/api/longterm-hire/super_admin/content/:equipment_id",
    TokenMiddleware,
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId(req.projectId);

        sdk.setTable("content");
        const content = await sdk.get({
          equipment_id: req.params.equipment_id,
        });

        return res.status(200).json({
          error: false,
          data: content.length > 0 ? content[0] : null,
        });
      } catch (error) {
        console.error("Get content by equipment error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Delete content
  app.delete(
    "/v1/api/longterm-hire/super_admin/content/:id",
    TokenMiddleware,
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId(req.projectId);

        sdk.setTable("content");
        await sdk.delete({}, req.params.id);

        return res.status(200).json({
          error: false,
          message: "Content deleted successfully",
        });
      } catch (error) {
        console.error("Delete content error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Client route to get available equipment with content
  app.get(
    "/v1/api/longtermhire/member/equipment",
    TokenMiddleware(),
    RoleMiddleware(["member"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        // Get equipment assigned to this client with content
        const equipment = await sdk.rawQuery(
          `
          SELECT e.*, c.description, c.banner_description, c.image
          FROM longtermhire_client_equipment ce
          JOIN longtermhire_equipment_item e ON ce.equipment_id = e.id
          LEFT JOIN longtermhire_content c ON e.equipment_id = c.equipment_id
          WHERE ce.client_user_id = ? AND e.availability = 1
          ORDER BY e.category_name, e.equipment_name
        `,
          [req.user_id]
        );

        return res.status(200).json({
          error: false,
          data: equipment,
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
};
