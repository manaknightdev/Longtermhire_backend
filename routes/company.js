const TokenMiddleware = require("../../../baas/middleware/TokenMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");
const CompanyModel = require("../models/company");
const CompanyMemberModel = require("../models/company_member");
const bcrypt = require("bcryptjs");

module.exports = function (app) {
  console.log("Loading company routes...");

  /**
   * Create a new company
   * POST /v1/api/longtermhire/super_admin/company/create
   */
  app.post(
    "/v1/api/longtermhire/super_admin/company/create",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const {
          company_name,
          owner_user_id,
          company_address,
          company_logo,
          ad_text,
        } = req.body;

        // Validation
        if (!company_name || !owner_user_id) {
          return res.status(400).json({
            error: true,
            message: "Company name and owner user ID are required",
          });
        }

        // Check if owner user exists
        sdk.setTable("user");
        const user = await sdk.rawQuery(
          `SELECT id, email FROM longtermhire_user WHERE id = ? LIMIT 1`,
          [owner_user_id]
        );

        if (!user || user.length === 0) {
          return res.status(404).json({
            error: true,
            message: "Owner user not found",
          });
        }

        // Check if user already has a company as owner
        const companyModel = new CompanyModel(sdk);
        const existingCompany = await companyModel.findByOwnerId(owner_user_id);

        if (existingCompany) {
          return res.status(400).json({
            error: true,
            message: "User already owns a company",
          });
        }

        // Create company
        const company = await companyModel.create({
          company_name,
          owner_user_id,
          company_address,
          company_logo,
          ad_text,
        });

        // Create company member entry for owner
        const companyMemberModel = new CompanyMemberModel(sdk);
        await companyMemberModel.create({
          company_id: company.insertId || company.id,
          user_id: owner_user_id,
          member_name: user[0].email.split("@")[0], // Use email username as default
          member_email: user[0].email,
          role: "Company Owner",
        });

        return res.status(201).json({
          error: false,
          message: "Company created successfully",
          data: {
            company_id: company.insertId || company.id,
          },
        });
      } catch (error) {
        console.error("Create company error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Failed to create company",
        });
      }
    }
  );

  /**
   * Get company by ID with members
   * GET /v1/api/longtermhire/super_admin/company/:id
   */
  app.get(
    "/v1/api/longtermhire/super_admin/company/:id",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const companyId = req.params.id;
        const companyModel = new CompanyModel(sdk);
        const company = await companyModel.findByIdWithMembers(companyId);

        if (!company) {
          return res.status(404).json({
            error: true,
            message: "Company not found",
          });
        }

        return res.status(200).json({
          error: false,
          data: company,
        });
      } catch (error) {
        console.error("Get company error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Failed to get company",
        });
      }
    }
  );

  /**
   * Update company
   * PUT /v1/api/longtermhire/super_admin/company/:id
   */
  app.put(
    "/v1/api/longtermhire/super_admin/company/:id",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const companyId = req.params.id;
        const { company_name, company_address, company_logo, ad_text } =
          req.body;

        const companyModel = new CompanyModel(sdk);

        // Check if company exists
        const company = await companyModel.findById(companyId);
        if (!company) {
          return res.status(404).json({
            error: true,
            message: "Company not found",
          });
        }

        // Update company
        await companyModel.update(companyId, {
          company_name,
          company_address,
          company_logo,
          ad_text,
        });

        return res.status(200).json({
          error: false,
          message: "Company updated successfully",
        });
      } catch (error) {
        console.error("Update company error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Failed to update company",
        });
      }
    }
  );

  /**
   * Add team member to company
   * POST /v1/api/longtermhire/super_admin/company/:id/member
   */
  app.post(
    "/v1/api/longtermhire/super_admin/company/:id/member",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const companyId = req.params.id;
        const {
          member_name,
          member_email,
          member_phone,
          username,
          password,
          role,
        } = req.body;

        // Validation
        if (!member_name || !member_email || !role) {
          return res.status(400).json({
            error: true,
            message: "Member name, email, and role are required",
          });
        }

        // Check if company exists
        const companyModel = new CompanyModel(sdk);
        const company = await companyModel.findById(companyId);

        if (!company) {
          return res.status(404).json({
            error: true,
            message: "Company not found",
          });
        }

        // If assigning Company Owner role, check if one already exists
        if (role === "Company Owner") {
          const existingOwner = await sdk.rawQuery(
            `SELECT id, member_name FROM longtermhire_company_member 
             WHERE company_id = ? AND role = 'Company Owner' LIMIT 1`,
            [companyId]
          );

          if (existingOwner && existingOwner.length > 0) {
            return res.status(400).json({
              error: true,
              message: `Only one Company Owner is allowed per company. ${existingOwner[0].member_name} is already the Company Owner.`,
            });
          }
        }

        // Check if email already exists
        sdk.setTable("user");
        const existingUser = await sdk.rawQuery(
          `SELECT id FROM longtermhire_user WHERE email = ? LIMIT 1`,
          [member_email]
        );

        let userId;

        if (existingUser && existingUser.length > 0) {
          // User already exists, use that user
          userId = existingUser[0].id;
        } else {
          // Create new user account
          const generatedUsername =
            username ||
            member_email.split("@")[0] +
              Math.random().toString(36).substring(2, 6);
          const generatedPassword =
            password || Math.random().toString(36).substring(2, 10);
          const hashedPassword = await bcrypt.hash(generatedPassword, 10);

          const currentTime = new Date()
            .toISOString()
            .slice(0, 19)
            .replace("T", " ");

          const userInsertSQL = `
            INSERT INTO longtermhire_user (email, password, role_id, status, verify, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `;

          const userResult = await sdk.rawQuery(userInsertSQL, [
            member_email,
            hashedPassword,
            "member",
            1,
            1,
            currentTime,
            currentTime,
          ]);

          userId = userResult.insertId || userResult.id;
        }

        // Check if user is already a member
        const companyMemberModel = new CompanyMemberModel(sdk);
        const isMember = await companyMemberModel.isMember(companyId, userId);

        if (isMember) {
          return res.status(400).json({
            error: true,
            message: "User is already a member of this company",
          });
        }

        // Add member to company
        await companyMemberModel.create({
          company_id: companyId,
          user_id: userId,
          member_name,
          member_email,
          member_phone,
          role,
        });

        return res.status(201).json({
          error: false,
          message: "Team member added successfully",
          data: {
            user_id: userId,
          },
        });
      } catch (error) {
        console.error("Add team member error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Failed to add team member",
        });
      }
    }
  );

  /**
   * Delete team member from company
   * DELETE /v1/api/longtermhire/super_admin/company/:companyId/member/:memberId
   */
  app.delete(
    "/v1/api/longtermhire/super_admin/company/:companyId/member/:memberId",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const { companyId, memberId } = req.params;

        const companyMemberModel = new CompanyMemberModel(sdk);

        // Check if member exists
        const member = await companyMemberModel.findById(memberId);

        if (!member) {
          return res.status(404).json({
            error: true,
            message: "Team member not found",
          });
        }

        // Don't allow deleting company owner
        if (member.role === "Company Owner") {
          return res.status(400).json({
            error: true,
            message: "Cannot delete company owner",
          });
        }

        // Delete member
        await companyMemberModel.delete(memberId);

        return res.status(200).json({
          error: false,
          message: "Team member deleted successfully",
        });
      } catch (error) {
        console.error("Delete team member error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Failed to delete team member",
        });
      }
    }
  );

  /**
   * Update team member role
   * PUT /v1/api/longtermhire/super_admin/company/:companyId/member/:memberId/role
   */
  app.put(
    "/v1/api/longtermhire/super_admin/company/:companyId/member/:memberId/role",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const { companyId, memberId } = req.params;
        const { role } = req.body;

        // Validation
        if (!role) {
          return res.status(400).json({
            error: true,
            message: "Role is required",
          });
        }

        // Validate role value
        const validRoles = ["Company Owner", "Engineer", "Supervisor"];
        if (!validRoles.includes(role)) {
          return res.status(400).json({
            error: true,
            message:
              "Invalid role. Must be one of: Company Owner, Engineer, Supervisor",
          });
        }

        const companyMemberModel = new CompanyMemberModel(sdk);

        // Check if member exists
        const member = await companyMemberModel.findById(memberId);
        if (!member) {
          return res.status(404).json({
            error: true,
            message: "Team member not found",
          });
        }

        // Prevent changing Company Owner role
        if (member.role === "Company Owner") {
          return res.status(400).json({
            error: true,
            message:
              "Cannot change the role of a Company Owner. This role is permanent.",
          });
        }

        // If assigning Company Owner role, check if one already exists
        if (role === "Company Owner") {
          const existingOwner = await sdk.rawQuery(
            `SELECT id, member_name FROM longtermhire_company_member 
             WHERE company_id = ? AND role = 'Company Owner' AND id != ? LIMIT 1`,
            [companyId, memberId]
          );

          if (existingOwner && existingOwner.length > 0) {
            return res.status(400).json({
              error: true,
              message: `Only one Company Owner is allowed per company. ${existingOwner[0].member_name} is already the Company Owner.`,
            });
          }
        }

        // Update role
        await sdk.rawQuery(
          `UPDATE longtermhire_company_member SET role = ?, updated_at = NOW() WHERE id = ?`,
          [role, memberId]
        );

        return res.status(200).json({
          error: false,
          message: "Role updated successfully",
        });
      } catch (error) {
        console.error("Update team member role error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Failed to update role",
        });
      }
    }
  );

  /**
   * Get company equipment with discounts
   * GET /v1/api/longtermhire/super_admin/company/:id/equipment
   */
  app.get(
    "/v1/api/longtermhire/super_admin/company/:id/equipment",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const companyId = req.params.id;
        const companyModel = new CompanyModel(sdk);

        // Check if company exists
        const company = await companyModel.findById(companyId);
        if (!company) {
          return res.status(404).json({
            error: true,
            message: "Company not found",
          });
        }

        // Get equipment
        const equipment = await companyModel.getCompanyEquipment(companyId);

        // Calculate final prices using pricing calculator
        const {
          calculateEquipmentPrice,
        } = require("../utils/pricingCalculator");

        const equipmentWithPrices = equipment.map((eq) => ({
          ...eq,
          final_price: calculateEquipmentPrice(
            eq.base_price,
            eq.discount || 0,
            eq.discount_type || "%",
            eq.compounding_discount || 0,
            eq.compounding_discount_type || "%"
          ),
        }));

        return res.status(200).json({
          error: false,
          data: equipmentWithPrices,
        });
      } catch (error) {
        console.error("Get company equipment error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Failed to get company equipment",
        });
      }
    }
  );

  /**
   * Update equipment discount for company
   * PUT /v1/api/longtermhire/super_admin/company/:companyId/equipment/:equipmentId/discount
   */
  app.put(
    "/v1/api/longtermhire/super_admin/company/:companyId/equipment/:equipmentId/discount",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const { companyId, equipmentId } = req.params;
        const {
          discount,
          discount_type,
          compounding_discount,
          compounding_discount_type,
        } = req.body;

        // Validate discounts
        const { validateDiscount } = require("../utils/pricingCalculator");

        if (discount !== undefined) {
          const validation = validateDiscount(discount, discount_type);
          if (!validation.valid) {
            return res.status(400).json({
              error: true,
              message: validation.error,
            });
          }
        }

        if (compounding_discount !== undefined) {
          const validation = validateDiscount(
            compounding_discount,
            compounding_discount_type
          );
          if (!validation.valid) {
            return res.status(400).json({
              error: true,
              message: `Compounding ${validation.error}`,
            });
          }
        }

        // equipmentId can be either numeric ID or equipment code - need to resolve it
        let numericEquipmentId = equipmentId;

        // If equipmentId is not a number, look it up by equipment_id code
        if (isNaN(equipmentId)) {
          const equipment = await sdk.rawQuery(
            `SELECT id FROM longtermhire_equipment_item WHERE equipment_id = ? LIMIT 1`,
            [equipmentId]
          );

          if (!equipment || equipment.length === 0) {
            return res.status(404).json({
              error: true,
              message: "Equipment not found",
            });
          }

          numericEquipmentId = equipment[0].id;
        }

        // Get all client user IDs for this company
        const clients = await sdk.rawQuery(
          `SELECT user_id FROM longtermhire_client WHERE company_id = ?`,
          [companyId]
        );

        if (!clients || clients.length === 0) {
          return res.status(404).json({
            error: true,
            message: "No clients found for this company",
          });
        }

        const userIds = clients.map((c) => c.user_id);
        const userIdPlaceholders = userIds.map(() => "?").join(",");

        // Update discount for all company clients with this equipment
        const updateSQL = `
          UPDATE longtermhire_client_equipment
          SET
            discount = ?,
            discount_type = ?,
            compounding_discount = ?,
            compounding_discount_type = ?,
            custom_base_price = ?,
            updated_at = NOW()
          WHERE client_user_id IN (${userIdPlaceholders})
            AND equipment_id = ?
        `;

        await sdk.rawQuery(updateSQL, [
          discount || 0,
          discount_type || "%",
          compounding_discount || 0,
          compounding_discount_type || "%",
          req.body.base_price || null, // Use null if not provided to respect default
          ...userIds,
          numericEquipmentId,
        ]);

        return res.status(200).json({
          error: false,
          message: "Equipment discount updated successfully",
        });
      } catch (error) {
        console.error("Update equipment discount error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Failed to update equipment discount",
        });
      }
    }
  );

  /**
   * BULK UPDATE - Apply discount to all equipment for a company
   * PUT /v1/api/longtermhire/super_admin/company/:companyId/equipment/bulk-discount
   */
  app.put(
    "/v1/api/longtermhire/super_admin/company/:companyId/equipment/bulk-discount",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const { companyId } = req.params;
        const {
          discount,
          discount_type,
          compounding_discount,
          compounding_discount_type,
          equipment_ids, // Optional: array of specific equipment IDs, null = all
        } = req.body;

        // Validate that at least one discount is provided
        if (discount === undefined && compounding_discount === undefined) {
          return res.status(400).json({
            error: true,
            message: "At least one discount value must be provided",
          });
        }

        // Validate discounts if provided
        const { validateDiscount } = require("../utils/pricingCalculator");

        if (discount !== undefined) {
          const validation = validateDiscount(discount, discount_type);
          if (!validation.valid) {
            return res.status(400).json({
              error: true,
              message: validation.error,
            });
          }
        }

        if (compounding_discount !== undefined) {
          const validation = validateDiscount(
            compounding_discount,
            compounding_discount_type
          );
          if (!validation.valid) {
            return res.status(400).json({
              error: true,
              message: `Compounding ${validation.error}`,
            });
          }
        }

        // Get all client user IDs for this company
        const clients = await sdk.rawQuery(
          `SELECT user_id FROM longtermhire_client WHERE company_id = ?`,
          [companyId]
        );

        if (!clients || clients.length === 0) {
          return res.status(404).json({
            error: true,
            message: "No clients found for this company",
          });
        }

        const userIds = clients.map((c) => c.user_id);

        // Build dynamic SQL based on what fields are provided
        let updateFields = [];
        let updateValues = [];

        if (discount !== undefined) {
          updateFields.push("discount = ?");
          updateValues.push(discount || 0);
          updateFields.push("discount_type = ?");
          updateValues.push(discount_type || "%");
        }

        if (compounding_discount !== undefined) {
          updateFields.push("compounding_discount = ?");
          updateValues.push(compounding_discount || 0);
          updateFields.push("compounding_discount_type = ?");
          updateValues.push(compounding_discount_type || "%");
        }

        updateFields.push("updated_at = NOW()");

        // Build WHERE clause with proper placeholders
        const userIdPlaceholders = userIds.map(() => "?").join(",");
        let whereClause = `WHERE client_user_id IN (${userIdPlaceholders})`;
        const whereValues = [...userIds];

        if (
          equipment_ids &&
          Array.isArray(equipment_ids) &&
          equipment_ids.length > 0
        ) {
          const equipmentIdPlaceholders = equipment_ids
            .map(() => "?")
            .join(",");
          whereClause += ` AND equipment_id IN (${equipmentIdPlaceholders})`;
          whereValues.push(...equipment_ids);
        }

        const updateSQL = `
          UPDATE longtermhire_client_equipment
          SET ${updateFields.join(", ")}
          ${whereClause}
        `;

        // Combine update values with where values
        const allValues = [...updateValues, ...whereValues];

        const result = await sdk.rawQuery(updateSQL, allValues);

        return res.status(200).json({
          error: false,
          message: `Discount applied to ${
            result.affectedRows || 0
          } equipment items successfully`,
          data: {
            affected_rows: result.affectedRows || 0,
          },
        });
      } catch (error) {
        console.error("Bulk update equipment discount error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Failed to update equipment discounts",
        });
      }
    }
  );
};
