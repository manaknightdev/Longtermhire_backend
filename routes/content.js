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

        // Get content with pagination and images
        const contentQuery = `
        SELECT 
          c.*,
          GROUP_CONCAT(
            JSON_OBJECT(
              'id', ci.id,
              'image_url', ci.image_url,
              'image_order', ci.image_order,
              'is_main', ci.is_main,
              'caption', ci.caption
            ) ORDER BY ci.image_order ASC
          ) as images
        FROM longtermhire_content c
        LEFT JOIN longtermhire_content_images ci ON c.id = ci.content_id
        ${whereClause}
        GROUP BY c.id
        ORDER BY c.id DESC
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

        // Process images data
        const processedContent = content.map((item) => {
          if (item.images) {
            try {
              // Parse the GROUP_CONCAT JSON objects
              const imageStrings = item.images.split(",");
              item.images = imageStrings
                .map((imgStr) => {
                  try {
                    return JSON.parse(imgStr);
                  } catch (e) {
                    return null;
                  }
                })
                .filter((img) => img !== null);
            } catch (e) {
              item.images = [];
            }
          } else {
            item.images = [];
          }
          return item;
        });

        return res.status(200).json({
          error: false,
          data: processedContent,
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
          image_url, // Keep for backward compatibility
          images, // New field for multiple images array
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

        const contentId = result.insertId;

        // Handle multiple images if provided
        if (images && Array.isArray(images) && images.length > 0) {
          // Limit to 5 images
          const limitedImages = images.slice(0, 5);

          for (let i = 0; i < limitedImages.length; i++) {
            const image = limitedImages[i];
            const imageSQL = `
              INSERT INTO longtermhire_content_images
              (content_id, image_url, image_order, is_main, caption, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            await sdk.rawQuery(imageSQL, [
              contentId,
              image.url,
              i,
              image.is_main || i === 0, // First image is main by default
              image.caption || null,
              currentTime,
              currentTime,
            ]);
          }
        }

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

  // Get content by ID with images
  app.get(
    "/v1/api/longtermhire/super_admin/content/:id",
    TokenMiddleware(),
    async (req, res) => {
      try {
        console.log("GET /v1/api/longtermhire/super_admin/content/:id called");
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const contentId = req.params.id;

        // Get content with images
        const contentQuery = `
          SELECT 
            c.*,
            GROUP_CONCAT(
              JSON_OBJECT(
                'id', ci.id,
                'image_url', ci.image_url,
                'image_order', ci.image_order,
                'is_main', ci.is_main,
                'caption', ci.caption
              ) ORDER BY ci.image_order ASC
            ) as images
          FROM longtermhire_content c
          LEFT JOIN longtermhire_content_images ci ON c.id = ci.content_id
          WHERE c.id = ?
          GROUP BY c.id
        `;

        const content = await sdk.rawQuery(contentQuery, [contentId]);

        if (!content || content.length === 0) {
          return res.status(404).json({
            error: true,
            message: "Content not found",
          });
        }

        // Process images data
        const item = content[0];
        if (item.images) {
          try {
            const imageStrings = item.images.split(",");
            item.images = imageStrings
              .map((imgStr) => {
                try {
                  return JSON.parse(imgStr);
                } catch (e) {
                  return null;
                }
              })
              .filter((img) => img !== null);
          } catch (e) {
            item.images = [];
          }
        } else {
          item.images = [];
        }

        return res.status(200).json({
          error: false,
          data: item,
        });
      } catch (error) {
        console.error("Get content by ID error:", error);
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
        image_url, // Keep for backward compatibility
        images, // New field for multiple images array
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

      // Handle multiple images if provided
      if (images && Array.isArray(images)) {
        // Delete existing images for this content
        const deleteImagesSQL =
          "DELETE FROM longtermhire_content_images WHERE content_id = ?";
        await sdk.rawQuery(deleteImagesSQL, [contentId]);

        // Add new images (limit to 5)
        if (images.length > 0) {
          const limitedImages = images.slice(0, 5);

          for (let i = 0; i < limitedImages.length; i++) {
            const image = limitedImages[i];
            const imageSQL = `
              INSERT INTO longtermhire_content_images
              (content_id, image_url, image_order, is_main, caption, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            await sdk.rawQuery(imageSQL, [
              contentId,
              image.url,
              i,
              image.is_main || i === 0, // First image is main by default
              image.caption || null,
              currentTime,
              currentTime,
            ]);
          }
        }
      }

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

  // Add image to content
  app.post(
    "/v1/api/longtermhire/super_admin/content/:id/images",
    TokenMiddleware(),
    async (req, res) => {
      try {
        console.log(
          "POST /v1/api/longtermhire/super_admin/content/:id/images called"
        );
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const contentId = req.params.id;
        const { image_url, caption, is_main = false } = req.body;

        if (!image_url) {
          return res.status(400).json({
            error: true,
            message: "Image URL is required",
          });
        }

        // Check if content exists
        const checkSQL = "SELECT id FROM longtermhire_content WHERE id = ?";
        const contentExists = await sdk.rawQuery(checkSQL, [contentId]);

        if (!contentExists || contentExists.length === 0) {
          return res.status(404).json({
            error: true,
            message: "Content not found",
          });
        }

        // Check current image count (limit to 5)
        const countSQL =
          "SELECT COUNT(*) as count FROM longtermhire_content_images WHERE content_id = ?";
        const countResult = await sdk.rawQuery(countSQL, [contentId]);
        const currentCount = countResult[0]?.count || 0;

        if (currentCount >= 5) {
          return res.status(400).json({
            error: true,
            message: "Maximum 5 images allowed per content",
          });
        }

        // If setting as main, unset other main images
        if (is_main) {
          const unsetMainSQL =
            "UPDATE longtermhire_content_images SET is_main = FALSE WHERE content_id = ?";
          await sdk.rawQuery(unsetMainSQL, [contentId]);
        }

        const currentTime = new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

        // Add new image
        const insertSQL = `
          INSERT INTO longtermhire_content_images
          (content_id, image_url, image_order, is_main, caption, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await sdk.rawQuery(insertSQL, [
          contentId,
          image_url,
          currentCount, // Use current count as order
          is_main,
          caption || null,
          currentTime,
          currentTime,
        ]);

        return res.status(200).json({
          error: false,
          message: "Image added successfully",
          data: { id: result.insertId },
        });
      } catch (error) {
        console.error("Add image error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Remove image from content
  app.delete(
    "/v1/api/longtermhire/super_admin/content/:id/images/:imageId",
    TokenMiddleware(),
    async (req, res) => {
      try {
        console.log(
          "DELETE /v1/api/longtermhire/super_admin/content/:id/images/:imageId called"
        );
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const contentId = req.params.id;
        const imageId = req.params.imageId;

        // Check if image exists and belongs to content
        const checkSQL =
          "SELECT id, is_main FROM longtermhire_content_images WHERE id = ? AND content_id = ?";
        const imageExists = await sdk.rawQuery(checkSQL, [imageId, contentId]);

        if (!imageExists || imageExists.length === 0) {
          return res.status(404).json({
            error: true,
            message: "Image not found",
          });
        }

        const isMain = imageExists[0].is_main;

        // Delete the image
        const deleteSQL =
          "DELETE FROM longtermhire_content_images WHERE id = ?";
        await sdk.rawQuery(deleteSQL, [imageId]);

        // If it was the main image, set the first remaining image as main
        if (isMain) {
          const remainingImagesSQL =
            "SELECT id FROM longtermhire_content_images WHERE content_id = ? ORDER BY image_order ASC LIMIT 1";
          const remainingImages = await sdk.rawQuery(remainingImagesSQL, [
            contentId,
          ]);

          if (remainingImages.length > 0) {
            const setMainSQL =
              "UPDATE longtermhire_content_images SET is_main = TRUE WHERE id = ?";
            await sdk.rawQuery(setMainSQL, [remainingImages[0].id]);
          }
        }

        return res.status(200).json({
          error: false,
          message: "Image removed successfully",
        });
      } catch (error) {
        console.error("Remove image error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Set image as main
  app.put(
    "/v1/api/longtermhire/super_admin/content/:id/images/:imageId/main",
    TokenMiddleware(),
    async (req, res) => {
      try {
        console.log(
          "PUT /v1/api/longtermhire/super_admin/content/:id/images/:imageId/main called"
        );
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const contentId = req.params.id;
        const imageId = req.params.imageId;

        // Check if image exists and belongs to content
        const checkSQL =
          "SELECT id FROM longtermhire_content_images WHERE id = ? AND content_id = ?";
        const imageExists = await sdk.rawQuery(checkSQL, [imageId, contentId]);

        if (!imageExists || imageExists.length === 0) {
          return res.status(404).json({
            error: true,
            message: "Image not found",
          });
        }

        // Unset all main images for this content
        const unsetMainSQL =
          "UPDATE longtermhire_content_images SET is_main = FALSE WHERE content_id = ?";
        await sdk.rawQuery(unsetMainSQL, [contentId]);

        // Set this image as main
        const setMainSQL =
          "UPDATE longtermhire_content_images SET is_main = TRUE WHERE id = ?";
        await sdk.rawQuery(setMainSQL, [imageId]);

        return res.status(200).json({
          error: false,
          message: "Main image updated successfully",
        });
      } catch (error) {
        console.error("Set main image error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Reorder images
  app.put(
    "/v1/api/longtermhire/super_admin/content/:id/images/reorder",
    TokenMiddleware(),
    async (req, res) => {
      try {
        console.log(
          "PUT /v1/api/longtermhire/super_admin/content/:id/images/reorder called"
        );
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const contentId = req.params.id;
        const { imageOrder } = req.body; // Array of image IDs in new order

        if (!imageOrder || !Array.isArray(imageOrder)) {
          return res.status(400).json({
            error: true,
            message: "Image order array is required",
          });
        }

        // Update image order
        for (let i = 0; i < imageOrder.length; i++) {
          const imageId = imageOrder[i];
          const updateSQL =
            "UPDATE longtermhire_content_images SET image_order = ? WHERE id = ? AND content_id = ?";
          await sdk.rawQuery(updateSQL, [i, imageId, contentId]);
        }

        return res.status(200).json({
          error: false,
          message: "Images reordered successfully",
        });
      } catch (error) {
        console.error("Reorder images error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );
};
