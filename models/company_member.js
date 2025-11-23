/**
 * Company Member Model
 * Handles database operations for company team members
 * Links users to companies with specific roles
 */

class CompanyMemberModel {
  constructor(sdk) {
    this.sdk = sdk;
    this.tableName = 'company_member';
  }

  /**
   * Add a member to a company
   * @param {Object} data - Member data
   * @param {number} data.company_id - Company ID
   * @param {number} data.user_id - User ID
   * @param {string} data.member_name - Member name
   * @param {string} data.member_email - Member email
   * @param {string} [data.member_phone] - Member phone
   * @param {string} data.role - Member role (Company Owner, Engineer, Supervisor, etc.)
   * @returns {Promise<Object>} Created member data
   */
  async create(data) {
    const memberData = {
      company_id: data.company_id,
      user_id: data.user_id,
      member_name: data.member_name,
      member_email: data.member_email,
      member_phone: data.member_phone || null,
      role: data.role,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await this.sdk.create(this.tableName, memberData);
    return result;
  }

  /**
   * Find member by ID
   * @param {number} id - Member ID
   * @returns {Promise<Object|null>} Member data or null
   */
  async findById(id) {
    const members = await this.sdk.rawQuery(
      `SELECT cm.*, u.email as user_email, u.status as user_status
       FROM longtermhire_company_member cm
       JOIN longtermhire_user u ON u.id = cm.user_id
       WHERE cm.id = ? LIMIT 1`,
      [id]
    );
    return members && members.length > 0 ? members[0] : null;
  }

  /**
   * Find all members of a company
   * @param {number} companyId - Company ID
   * @returns {Promise<Array>} Array of members
   */
  async findByCompanyId(companyId) {
    const members = await this.sdk.rawQuery(
      `SELECT cm.*, u.email as user_email, u.status as user_status
       FROM longtermhire_company_member cm
       JOIN longtermhire_user u ON u.id = cm.user_id
       WHERE cm.company_id = ?
       ORDER BY cm.created_at ASC`,
      [companyId]
    );
    return members || [];
  }

  /**
   * Find member by user ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Member data with company info or null
   */
  async findByUserId(userId) {
    const members = await this.sdk.rawQuery(
      `SELECT cm.*, c.company_name, c.company_address, c.company_logo
       FROM longtermhire_company_member cm
       JOIN longtermhire_company c ON c.id = cm.company_id
       WHERE cm.user_id = ? LIMIT 1`,
      [userId]
    );
    return members && members.length > 0 ? members[0] : null;
  }

  /**
   * Check if user is member of company
   * @param {number} companyId - Company ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if member exists
   */
  async isMember(companyId, userId) {
    const members = await this.sdk.rawQuery(
      `SELECT id FROM longtermhire_company_member
       WHERE company_id = ? AND user_id = ? LIMIT 1`,
      [companyId, userId]
    );
    return members && members.length > 0;
  }

  /**
   * Update member
   * @param {number} id - Member ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Update result
   */
  async update(id, data) {
    const updateData = {
      updated_at: new Date()
    };

    if (data.member_name !== undefined) updateData.member_name = data.member_name;
    if (data.member_email !== undefined) updateData.member_email = data.member_email;
    if (data.member_phone !== undefined) updateData.member_phone = data.member_phone;
    if (data.role !== undefined) updateData.role = data.role;

    const result = await this.sdk.update(this.tableName, { id: id }, updateData);
    return result;
  }

  /**
   * Delete member
   * @param {number} id - Member ID
   * @returns {Promise<Object>} Delete result
   */
  async delete(id) {
    const result = await this.sdk.delete(this.tableName, { id: id });
    return result;
  }

  /**
   * Delete all members of a company
   * @param {number} companyId - Company ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteByCompanyId(companyId) {
    const result = await this.sdk.delete(this.tableName, { company_id: companyId });
    return result;
  }

  /**
   * Count members in a company
   * @param {number} companyId - Company ID
   * @returns {Promise<number>} Member count
   */
  async countByCompanyId(companyId) {
    const result = await this.sdk.rawQuery(
      `SELECT COUNT(*) as count FROM longtermhire_company_member WHERE company_id = ?`,
      [companyId]
    );
    return result && result[0] ? result[0].count : 0;
  }

  /**
   * Get company owner
   * @param {number} companyId - Company ID
   * @returns {Promise<Object|null>} Owner member data or null
   */
  async getCompanyOwner(companyId) {
    const members = await this.sdk.rawQuery(
      `SELECT cm.*, u.email as user_email
       FROM longtermhire_company_member cm
       JOIN longtermhire_user u ON u.id = cm.user_id
       WHERE cm.company_id = ? AND cm.role = 'Company Owner'
       LIMIT 1`,
      [companyId]
    );
    return members && members.length > 0 ? members[0] : null;
  }

  /**
   * Update member role
   * @param {number} id - Member ID
   * @param {string} role - New role
   * @returns {Promise<Object>} Update result
   */
  async updateRole(id, role) {
    const result = await this.sdk.update(
      this.tableName,
      { id: id },
      { role: role, updated_at: new Date() }
    );
    return result;
  }
}

module.exports = CompanyMemberModel;
