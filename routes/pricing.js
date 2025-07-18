const TokenMiddleware = require("../../../baas/middleware/TokenMiddleware");

module.exports = function (app) {
  console.log("Loading pricing routes...");

  // Get all pricing packages with pagination and search
  app.get(
    "/v1/api/longtermhire/super_admin/pricing-packages",
    TokenMiddleware(),
    async (req, res) => {
      try {
        console.log(
          "GET /v1/api/longtermhire/super_admin/pricing-packages called"
        );
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        // Extract query parameters for pagination and search
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const packageId = req.query.packageId || "";
        const packageName = req.query.packageName || "";
        const offset = (page - 1) * limit;

        // Build search conditions
        let searchConditions = [];
        let searchParams = [];

        if (packageId) {
          searchConditions.push("package_id = ?");
          searchParams.push(packageId);
        }
        if (packageName) {
          searchConditions.push("name LIKE ?");
          searchParams.push(`%${packageName}%`);
        }

        const whereClause =
          searchConditions.length > 0
            ? `WHERE ${searchConditions.join(" AND ")}`
            : "";

        // Get pricing packages with pagination
        const packagesQuery = `
          SELECT * FROM longtermhire_pricing_package
          ${whereClause}
          ORDER BY id DESC
          LIMIT ? OFFSET ?
        `;

        // Get total count for pagination
        const countQuery = `
          SELECT COUNT(*) as total
          FROM longtermhire_pricing_package
          ${whereClause}
        `;

        const packages = await sdk.rawQuery(packagesQuery, [
          ...searchParams,
          limit,
          offset,
        ]);
        const countResult = await sdk.rawQuery(countQuery, searchParams);
        const total = countResult[0]?.total || 0;

        return res.status(200).json({
          error: false,
          data: packages,
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
        console.error("Get pricing packages error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Add pricing package
  app.post(
    "/v1/api/longtermhire/super_admin/pricing-packages",
    TokenMiddleware(),
    async (req, res) => {
      try {
        console.log(
          "POST /v1/api/longtermhire/super_admin/pricing-packages called"
        );
        console.log("Package data:", req.body);

        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const { name, description, discount_type, discount_value } = req.body;

        // Auto-generate package_id
        const package_id = `PKG${Date.now()}`;

        const currentTime = new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

        // First, get a valid user ID (use the first admin user)
        const userQuery = `SELECT id FROM longtermhire_user WHERE role_id = 'super_admin' LIMIT 1`;
        const userResult = await sdk.rawQuery(userQuery, []);
        const createdBy = userResult.length > 0 ? userResult[0].id : 1; // fallback to ID 1

        // Insert pricing package into database
        const insertSQL = `
          INSERT INTO longtermhire_pricing_package
          (package_id, name, description, discount_type, discount_value, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await sdk.rawQuery(insertSQL, [
          package_id,
          name,
          description || null,
          discount_type || 0,
          discount_value,
          createdBy,
          currentTime,
          currentTime,
        ]);

        console.log("Pricing package created with ID:", result.insertId);

        return res.status(200).json({
          error: false,
          message: "Pricing package created successfully",
          data: {
            id: result.insertId,
            package_id,
            name,
            description,
            discount_type: discount_type || 0,
            discount_value,
          },
        });
      } catch (error) {
        console.error("Create pricing package error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Update pricing package
  app.put(
    "/v1/api/longtermhire/super_admin/pricing-packages/:id",
    TokenMiddleware(),
    async (req, res) => {
      try {
        console.log(
          "PUT /v1/api/longtermhire/super_admin/pricing-packages/:id called"
        );
        console.log("Update data:", req.body);

        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const { name, description, discount_type, discount_value } = req.body;
        const packageId = req.params.id;
        const currentTime = new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

        // Check if package exists
        const checkSQL =
          "SELECT id FROM longtermhire_pricing_package WHERE id = ?";
        const packageExists = await sdk.rawQuery(checkSQL, [packageId]);

        if (!packageExists || packageExists.length === 0) {
          return res.status(404).json({
            error: true,
            message: "Pricing package not found",
          });
        }

        // Update pricing package in database
        const updateSQL = `
          UPDATE longtermhire_pricing_package
          SET
            name = ?,
            description = ?,
            discount_type = ?,
            discount_value = ?,
            updated_at = ?
          WHERE id = ?
        `;

        await sdk.rawQuery(updateSQL, [
          name,
          description || null,
          discount_type || 0,
          discount_value,
          currentTime,
          packageId,
        ]);

        return res.status(200).json({
          error: false,
          message: "Pricing package updated successfully",
        });
      } catch (error) {
        console.error("Update pricing package error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Delete pricing package
  app.delete(
    "/v1/api/longtermhire/super_admin/pricing-packages/:id",
    TokenMiddleware(),
    async (req, res) => {
      try {
        console.log(
          "DELETE /v1/api/longtermhire/super_admin/pricing-packages/:id called"
        );

        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const packageId = req.params.id;

        // Check if package exists
        const checkSQL =
          "SELECT id FROM longtermhire_pricing_package WHERE id = ?";
        const packageExists = await sdk.rawQuery(checkSQL, [packageId]);

        if (!packageExists || packageExists.length === 0) {
          return res.status(404).json({
            error: true,
            message: "Pricing package not found",
          });
        }

        // Delete related client pricing assignments first
        await sdk.rawQuery(
          "DELETE FROM longtermhire_client_pricing WHERE pricing_package_id = ?",
          [packageId]
        );

        // Delete the pricing package
        await sdk.rawQuery(
          "DELETE FROM longtermhire_pricing_package WHERE id = ?",
          [packageId]
        );

        return res.status(200).json({
          error: false,
          message: "Pricing package deleted successfully",
        });
      } catch (error) {
        console.error("Delete pricing package error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Add pricing package
  app.post(
    "/v1/api/longterm-hire/super_admin/pricing-packages",
    TokenMiddleware,
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId(req.projectId);

        const { package_id, name, description, discount_type, discount_value } =
          req.body;

        if (
          !package_id ||
          !name ||
          discount_type === undefined ||
          !discount_value
        ) {
          return res.status(400).json({
            error: true,
            message:
              "Package ID, name, discount type, and discount value are required",
          });
        }

        sdk.setTable("pricing_package");
        const result = await sdk.insert({
          package_id,
          name, // This matches the 'name' column in the database
          description: description || null,
          discount_type,
          discount_value,
          created_by: req.user_id,
          created_at: new Date(),
          updated_at: new Date(),
        });

        return res.status(200).json({
          error: false,
          message: "Pricing package created successfully",
          data: { id: result.insertId },
        });
      } catch (error) {
        console.error("Add pricing package error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Update pricing package
  app.put(
    "/v1/api/longterm-hire/super_admin/pricing-packages/:id",
    TokenMiddleware,
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId(req.projectId);

        const { package_id, name, description, discount_type, discount_value } =
          req.body;

        sdk.setTable("pricing_package");
        await sdk.update(
          {
            package_id,
            name,
            description,
            discount_type,
            discount_value,
            updated_at: new Date(),
          },
          req.params.id
        );

        return res.status(200).json({
          error: false,
          message: "Pricing package updated successfully",
        });
      } catch (error) {
        console.error("Update pricing package error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Delete pricing package
  app.delete(
    "/v1/api/longterm-hire/super_admin/pricing-packages/:id",
    TokenMiddleware,
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId(req.projectId);

        sdk.setTable("pricing_package");
        await sdk.delete({}, req.params.id);

        return res.status(200).json({
          error: false,
          message: "Pricing package deleted successfully",
        });
      } catch (error) {
        console.error("Delete pricing package error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );
};
