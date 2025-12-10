const TokenMiddleware = require("../../../baas/middleware/TokenMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");
const QuoteModel = require("../models/quote");

module.exports = function (app) {
  console.log("Loading quote routes...");

  /**
   * Get all quotes with pagination and filters
   * GET /v1/api/longtermhire/super_admin/quotes
   */
  app.get(
    "/v1/api/longtermhire/super_admin/quotes",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const filters = {
          quoteId: req.query.quote_id || req.query.quoteId, // Support both snake_case and camelCase
          companyName: req.query.companyName,
          status: req.query.status
        };

        const quoteModel = new QuoteModel(sdk);
        const result = await quoteModel.findAll(page, limit, filters);

        return res.status(200).json({
          error: false,
          ...result
        });

      } catch (error) {
        console.error("Get quotes error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Failed to get quotes"
        });
      }
    }
  );

  /**
   * Get quote by ID
   * GET /v1/api/longtermhire/super_admin/quotes/:id
   */
  app.get(
    "/v1/api/longtermhire/super_admin/quotes/:id",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const quoteId = req.params.id;
        const quoteModel = new QuoteModel(sdk);
        const quote = await quoteModel.findById(quoteId);

        if (!quote) {
          return res.status(404).json({
            error: true,
            message: "Quote not found"
          });
        }

        return res.status(200).json({
          error: false,
          data: quote
        });

      } catch (error) {
        console.error("Get quote error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Failed to get quote"
        });
      }
    }
  );

  /**
   * Create a new quote
   * POST /v1/api/longtermhire/super_admin/quotes
   */
  app.post(
    "/v1/api/longtermhire/super_admin/quotes",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const {
          company_id,
          client_user_id,
          company_name,
          company_address,
          company_email,
          company_logo,
          quote_expires_after,
          produce_quote_for,
          gst_percentage,
          terms_of_hire,
          status
        } = req.body;

        // Validation
        if (!company_name || !company_email) {
          return res.status(400).json({
            error: true,
            message: "Company name and email are required"
          });
        }

        // Create quote
        const quoteModel = new QuoteModel(sdk);
        const quote = await quoteModel.create({
          company_id,
          client_user_id,
          company_name,
          company_address,
          company_email,
          company_logo,
          quote_expires_after: quote_expires_after || 7,
          produce_quote_for: produce_quote_for || 12,
          gst_percentage: gst_percentage || 15,
          terms_of_hire,
          status: status || 'Active',
          created_by: req.user_id
        });

        // Get the created quote details
        const createdQuote = await quoteModel.findByQuoteId(quote.quote_id);

        return res.status(201).json({
          error: false,
          message: "Quote created successfully",
          data: createdQuote
        });

      } catch (error) {
        console.error("Create quote error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Failed to create quote"
        });
      }
    }
  );

  /**
   * Update a quote
   * PUT /v1/api/longtermhire/super_admin/quotes/:id
   */
  app.put(
    "/v1/api/longtermhire/super_admin/quotes/:id",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const quoteId = req.params.id;
        const {
          company_name,
          company_address,
          company_email,
          company_logo,
          quote_expires_after,
          produce_quote_for,
          gst_percentage,
          terms_of_hire,
          status
        } = req.body;

        const quoteModel = new QuoteModel(sdk);

        // Check if quote exists
        const quote = await quoteModel.findById(quoteId);
        if (!quote) {
          return res.status(404).json({
            error: true,
            message: "Quote not found"
          });
        }

        // Update quote
        await quoteModel.update(quoteId, {
          company_name,
          company_address,
          company_email,
          company_logo,
          quote_expires_after,
          produce_quote_for,
          gst_percentage,
          terms_of_hire,
          status
        });

        // Get updated quote
        const updatedQuote = await quoteModel.findById(quoteId);

        return res.status(200).json({
          error: false,
          message: "Quote updated successfully",
          data: updatedQuote
        });

      } catch (error) {
        console.error("Update quote error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Failed to update quote"
        });
      }
    }
  );

  /**
   * Delete a quote
   * DELETE /v1/api/longtermhire/super_admin/quotes/:id
   */
  app.delete(
    "/v1/api/longtermhire/super_admin/quotes/:id",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const quoteId = req.params.id;
        const quoteModel = new QuoteModel(sdk);

        // Check if quote exists
        const quote = await quoteModel.findById(quoteId);
        if (!quote) {
          return res.status(404).json({
            error: true,
            message: "Quote not found"
          });
        }

        // Delete quote
        await quoteModel.delete(quoteId);

        return res.status(200).json({
          error: false,
          message: "Quote deleted successfully"
        });

      } catch (error) {
        console.error("Delete quote error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Failed to delete quote"
        });
      }
    }
  );

  /**
   * Get quotes by company
   * GET /v1/api/longtermhire/super_admin/quotes/company/:companyId
   */
  app.get(
    "/v1/api/longtermhire/super_admin/quotes/company/:companyId",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const companyId = req.params.companyId;
        const quoteModel = new QuoteModel(sdk);
        const quotes = await quoteModel.findByCompanyId(companyId);

        return res.status(200).json({
          error: false,
          data: quotes
        });

      } catch (error) {
        console.error("Get company quotes error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Failed to get company quotes"
        });
      }
    }
  );
};
