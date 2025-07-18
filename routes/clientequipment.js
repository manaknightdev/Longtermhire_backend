const TokenMiddleware = require("../../../baas/middleware/TokenMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");

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

        // Get equipment assigned to this client with content and pricing
        const equipment = await sdk.rawQuery(
          `
          SELECT
            e.*,
            c.description as content_description,
            c.banner_description,
            c.image_url as content_image,
            pp.name as package_name,
            pp.description as package_description,
            pp.discount_type,
            pp.discount_value,
            CASE
              WHEN pp.discount_type = 0 THEN e.base_price - (e.base_price * pp.discount_value / 100)
              WHEN pp.discount_type = 1 THEN e.base_price - pp.discount_value
              ELSE e.base_price
            END as discounted_price,
            CASE
              WHEN pp.discount_type = 0 THEN pp.discount_value
              WHEN pp.discount_type = 1 THEN ROUND((pp.discount_value / e.base_price) * 100, 2)
              ELSE 0
            END as discount_percentage
          FROM longtermhire_client_equipment ce
          JOIN longtermhire_equipment_item e ON ce.equipment_id = e.id
          LEFT JOIN longtermhire_content c ON e.id = c.equipment_id
          LEFT JOIN longtermhire_client_pricing cp ON cp.client_user_id = ce.client_user_id
          LEFT JOIN longtermhire_pricing_package pp ON cp.pricing_package_id = pp.id
          WHERE ce.client_user_id = ? AND e.availability = 1
          ORDER BY e.category_name, e.equipment_name
        `,
          [req.user_id]
        );

        console.log(`✅ Found ${equipment.length} equipment items for client`);

        // Group equipment by category for better organization
        const groupedEquipment = equipment.reduce((acc, item) => {
          const category = item.category_name || "Uncategorized";
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push({
            id: item.id,
            equipment_id: item.equipment_id,
            equipment_name: item.equipment_name,
            category_name: item.category_name,
            base_price: parseFloat(item.base_price),
            discounted_price: parseFloat(
              item.discounted_price || item.base_price
            ),
            discount_percentage: parseFloat(item.discount_percentage || 0),
            availability: item.availability,
            content: {
              description: item.content_description,
              banner_description: item.banner_description,
              image: item.content_image,
            },
            pricing_package: {
              name: item.package_name,
              description: item.package_description,
              discount_type: item.discount_type,
              discount_value: parseFloat(item.discount_value || 0),
            },
          });
          return acc;
        }, {});

        return res.status(200).json({
          error: false,
          data: {
            equipment: equipment.map((item) => ({
              id: item.id,
              equipment_id: item.equipment_id,
              equipment_name: item.equipment_name,
              category_name: item.category_name,
              base_price: parseFloat(item.base_price),
              discounted_price: parseFloat(
                item.discounted_price || item.base_price
              ),
              discount_percentage: parseFloat(item.discount_percentage || 0),
              availability: item.availability,
              content: {
                description: item.content_description,
                banner_description: item.banner_description,
                image: item.content_image,
              },
              pricing_package: {
                name: item.package_name,
                description: item.package_description,
                discount_type: item.discount_type,
                discount_value: parseFloat(item.discount_value || 0),
              },
            })),
            grouped_equipment: groupedEquipment,
            total_count: equipment.length,
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
            pp.name as package_name,
            pp.description as package_description,
            pp.discount_type,
            pp.discount_value,
            CASE 
              WHEN pp.discount_type = 0 THEN e.base_price - (e.base_price * pp.discount_value / 100)
              WHEN pp.discount_type = 1 THEN e.base_price - pp.discount_value
              ELSE e.base_price
            END as discounted_price,
            CASE 
              WHEN pp.discount_type = 0 THEN pp.discount_value
              WHEN pp.discount_type = 1 THEN ROUND((pp.discount_value / e.base_price) * 100, 2)
              ELSE 0
            END as discount_percentage
          FROM longtermhire_client_equipment ce
          JOIN longtermhire_equipment_item e ON ce.equipment_id = e.id
          LEFT JOIN longtermhire_content c ON e.equipment_id = c.equipment_id
          LEFT JOIN longtermhire_client_pricing cp ON cp.client_user_id = ce.client_user_id
          LEFT JOIN longtermhire_pricing_package pp ON cp.pricing_package_id = pp.id
          WHERE ce.client_user_id = ? AND e.id = ?
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
            discount_percentage: parseFloat(item.discount_percentage || 0),
            availability: item.availability,
            content: {
              description: item.content_description,
              banner_description: item.banner_description,
              image: item.content_image,
            },
            pricing_package: {
              name: item.package_name,
              description: item.package_description,
              discount_type: item.discount_type,
              discount_value: parseFloat(item.discount_value || 0),
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
