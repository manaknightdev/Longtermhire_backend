/**
 * Company Model
 * Handles database operations for companies
 * Companies can have multiple team members (company_member table)
 */

class CompanyModel {
  constructor(sdk) {
    this.sdk = sdk;
    this.tableName = 'company';
  }

  /**
   * Create a new company
   * @param {Object} data - Company data
   * @param {string} data.company_name - Company name
   * @param {number} data.owner_user_id - User ID of the company owner
   * @param {string} [data.company_address] - Company address
   * @param {string} [data.company_logo] - URL to company logo
   * @param {string} [data.ad_text] - AD text/HTML content
   * @returns {Promise<Object>} Created company data
   */
  async create(data) {
    const companyData = {
      company_name: data.company_name,
      owner_user_id: data.owner_user_id,
      company_address: data.company_address || null,
      company_logo: data.company_logo || null,
      ad_text: data.ad_text || null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await this.sdk.create(this.tableName, companyData);
    return result;
  }

  /**
   * Find company by ID
   * @param {number} id - Company ID
   * @returns {Promise<Object|null>} Company data or null
   */
  async findById(id) {
    const companies = await this.sdk.rawQuery(
      `SELECT * FROM longtermhire_company WHERE id = ? LIMIT 1`,
      [id]
    );
    return companies && companies.length > 0 ? companies[0] : null;
  }

  /**
   * Find company by owner user ID
   * @param {number} userId - Owner user ID
   * @returns {Promise<Object|null>} Company data or null
   */
  async findByOwnerId(userId) {
    const companies = await this.sdk.rawQuery(
      `SELECT * FROM longtermhire_company WHERE owner_user_id = ? LIMIT 1`,
      [userId]
    );
    return companies && companies.length > 0 ? companies[0] : null;
  }

  /**
   * Find company with members
   * @param {number} id - Company ID
   * @returns {Promise<Object|null>} Company data with members array
   */
  async findByIdWithMembers(id) {
    const company = await this.findById(id);
    if (!company) return null;

    // Get all members
    const members = await this.sdk.rawQuery(
      `SELECT cm.*, u.email, u.status
       FROM longtermhire_company_member cm
       JOIN longtermhire_user u ON u.id = cm.user_id
       WHERE cm.company_id = ?
       ORDER BY cm.created_at ASC`,
      [id]
    );

    company.members = members || [];
    return company;
  }

  /**
   * Update company
   * @param {number} id - Company ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Update result
   */
  async update(id, data) {
    const updateData = {
      updated_at: new Date()
    };

    if (data.company_name !== undefined) updateData.company_name = data.company_name;
    if (data.company_address !== undefined) updateData.company_address = data.company_address;
    if (data.company_logo !== undefined) updateData.company_logo = data.company_logo;
    if (data.ad_text !== undefined) updateData.ad_text = data.ad_text;

    const result = await this.sdk.update(this.tableName, { id: id }, updateData);
    return result;
  }

  /**
   * Delete company
   * @param {number} id - Company ID
   * @returns {Promise<Object>} Delete result
   */
  async delete(id) {
    const result = await this.sdk.delete(this.tableName, { id: id });
    return result;
  }

  /**
   * Get all companies with pagination
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 20)
   * @returns {Promise<Object>} { data: [], pagination: {} }
   */
  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await this.sdk.rawQuery(
      `SELECT COUNT(*) as total FROM longtermhire_company`
    );
    const total = countResult && countResult[0] ? countResult[0].total : 0;

    // Get paginated data
    const companies = await this.sdk.rawQuery(
      `SELECT c.*, u.email as owner_email
       FROM longtermhire_company c
       JOIN longtermhire_user u ON u.id = c.owner_user_id
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return {
      data: companies || [],
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
   * Get company equipment with discounts
   * @param {number} companyId - Company ID
   * @returns {Promise<Array>} Equipment with pricing details
   */
  async getCompanyEquipment(companyId) {
    // Get all clients for this company
    const clients = await this.sdk.rawQuery(
      `SELECT user_id FROM longtermhire_client WHERE company_id = ?`,
      [companyId]
    );

    if (!clients || clients.length === 0) {
      return [];
    }

    const userIds = clients.map(c => c.user_id);

    if (userIds.length === 0) {
      return [];
    }

    // Create placeholders for IN clause
    const placeholders = userIds.map(() => '?').join(',');

    // Get equipment for all company clients
    const equipment = await this.sdk.rawQuery(
      `SELECT DISTINCT
         e.id,
         e.equipment_id,
         e.equipment_name,
         e.category_name,
         CASE WHEN ce.custom_base_price IS NOT NULL THEN ce.custom_base_price ELSE e.base_price END as base_price,
         ce.discount,
         ce.discount_type,
         ce.compounding_discount,
         ce.compounding_discount_type,
         ce.client_user_id
       FROM longtermhire_equipment_item e
       JOIN longtermhire_client_equipment ce ON ce.equipment_id = e.id
       WHERE ce.client_user_id IN (${placeholders})
       ORDER BY e.equipment_name ASC`,
      userIds
    );

    return equipment || [];
  }
}

module.exports = CompanyModel;
