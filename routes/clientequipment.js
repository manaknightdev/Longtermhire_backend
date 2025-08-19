const TokenMiddleware = require("../../../baas/middleware/TokenMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");
const MailService = require("../../../baas/services/MailService");

module.exports = function (app) {
  // Get client's assigned equipment with pricing and discounts
  app.get(
    "/v1/api/longtermhire/client/equipment",
    TokenMiddleware(),
    RoleMiddleware(["member"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        console.log("🔍 Getting equipment for client user:", req.user_id);

        // Get equipment assigned to this client with content, images, and pricing
        const equipment = await sdk.rawQuery(
          `
          SELECT
            e.*,
            c.description as content_description,
            c.banner_description,
            c.image_url as content_image,
            GROUP_CONCAT(
              CASE WHEN ci.id IS NOT NULL THEN
                JSON_OBJECT(
                  'id', ci.id,
                  'image_url', ci.image_url,
                  'image_order', ci.image_order,
                  'is_main', ci.is_main,
                  'caption', ci.caption
                )
              ELSE NULL END
              ORDER BY ci.image_order ASC SEPARATOR '|||'
            ) as content_images,
            pp.name as package_name,
            pp.description as package_description,
            pp.discount_type as package_discount_type,
            pp.discount_value as package_discount_value,
            ce.custom_discount_type,
            ce.custom_discount_value,
            e.minimum_duration,
            CASE
              WHEN ce.custom_discount_type = 'percentage' THEN e.base_price - (e.base_price * ce.custom_discount_value / 100)
              WHEN ce.custom_discount_type = 'fixed' THEN e.base_price - ce.custom_discount_value
              WHEN pp.discount_type = 0 THEN e.base_price - (e.base_price * pp.discount_value / 100)
              WHEN pp.discount_type = 1 THEN e.base_price - pp.discount_value
              ELSE e.base_price
            END as discounted_price
          FROM longtermhire_client_equipment ce
          JOIN longtermhire_equipment_item e ON ce.equipment_id = e.id
          LEFT JOIN longtermhire_content c ON e.id = c.equipment_id
          LEFT JOIN longtermhire_content_images ci ON c.id = ci.content_id
          LEFT JOIN longtermhire_client_pricing cp ON cp.client_user_id = ce.client_user_id
          LEFT JOIN longtermhire_pricing_package pp ON cp.pricing_package_id = pp.id
          WHERE ce.client_user_id = ? AND e.availability = 1
          GROUP BY e.id, c.id, pp.id
          ORDER BY e.category_name, e.equipment_name
        `,
          [req.user_id]
        );

        console.log(`✅ Found ${equipment.length} equipment items for client`);

        // Debug: Log first equipment item to see what we're getting
        if (equipment.length > 0) {
          console.log("🔍 Debug - First equipment item:", {
            id: equipment[0].id,
            equipment_id: equipment[0].equipment_id,
            equipment_name: equipment[0].equipment_name,
            content_description: equipment[0].content_description,
            content_image: equipment[0].content_image,
            content_images: equipment[0].content_images,
            content_images_length: equipment[0].content_images
              ? equipment[0].content_images.length
              : 0,
          });
        }

        // Debug: Log all equipment items to see content_images
        console.log("🔍 Debug - All equipment content_images:");
        equipment.forEach((item, index) => {
          console.log(
            `  ${index + 1}. ${item.equipment_name} (${
              item.equipment_id
            }): content_images = "${item.content_images}"`
          );
        });

        // Process equipment data to determine discount information and parse images
        const processedEquipment = equipment.map((item) => {
          // Determine discount type and value with proper priority:
          // 1. Equipment-specific custom discount (highest priority)
          // 2. Pricing package discount (fallback)
          // 3. No discount (base price)
          let discount_type = null;
          let discount_value = 0;
          let discount_source = null;

          if (item.custom_discount_type && item.custom_discount_value) {
            // Use equipment-specific custom discount (highest priority)
            discount_type = item.custom_discount_type;
            discount_value = parseFloat(item.custom_discount_value);
            discount_source = "equipment_specific";
          } else if (
            item.package_discount_type !== null &&
            item.package_discount_value
          ) {
            // Use pricing package discount (fallback)
            discount_type =
              item.package_discount_type === 0 ? "percentage" : "fixed";
            discount_value = parseFloat(item.package_discount_value);
            discount_source = "pricing_package";
          }

          // Process images data
          let images = [];
          if (item.content_images && item.content_images !== "null") {
            try {
              const imageStrings = item.content_images.split("|||");
              images = imageStrings
                .map((imgStr) => {
                  try {
                    const parsed = JSON.parse(imgStr);
                    return parsed && parsed.id !== null ? parsed : null;
                  } catch (e) {
                    return null;
                  }
                })
                .filter((img) => img !== null && img.id !== null);
            } catch (e) {
              images = [];
            }
          }

          return {
            id: item.id,
            equipment_id: item.equipment_id,
            equipment_name: item.equipment_name,
            category_name: item.category_name,
            base_price: parseFloat(item.base_price),
            discounted_price: parseFloat(
              item.discounted_price || item.base_price
            ),
            discount_type: discount_type,
            discount_value: discount_value,
            discount_source: discount_source,
            minimum_duration: item.minimum_duration,
            availability: item.availability,
            content: {
              description: item.content_description,
              banner_description: item.banner_description,
              image: item.content_image, // Keep for backward compatibility
              images: images, // Use the parsed images from longtermhire_content_images table
            },
            pricing_package: {
              name: item.package_name,
              description: item.package_description,
            },
          };
        });

        // Group equipment by category for better organization
        const groupedEquipment = processedEquipment.reduce((acc, item) => {
          const category = item.category_name || "Uncategorized";
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(item);
          return acc;
        }, {});

        return res.status(200).json({
          error: false,
          data: {
            equipment: processedEquipment,
            grouped_equipment: groupedEquipment,
            total_count: processedEquipment.length,
          },
          message: "Equipment retrieved successfully",
        });
      } catch (error) {
        console.error("Get client equipment error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );

  // Get specific equipment details for client
  app.get(
    "/v1/api/longtermhire/client/equipment/:equipmentId",
    TokenMiddleware(),
    RoleMiddleware(["member"]),
    async (req, res) => {
      try {
        const { equipmentId } = req.params;
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        console.log(
          "🔍 Getting equipment details for client:",
          req.user_id,
          "equipment:",
          equipmentId
        );

        // Verify client has access to this equipment
        const equipment = await sdk.rawQuery(
          `
          SELECT 
            e.*,
            c.description as content_description,
            c.banner_description,
            c.image_url as content_image,
            GROUP_CONCAT(
              CASE WHEN ci.id IS NOT NULL THEN
                JSON_OBJECT(
                  'id', ci.id,
                  'image_url', ci.image_url,
                  'image_order', ci.image_order,
                  'is_main', ci.is_main,
                  'caption', ci.caption
                )
              ELSE NULL END
              ORDER BY ci.image_order ASC SEPARATOR '|||'
            ) as content_images,
            pp.name as package_name,
            pp.description as package_description,
            pp.discount_type as package_discount_type,
            pp.discount_value as package_discount_value,
            ce.custom_discount_type,
            ce.custom_discount_value,
            e.minimum_duration,
            CASE 
              WHEN ce.custom_discount_type = 'percentage' THEN e.base_price - (e.base_price * ce.custom_discount_value / 100)
              WHEN ce.custom_discount_type = 'fixed' THEN e.base_price - ce.custom_discount_value
              WHEN pp.discount_type = 0 THEN e.base_price - (e.base_price * pp.discount_value / 100)
              WHEN pp.discount_type = 1 THEN e.base_price - pp.discount_value
              ELSE e.base_price
            END as discounted_price
          FROM longtermhire_client_equipment ce
          JOIN longtermhire_equipment_item e ON ce.equipment_id = e.id
          LEFT JOIN longtermhire_content c ON e.id = c.equipment_id
          LEFT JOIN longtermhire_content_images ci ON c.id = ci.content_id
          LEFT JOIN longtermhire_client_pricing cp ON cp.client_user_id = ce.client_user_id
          LEFT JOIN longtermhire_pricing_package pp ON cp.pricing_package_id = pp.id
          WHERE ce.client_user_id = ? AND e.id = ?
          GROUP BY e.id, c.id, pp.id
        `,
          [req.user_id, equipmentId]
        );

        if (!equipment || equipment.length === 0) {
          return res.status(404).json({
            error: true,
            message: "Equipment not found or not assigned to you",
          });
        }

        const item = equipment[0];

        // Determine discount type and value with proper priority:
        // 1. Equipment-specific custom discount (highest priority)
        // 2. Pricing package discount (fallback)
        // 3. No discount (base price)
        let discount_type = null;
        let discount_value = 0;
        let discount_source = null;

        if (item.custom_discount_type && item.custom_discount_value) {
          // Use equipment-specific custom discount (highest priority)
          discount_type = item.custom_discount_type;
          discount_value = parseFloat(item.custom_discount_value);
          discount_source = "equipment_specific";
        } else if (
          item.package_discount_type !== null &&
          item.package_discount_value
        ) {
          // Use pricing package discount (fallback)
          discount_type =
            item.package_discount_type === 0 ? "percentage" : "fixed";
          discount_value = parseFloat(item.package_discount_value);
          discount_source = "pricing_package";
        }

        // Process images data
        let images = [];
        if (item.content_images && item.content_images !== "null") {
          try {
            const imageStrings = item.content_images.split("|||");
            images = imageStrings
              .map((imgStr) => {
                try {
                  const parsed = JSON.parse(imgStr);
                  return parsed && parsed.id !== null ? parsed : null;
                } catch (e) {
                  return null;
                }
              })
              .filter((img) => img !== null && img.id !== null);
          } catch (e) {
            images = [];
          }
        }

        return res.status(200).json({
          error: false,
          data: {
            id: item.id,
            equipment_id: item.equipment_id,
            equipment_name: item.equipment_name,
            category_name: item.category_name,
            base_price: parseFloat(item.base_price),
            discounted_price: parseFloat(
              item.discounted_price || item.base_price
            ),
            discount_type: discount_type,
            discount_value: discount_value,
            discount_source: discount_source,
            minimum_duration: item.minimum_duration,
            availability: item.availability,
            content: {
              description: item.content_description,
              banner_description: item.banner_description,
              image: item.content_image, // Keep for backward compatibility
              images: images, // Use the parsed images from longtermhire_content_images table
            },
            pricing_package: {
              name: item.package_name,
              description: item.package_description,
            },
          },
          message: "Equipment details retrieved successfully",
        });
      } catch (error) {
        console.error("Get client equipment details error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );

  // Submit equipment request
  app.post(
    "/v1/api/longtermhire/client/equipment/request",
    TokenMiddleware(),
    RoleMiddleware(["member"]),
    async (req, res) => {
      try {
        const { equipment_id, message } = req.body;
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        if (!equipment_id) {
          return res.status(400).json({
            error: true,
            message: "Equipment ID is required",
          });
        }

        console.log("📝 Client submitting equipment request:", {
          client_user_id: req.user_id,
          equipment_id,
          message,
        });

        // Check if equipment exists and is available
        const equipment = await sdk.findOne("equipment_item", {
          id: equipment_id,
          availability: 1,
        });

        if (!equipment) {
          return res.status(404).json({
            error: true,
            message: "Equipment not found or not available",
          });
        }

        // Create the request
        const request = await sdk.create("request", {
          client_user_id: req.user_id,
          equipment_id: equipment_id,
          message: message || "",
          status: "pending",
          created_at: new Date(),
          updated_at: new Date(),
        });

        console.log("✅ Equipment request created:", request.id);

        // Attempt to notify admin via email
        try {
          const config = app.get("configuration");
          const mailService = new MailService(config);

          const to = "admin@longtermhire.com";
          const from =
            (config.mail && config.mail.from_mail) ||
            "noreply@equipmenthire.com";

          const htmlContent = `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; background-color: #292A2B;">
              <div style="background-color: #1F1F20; padding: 24px; border-radius: 8px; border: 2px solid #E5E7EB;">
                <h2 style="color: #E5E5E5; margin: 0; font-weight: 500;">📝 New Equipment Request</h2>
                <p style="color: #ADAEBC; margin: 12px 0 0 0;">A client submitted a new equipment request.</p>
                <div style="background: #292A2B; padding: 16px; border-radius: 6px; margin: 16px 0; border: 1px solid #444444;">
                  <p style="color: #E5E5E5; margin: 0;">
                    <strong style="color:#FDCE06;">Request ID:</strong> ${
                      request.id || "(pending id)"
                    }<br/>
                    <strong style="color:#FDCE06;">Client User ID:</strong> ${
                      req.user_id
                    }<br/>
                    <strong style="color:#FDCE06;">Equipment ID:</strong> ${equipment_id}<br/>
                    <strong style="color:#FDCE06;">Equipment Name:</strong> ${
                      equipment.equipment_name || "N/A"
                    }<br/>
                    <strong style="color:#FDCE06;">Message:</strong> ${
                      message || ""
                    }
                  </p>
                </div>
                <p style="color:#ADAEBC; margin: 0;">Please review this request in the admin dashboard.</p>
                <p style="color:#666; font-size:12px; margin-top:16px;">Sent on ${new Date().toLocaleString()}</p>
              </div>
            </div>`;

          await mailService.send(
            from,
            to,
            "📝 New Equipment Request Submitted",
            htmlContent
          );

          console.log(`📧 Admin notification sent to ${to}.`);
        } catch (mailErr) {
          console.error("❌ Failed to send admin notification email:", mailErr);
        }

        return res.status(201).json({
          error: false,
          data: request,
          message: "Equipment request submitted successfully",
        });
      } catch (error) {
        console.error("Submit equipment request error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );
};
