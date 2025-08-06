const TokenMiddleware = require("../../../baas/middleware/TokenMiddleware");
const MailService = require("../../../baas/services/MailService");
const bcrypt = require("bcryptjs");

module.exports = function (app) {
  console.log("Loading client routes...");
  const config = app.get("configuration");
  const mailService = new MailService(config);

  // Test route
  app.get("/v1/api/longtermhire/test", (req, res) => {
    res.json({ message: "longtermhire routes working!" });
  });

  // Test invite client route without middleware
  app.post(
    "/v1/api/longtermhire/super_admin/invite-client-test",
    async (req, res) => {
      console.log("TEST ROUTE: invite-client-test called");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      res.json({
        message: "Test route working!",
        body: req.body,
      });
    }
  );

  // Client invitation API
  app.post(
    "/v1/api/longtermhire/super_admin/invite-client",
    TokenMiddleware(),
    async (req, res) => {
      try {
        console.log(
          "POST /v1/api/longtermhire/super_admin/invite-client called"
        );
        console.log("Request body:", JSON.stringify(req.body, null, 2));
        console.log("Request headers:", JSON.stringify(req.headers, null, 2));
        console.log("User ID from token:", req.user_id);

        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");
        console.log("SDK initialized with project ID: longtermhire");

        const {
          client_name,
          company_name,
          email,
          phone,
          username: providedUsername,
          password: providedPassword,
          equipment,
          pricing,
        } = req.body;

        if (!client_name || !company_name || !email) {
          console.log("Validation failed - missing required fields");
          return res.status(400).json({
            error: true,
            message: "Client name, company name, and email are required",
          });
        }

        console.log("Validation passed, generating credentials...");
        console.log("Equipment data received:", equipment);
        console.log("Pricing data received:", pricing);

        // Generate username and password
        const username =
          email.split("@")[0] + Math.random().toString(36).substring(2, 6);
        const plainPassword = Math.random().toString(36).substring(2, 10);

        // Hash the password for database storage
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        console.log("Generated username:", username);
        console.log("Generated password:", plainPassword);
        console.log("Password hashed for database storage");

        // Create user account in database using raw SQL
        console.log("About to insert user with raw SQL...");
        const currentTime = new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

        const userInsertSQL = `
          INSERT INTO longtermhire_user (email, password, role_id, status, verify, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        console.log("User insert SQL:", userInsertSQL);
        console.log("User insert values:", [
          email,
          hashedPassword,
          "member",
          1,
          1,
          currentTime,
          currentTime,
        ]);

        const userResult = await sdk.rawQuery(userInsertSQL, [
          email,
          hashedPassword,
          "member",
          1,
          1,
          currentTime,
          currentTime,
        ]);
        console.log("User insert completed!");
        console.log("User insert result:", JSON.stringify(userResult, null, 2));

        // Create client profile in database using raw SQL
        console.log("About to insert client with raw SQL...");
        const userId = userResult.insertId || userResult.id;

        const clientInsertSQL = `
          INSERT INTO longtermhire_client (user_id, client_name, company_name, phone, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        console.log("Client insert SQL:", clientInsertSQL);
        console.log("Client insert values:", [
          userId,
          client_name,
          company_name,
          phone || null,
          currentTime,
          currentTime,
        ]);

        const clientResult = await sdk.rawQuery(clientInsertSQL, [
          userId,
          client_name,
          company_name,
          phone || null,
          currentTime,
          currentTime,
        ]);
        console.log("Client insert completed!");
        console.log(
          "Client insert result:",
          JSON.stringify(clientResult, null, 2)
        );

        // Handle equipment assignments if provided
        if (equipment && Array.isArray(equipment) && equipment.length > 0) {
          console.log("🔧 Assigning equipment to client:", equipment);
          try {
            for (const equipmentId of equipment) {
              const equipmentAssignSQL = `
                INSERT INTO longtermhire_client_equipment (client_user_id, equipment_id, assigned_by, created_at)
                VALUES (?, ?, ?, ?)
              `;
              await sdk.rawQuery(equipmentAssignSQL, [
                userId,
                equipmentId,
                req.user_id, // Use the current admin user ID
                currentTime,
              ]);
            }
            console.log("✅ Equipment assignments completed");
          } catch (equipmentError) {
            console.error("❌ Error assigning equipment:", equipmentError);
            // Continue with client creation even if equipment assignment fails
          }
        }

        // Handle pricing assignment if provided
        if (pricing) {
          console.log("💰 Assigning pricing to client:", pricing);
          try {
            const pricingAssignSQL = `
              INSERT INTO longtermhire_client_pricing (client_user_id, pricing_package_id, created_at, updated_at)
              VALUES (?, ?, ?, ?)
            `;
            await sdk.rawQuery(pricingAssignSQL, [
              userId,
              pricing,
              currentTime,
              currentTime,
            ]);
            console.log("✅ Pricing assignment completed");
          } catch (pricingError) {
            console.error("❌ Error assigning pricing:", pricingError);
            // Continue with client creation even if pricing assignment fails
          }
        }

        // Send invitation email to client
        console.log("📧 Sending invitation email to:", email);

        try {
          const loginUrl =
            "https://longtermhire.manaknightdigital.com/client/login";

          // Create HTML email template
          const htmlContent = `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #292A2B;">
              <div style="background-color: #1F1F20; padding: 30px; border-radius: 8px; border: 2px solid #E5E7EB; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                
                <!-- Header with Logo -->
                <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #333333;">
                  <img src="https://longtermhire.manaknightdigital.com/login-logo.png" 
                       alt="" 
                       style="width: 240px; height: 135px; margin-bottom: 15px;">
                  <h1 style="color: #E5E5E5; margin: 0; font-size: 28px; font-weight: 400;">Welcome to Longterm Hire</h1>
                  <p style="color: #ADAEBC; margin: 10px 0 0 0; font-size: 16px;">Your equipment rental portal is ready!</p>
                </div>

                <!-- Welcome Message -->
                <div style="background: #1C1C1C; padding: 25px; border-radius: 6px; margin: 25px 0; border: 1px solid #444444;">
                  <h3 style="color: #E5E5E5; margin-top: 0; font-size: 20px; font-weight: 400;">👋 Hello ${client_name}!</h3>
                  <p style="color: #ADAEBC; line-height: 1.6; margin: 15px 0;">
                    Welcome to <strong>Longterm Hire</strong>! Your account has been created for <strong>${company_name}</strong> 
                    and you now have access to our comprehensive equipment rental platform.
                  </p>
                </div>

                <!-- Login Credentials -->
                <div style="background: #1C1C1C; padding: 25px; border-radius: 6px; margin: 25px 0; border: 1px solid #444444;">
                  <h3 style="color: #E5E5E5; margin-top: 0; font-size: 18px; font-weight: 400;">🔐 Your Login Credentials</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 12px 0; color: #E5E5E5; font-weight: 400; font-size: 14px;">Email:</td>
                      <td style="padding: 12px 0; color: #E5E5E5; font-family: monospace; background: #292A2B; padding: 8px 12px; border-radius: 4px; border: 1px solid #444444;">${email}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; color: #E5E5E5; font-weight: 400; font-size: 14px;">Password:</td>
                      <td style="padding: 12px 0; color: #E5E5E5; font-family: monospace; background: #292A2B; padding: 8px 12px; border-radius: 4px; border: 1px solid #444444;">${plainPassword}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; color: #E5E5E5; font-weight: 400; font-size: 14px;">Login URL:</td>
                      <td style="padding: 12px 0;"><a href="${loginUrl}" style="color: #FDCE06; text-decoration: none; font-size: 14px;">${loginUrl}</a></td>
                    </tr>
                  </table>
                </div>

                <!-- Login Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${loginUrl}"
                     style="background: #FDCE06; color: #1F1F20; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block; border: 1px solid #FDCE06;">
                    🚀 Login to Your Account
                  </a>
                </div>

              
                <!-- Footer -->
                <div style="border-top: 1px solid #333333; padding-top: 20px; margin-top: 30px; text-align: center;">
                  <p style="color: #ADAEBC; font-size: 14px; margin: 0;">
                    Need assistance? Contact our support team <b>support@longtermhire.com</b>.<br>
                    <small style="color: #666666;">Invitation sent on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</small>
                  </p>
                </div>
              </div>
            </div>
          `;

          // Send email using MailService
          const emailResult = await mailService.send(
            config.mail?.from_mail || "noreply@longtermhire.com",
            email,
            `🎉 Welcome to Longterm Hire - Your Account is Ready!`,
            htmlContent
          );

          console.log("✅ Invitation email sent successfully:", emailResult);

          const responseData = {
            error: false,
            message: "Client invited successfully! Invitation email sent.",
            data: {
              user_id: userId,
              username: username,
              email: email,
              email_sent: !emailResult.error,
              login_url: loginUrl,
              equipment_assigned:
                equipment && Array.isArray(equipment) ? equipment.length : 0,
              pricing_assigned: pricing ? true : false,
            },
          };

          console.log("Response data:", JSON.stringify(responseData, null, 2));
          return res.status(200).json(responseData);
        } catch (emailError) {
          console.error("❌ Failed to send invitation email:", emailError);

          // Still return success for user creation, but note email failure
          const responseData = {
            error: false,
            message:
              "Client invited successfully, but invitation email failed to send. Please contact the client manually.",
            data: {
              user_id: userId,
              username: username,
              email: email,
              email_sent: false,
              email_error: emailError.message,
              login_url:
                "https://longtermhire.manaknightdigital.com/client/login",
              equipment_assigned:
                equipment && Array.isArray(equipment) ? equipment.length : 0,
              pricing_assigned: pricing ? true : false,
            },
          };

          console.log(
            "Response data (email failed):",
            JSON.stringify(responseData, null, 2)
          );
          return res.status(200).json(responseData);
        }
      } catch (error) {
        console.error("Invite client error:", error);
        console.error("Error stack:", error.stack);
        console.error("Error details:", JSON.stringify(error, null, 2));
        return res.status(500).json({
          error: true,
          message: error.message,
          details: error.stack,
        });
      }
    }
  );

  // Get all clients with email, pagination and search
  app.get(
    "/v1/api/longtermhire/super_admin/clients",
    TokenMiddleware(),
    async (req, res) => {
      try {
        console.log("GET /v1/api/longtermhire/super_admin/clients called");
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        // Extract query parameters for pagination and search
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const clientId = req.query.clientId || "";
        const clientName = req.query.clientName || "";
        const companyName = req.query.companyName || "";
        const offset = (page - 1) * limit;

        // Build search conditions
        let searchConditions = [];
        let searchParams = [];

        if (clientId) {
          searchConditions.push("c.id = ?");
          searchParams.push(clientId);
        }
        if (clientName) {
          searchConditions.push("c.client_name LIKE ?");
          searchParams.push(`%${clientName}%`);
        }
        if (companyName) {
          searchConditions.push("c.company_name LIKE ?");
          searchParams.push(`%${companyName}%`);
        }

        const whereClause =
          searchConditions.length > 0
            ? `WHERE ${searchConditions.join(" AND ")}`
            : "";

        // Get clients with user email, pricing information, and custom discount flag
        const clientsQuery = `
        SELECT
          c.id,
          c.user_id,
          c.client_name,
          c.company_name,
          c.phone,
          c.created_at,
          c.updated_at,
          u.email,
          cp.pricing_package_id,
          pp.name as pricing_package_name,
          CASE WHEN custom_discounts.client_user_id IS NOT NULL THEN 1 ELSE 0 END as has_custom_discounts
        FROM longtermhire_client c
        LEFT JOIN longtermhire_user u ON c.user_id = u.id
        LEFT JOIN longtermhire_client_pricing cp ON c.user_id = cp.client_user_id
        LEFT JOIN longtermhire_pricing_package pp ON cp.pricing_package_id = pp.id
        LEFT JOIN (
          SELECT DISTINCT client_user_id
          FROM longtermhire_client_equipment
          WHERE custom_discount_type IS NOT NULL 
          AND custom_discount_value IS NOT NULL
        ) custom_discounts ON c.user_id = custom_discounts.client_user_id
        ${whereClause}
        ORDER BY c.id DESC
        LIMIT ? OFFSET ?
      `;

        // Get total count for pagination
        const countQuery = `
        SELECT COUNT(*) as total
        FROM longtermhire_client c
        LEFT JOIN longtermhire_user u ON c.user_id = u.id
        ${whereClause}
      `;

        const clients = await sdk.rawQuery(clientsQuery, [
          ...searchParams,
          limit,
          offset,
        ]);
        const countResult = await sdk.rawQuery(countQuery, searchParams);
        const total = countResult[0]?.total || 0;

        return res.status(200).json({
          error: false,
          data: clients,
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
        console.error("Get clients error:", error);
        console.error("Error details:", error.stack);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Update client
  app.put(
    "/v1/api/longtermhire/super_admin/clients/:id",
    TokenMiddleware(),
    async (req, res) => {
      try {
        console.log("PUT /v1/api/longtermhire/super_admin/clients/:id called");
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const { client_name, company_name, phone, email } = req.body;
        const clientId = req.params.id;

        // Get client to find user_id
        const clientQuery =
          "SELECT user_id FROM longtermhire_client WHERE id = ?";
        const clientResult = await sdk.rawQuery(clientQuery, [clientId]);

        if (!clientResult || clientResult.length === 0) {
          return res.status(404).json({
            error: true,
            message: "Client not found",
          });
        }

        const userId = clientResult[0].user_id;
        const currentTime = new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

        // Update client table
        const updateClientSQL = `
          UPDATE longtermhire_client
          SET client_name = ?, company_name = ?, phone = ?, updated_at = ?
          WHERE id = ?
        `;
        await sdk.rawQuery(updateClientSQL, [
          client_name,
          company_name,
          phone,
          currentTime,
          clientId,
        ]);

        // Update user email if provided
        if (email) {
          const updateUserSQL = `
            UPDATE longtermhire_user
            SET email = ?, updated_at = ?
            WHERE id = ?
          `;
          await sdk.rawQuery(updateUserSQL, [email, currentTime, userId]);
        }

        return res.status(200).json({
          error: false,
          message: "Client updated successfully",
        });
      } catch (error) {
        console.error("Update client error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Delete client
  app.delete(
    "/v1/api/longtermhire/super_admin/clients/:id",
    TokenMiddleware(),
    async (req, res) => {
      try {
        console.log(
          "DELETE /v1/api/longtermhire/super_admin/clients/:id called"
        );
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const clientId = req.params.id;

        // Get client to find user_id
        const clientQuery =
          "SELECT user_id FROM longtermhire_client WHERE id = ?";
        const clientResult = await sdk.rawQuery(clientQuery, [clientId]);

        if (!clientResult || clientResult.length === 0) {
          return res.status(404).json({
            error: true,
            message: "Client not found",
          });
        }

        const userId = clientResult[0].user_id;

        // Delete client equipment assignments
        await sdk.rawQuery(
          "DELETE FROM longtermhire_client_equipment WHERE client_user_id = ?",
          [userId]
        );

        // Delete client pricing assignments
        await sdk.rawQuery(
          "DELETE FROM longtermhire_client_pricing WHERE client_user_id = ?",
          [userId]
        );

        // Delete client profile
        await sdk.rawQuery("DELETE FROM longtermhire_client WHERE id = ?", [
          clientId,
        ]);

        // Delete user account
        await sdk.rawQuery("DELETE FROM longtermhire_user WHERE id = ?", [
          userId,
        ]);

        return res.status(200).json({
          error: false,
          message: "Client deleted successfully",
        });
      } catch (error) {
        console.error("Delete client error:", error);
        return res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    }
  );

  // Get client equipment assignments
  app.get(
    "/v1/api/longtermhire/super_admin/client-equipment/:clientUserId",
    async (req, res) => {
      try {
        console.log(
          "GET /v1/api/longtermhire/super_admin/client-equipment/:clientUserId called"
        );

        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const { clientUserId } = req.params;

        // Get equipment assignments with equipment details
        const assignmentsSQL = `
          SELECT ce.equipment_id, ei.equipment_name, ei.category_name, ei.availability
          FROM longtermhire_client_equipment ce
          JOIN longtermhire_equipment_item ei ON ce.equipment_id = ei.id
          WHERE ce.client_user_id = ?
        `;

        const assignments = await sdk.rawQuery(assignmentsSQL, [clientUserId]);
        console.log(
          `Found ${assignments.length} equipment assignments for client ${clientUserId}`
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

  // Get client pricing assignment
  app.get(
    "/v1/api/longtermhire/super_admin/client-pricing/:clientUserId",
    async (req, res) => {
      try {
        console.log(
          "GET /v1/api/longtermhire/super_admin/client-pricing/:clientUserId called"
        );

        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const { clientUserId } = req.params;

        // Get pricing assignment with package details
        const pricingSQL = `
          SELECT cp.pricing_package_id, pp.name as package_name, pp.description, pp.discount_type, pp.discount_value
          FROM longtermhire_client_pricing cp
          JOIN longtermhire_pricing_package pp ON cp.pricing_package_id = pp.id
          WHERE cp.client_user_id = ?
          LIMIT 1
        `;

        const pricingResult = await sdk.rawQuery(pricingSQL, [clientUserId]);
        const pricingData = pricingResult.length > 0 ? pricingResult[0] : null;

        console.log(
          `Found pricing assignment for client ${clientUserId}:`,
          pricingData
        );

        return res.status(200).json({
          error: false,
          data: pricingData,
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

  // Assign equipment to client
  app.post(
    "/v1/api/longtermhire/super_admin/assign-equipment",
    async (req, res) => {
      try {
        console.log(
          "POST /v1/api/longtermhire/super_admin/assign-equipment called"
        );
        console.log("Assignment data:", req.body);

        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const { client_user_id, equipment_ids } = req.body;
        const currentTime = new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

        // First, remove existing assignments for this client
        const deleteSQL = `DELETE FROM longtermhire_client_equipment WHERE client_user_id = ?`;
        await sdk.rawQuery(deleteSQL, [client_user_id]);
        console.log(
          "Removed existing equipment assignments for client:",
          client_user_id
        );

        // Then insert new assignments
        if (equipment_ids && equipment_ids.length > 0) {
          for (const equipmentId of equipment_ids) {
            const insertSQL = `
              INSERT INTO longtermhire_client_equipment (client_user_id, equipment_id, assigned_by, created_at)
              VALUES (?, ?, ?, ?)
            `;
            await sdk.rawQuery(insertSQL, [
              client_user_id,
              equipmentId,
              2, // Use current admin user ID 2
              currentTime,
            ]);
            console.log(
              `Assigned equipment ${equipmentId} to client ${client_user_id}`
            );
          }
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

  // Assign pricing to client
  app.post(
    "/v1/api/longtermhire/super_admin/assign-pricing",
    async (req, res) => {
      try {
        console.log(
          "POST /v1/api/longtermhire/super_admin/assign-pricing called"
        );
        console.log("Pricing assignment data:", req.body);

        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const { client_user_id, pricing_package_id, custom_discount } =
          req.body;
        const currentTime = new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

        // First, remove existing pricing assignment for this client
        const deleteSQL = `DELETE FROM longtermhire_client_pricing WHERE client_user_id = ?`;
        await sdk.rawQuery(deleteSQL, [client_user_id]);
        console.log(
          "Removed existing pricing assignment for client:",
          client_user_id
        );

        // Then insert new pricing assignment
        if (pricing_package_id) {
          if (
            typeof pricing_package_id === "string" &&
            pricing_package_id.startsWith("custom_")
          ) {
            // Handle custom discount
            const insertSQL = `
              INSERT INTO longtermhire_client_pricing (client_user_id, pricing_package_id, custom_discount_type, custom_discount_value, assigned_by, created_at)
              VALUES (?, ?, ?, ?, ?, ?)
            `;
            await sdk.rawQuery(insertSQL, [
              client_user_id,
              null, // Set pricing_package_id to NULL for custom discounts
              custom_discount?.discountType || "percentage",
              custom_discount?.discountValue || 0,
              2, // Use current admin user ID 2
              currentTime,
            ]);
            console.log(
              `Assigned custom discount to client ${client_user_id}: ${
                custom_discount?.discountValue
              }${
                custom_discount?.discountType === "percentage" ? "%" : "$"
              } off`
            );
          } else {
            // Handle regular pricing package
            const insertSQL = `
              INSERT INTO longtermhire_client_pricing (client_user_id, pricing_package_id, assigned_by, created_at)
              VALUES (?, ?, ?, ?)
            `;
            await sdk.rawQuery(insertSQL, [
              client_user_id,
              pricing_package_id,
              2, // Use current admin user ID 2
              currentTime,
            ]);
            console.log(
              `Assigned pricing package ${pricing_package_id} to client ${client_user_id}`
            );
          }
        }

        return res.status(200).json({
          error: false,
          message: "Pricing assigned successfully",
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

  // Remove pricing assignment from client
  app.delete(
    "/v1/api/longtermhire/super_admin/remove-pricing/:clientUserId",
    TokenMiddleware(),
    async (req, res) => {
      try {
        console.log(
          "DELETE /v1/api/longtermhire/super_admin/remove-pricing/:clientUserId called"
        );
        console.log("Client user ID:", req.params.clientUserId);

        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const { clientUserId } = req.params;

        // Check if client exists
        const clientExists = await sdk.findOne("client", {
          user_id: clientUserId,
        });

        if (!clientExists) {
          return res.status(404).json({
            error: true,
            message: "Client not found",
          });
        }

        // Remove pricing assignment
        const deleteSQL = `DELETE FROM longtermhire_client_pricing WHERE client_user_id = ?`;
        const result = await sdk.rawQuery(deleteSQL, [clientUserId]);

        console.log(
          `Removed pricing assignment for client: ${clientUserId}`,
          result
        );

        return res.status(200).json({
          error: false,
          message: "Pricing assignment removed successfully",
          data: {
            client_user_id: clientUserId,
            removed_at: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.error("Remove pricing error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );
};
