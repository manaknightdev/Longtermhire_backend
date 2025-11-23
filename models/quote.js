/**
 * Quote Model
 * Handles database operations for quotes
 * Quotes store configuration only - PDF is generated on frontend
 */

class QuoteModel {
  constructor(sdk) {
    this.sdk = sdk;
    this.tableName = 'quote';
  }

  /**
   * Generate next quote ID (Q001, Q002, etc.)
   * @returns {Promise<string>} Next quote ID
   */
  async generateQuoteId() {
    const result = await this.sdk.rawQuery(
      `SELECT quote_id FROM longtermhire_quote ORDER BY id DESC LIMIT 1`
    );

    if (!result || result.length === 0) {
      return 'Q001';
    }

    const lastQuoteId = result[0].quote_id;
    const numberPart = parseInt(lastQuoteId.substring(1));
    const nextNumber = numberPart + 1;

    return 'Q' + nextNumber.toString().padStart(3, '0');
  }

  /**
   * Create a new quote
   * @param {Object} data - Quote data
   * @returns {Promise<Object>} Created quote data
   */
  async create(data) {
    const quoteId = await this.generateQuoteId();

    const quoteData = {
      quote_id: quoteId,
      company_id: data.company_id || null,
      client_user_id: data.client_user_id || null,
      company_name: data.company_name,
      company_address: data.company_address || null,
      company_email: data.company_email,
      company_logo: data.company_logo || null,
      quote_expires_after: data.quote_expires_after || 7,
      produce_quote_for: data.produce_quote_for || 12,
      gst_percentage: data.gst_percentage || 15,
      terms_of_hire: data.terms_of_hire || null,
      status: data.status || 'Active',
      created_by: data.created_by,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await this.sdk.create(this.tableName, quoteData);
    return { ...result, quote_id: quoteId };
  }

  /**
   * Find quote by ID
   * @param {number} id - Quote ID
   * @returns {Promise<Object|null>} Quote data or null
   */
  async findById(id) {
    const quotes = await this.sdk.rawQuery(
      `SELECT q.*, u.email as created_by_email
       FROM longtermhire_quote q
       JOIN longtermhire_user u ON u.id = q.created_by
       WHERE q.id = ? LIMIT 1`,
      [id]
    );
    return quotes && quotes.length > 0 ? quotes[0] : null;
  }

  /**
   * Find quote by quote_id (Q001, Q002, etc.)
   * @param {string} quoteId - Quote ID string
   * @returns {Promise<Object|null>} Quote data or null
   */
  async findByQuoteId(quoteId) {
    const quotes = await this.sdk.rawQuery(
      `SELECT q.*, u.email as created_by_email
       FROM longtermhire_quote q
       JOIN longtermhire_user u ON u.id = q.created_by
       WHERE q.quote_id = ? LIMIT 1`,
      [quoteId]
    );
    return quotes && quotes.length > 0 ? quotes[0] : null;
  }

  /**
   * Find all quotes with pagination and filters
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} filters - Search filters
   * @returns {Promise<Object>} { data: [], pagination: {} }
   */
  async findAll(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (filters.quoteId) {
      whereClause += ' AND q.quote_id LIKE ?';
      params.push(`%${filters.quoteId}%`);
    }

    if (filters.companyName) {
      whereClause += ' AND q.company_name LIKE ?';
      params.push(`%${filters.companyName}%`);
    }

    if (filters.status) {
      whereClause += ' AND q.status = ?';
      params.push(filters.status);
    }

    // Get total count
    const countResult = await this.sdk.rawQuery(
      `SELECT COUNT(*) as total FROM longtermhire_quote q ${whereClause}`,
      params
    );
    const total = countResult && countResult[0] ? countResult[0].total : 0;

    // Get paginated data
    const quotes = await this.sdk.rawQuery(
      `SELECT q.*, u.email as created_by_email
       FROM longtermhire_quote q
       JOIN longtermhire_user u ON u.id = q.created_by
       ${whereClause}
       ORDER BY q.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      data: quotes || [],
      pagination: {
        page: page,
        limit: limit,
        total: total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Update quote
   * @param {number} id - Quote ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Update result
   */
  async update(id, data) {
    const updateData = {
      updated_at: new Date()
    };

    if (data.company_name !== undefined) updateData.company_name = data.company_name;
    if (data.company_address !== undefined) updateData.company_address = data.company_address;
    if (data.company_email !== undefined) updateData.company_email = data.company_email;
    if (data.company_logo !== undefined) updateData.company_logo = data.company_logo;
    if (data.quote_expires_after !== undefined) updateData.quote_expires_after = data.quote_expires_after;
    if (data.produce_quote_for !== undefined) updateData.produce_quote_for = data.produce_quote_for;
    if (data.gst_percentage !== undefined) updateData.gst_percentage = data.gst_percentage;
    if (data.terms_of_hire !== undefined) updateData.terms_of_hire = data.terms_of_hire;
    if (data.status !== undefined) updateData.status = data.status;

    const result = await this.sdk.update(this.tableName, { id: id }, updateData);
    return result;
  }

  /**
   * Delete quote
   * @param {number} id - Quote ID
   * @returns {Promise<Object>} Delete result
   */
  async delete(id) {
    const result = await this.sdk.delete(this.tableName, { id: id });
    return result;
  }

  /**
   * Find quotes by company
   * @param {number} companyId - Company ID
   * @returns {Promise<Array>} Array of quotes
   */
  async findByCompanyId(companyId) {
    const quotes = await this.sdk.rawQuery(
      `SELECT q.*, u.email as created_by_email
       FROM longtermhire_quote q
       JOIN longtermhire_user u ON u.id = q.created_by
       WHERE q.company_id = ?
       ORDER BY q.created_at DESC`,
      [companyId]
    );
    return quotes || [];
  }

  /**
   * Find quotes by client user
   * @param {number} clientUserId - Client user ID
   * @returns {Promise<Array>} Array of quotes
   */
  async findByClientUserId(clientUserId) {
    const quotes = await this.sdk.rawQuery(
      `SELECT q.*, u.email as created_by_email
       FROM longtermhire_quote q
       JOIN longtermhire_user u ON u.id = q.created_by
       WHERE q.client_user_id = ?
       ORDER BY q.created_at DESC`,
      [clientUserId]
    );
    return quotes || [];
  }
}

module.exports = QuoteModel;
