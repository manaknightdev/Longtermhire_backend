const TokenMiddleware = require("../../../baas/middleware/TokenMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");

module.exports = function (app) {
    console.log("Loading company settings routes...");

    // Get company settings (Admin only)
    app.get(
        "/v1/api/longtermhire/settings",
        TokenMiddleware(),
        RoleMiddleware(["super_admin", "member"]),
        async (req, res) => {
            try {
                const sdk = app.get("sdk");
                sdk.setProjectId("longtermhire");

                const settingsSQL = `
          SELECT * FROM longtermhire_company_settings 
          ORDER BY id DESC 
          LIMIT 1
        `;

                const settings = await sdk.rawQuery(settingsSQL);

                if (settings && settings.length > 0) {
                    return res.status(200).json({
                        error: false,
                        data: settings[0],
                    });
                } else {
                    // Return default settings if none exist
                    return res.status(200).json({
                        error: false,
                        data: {
                            company_name: "",
                            company_address: "",
                            company_email: "",
                            company_phone: "",
                            company_logo: null,

                        },
                    });
                }
            } catch (error) {
                console.error("Get settings error:", error);
                return res.status(500).json({
                    error: true,
                    message: error.message || "Internal server error",
                });
            }
        }
    );

    // Update company settings (Admin only)
    app.put(
        "/v1/api/longtermhire/settings",
        TokenMiddleware(),
        RoleMiddleware(["super_admin"]),
        async (req, res) => {
            try {
                const sdk = app.get("sdk");
                sdk.setProjectId("longtermhire");

                const {
                    company_name,
                    company_address,
                    company_email,
                    company_phone,
                    company_logo,

                } = req.body;

                // Check if settings exist
                const checkSQL = `SELECT id FROM longtermhire_company_settings LIMIT 1`;
                const existing = await sdk.rawQuery(checkSQL);

                let result;
                if (existing && existing.length > 0) {
                    // Update existing settings
                    const updateSQL = `
            UPDATE longtermhire_company_settings 
            SET 
              company_name = ?,
              company_address = ?,
              company_email = ?,
              company_phone = ?,
              company_logo = ?,
             
              updated_at = NOW()
            WHERE id = ?
          `;

                    result = await sdk.rawQuery(updateSQL, [
                        company_name || null,
                        company_address || null,
                        company_email || null,
                        company_phone || null,
                        company_logo || null,

                        existing[0].id,
                    ]);
                } else {
                    // Insert new settings
                    const insertSQL = `
            INSERT INTO longtermhire_company_settings 
            (company_name, company_address, company_email, company_phone, company_logo, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
          `;

                    result = await sdk.rawQuery(insertSQL, [
                        company_name || null,
                        company_address || null,
                        company_email || null,
                        company_phone || null,
                        company_logo || null,
                    ]);
                }

                return res.status(200).json({
                    error: false,
                    message: "Settings updated successfully",
                    data: {
                        company_name,
                        company_address,
                        company_email,
                        company_phone,
                        company_logo,
                    },
                });
            } catch (error) {
                console.error("Update settings error:", error);
                return res.status(500).json({
                    error: true,
                    message: error.message || "Internal server error",
                });
            }
        }
    );

    // Get company logo (Public - No authentication required)
    app.get("/v1/api/public/longtermhire/company-logo", async (req, res) => {
        try {
            const sdk = app.get("sdk");
            sdk.setProjectId("longtermhire");

            const logoSQL = `
        SELECT company_logo, company_name 
        FROM longtermhire_company_settings 
        ORDER BY id DESC 
        LIMIT 1
      `;

            const settings = await sdk.rawQuery(logoSQL);

            if (settings && settings.length > 0 && settings[0].company_logo) {
                return res.status(200).json({
                    error: false,
                    data: {
                        logo_url: settings[0].company_logo,
                        company_name: settings[0].company_name || "Equipment Rental",
                    },
                });
            } else {
                return res.status(200).json({
                    error: false,
                    data: {
                        logo_url: null,
                        company_name: "Equipment Rental",
                    },
                });
            }
        } catch (error) {
            console.error("Get public logo error:", error);
            return res.status(500).json({
                error: true,
                message: error.message || "Internal server error",
            });
        }
    });

    console.log("Company settings routes loaded successfully");
};
