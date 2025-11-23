/**
 * Pricing Calculator Utility
 * Handles equipment pricing calculations with primary and compounding discounts
 * Both discounts can be percentage (%) or fixed amount ($)
 *
 * Formula:
 * Step 1: Apply primary discount to base price
 * Step 2: Apply compounding discount to already-discounted price
 */

/**
 * Calculate final equipment price with discounts
 * @param {number|string} basePrice - Base price of equipment
 * @param {number|string} discount - Primary discount value (default: 0)
 * @param {string} discountType - Primary discount type: '%' or '$' (default: '%')
 * @param {number|string} compoundingDiscount - Compounding discount value (default: 0)
 * @param {string} compoundingDiscountType - Compounding discount type: '%' or '$' (default: '%')
 * @returns {number} Final price after all discounts (rounded to 2 decimal places)
 */
function calculateEquipmentPrice(
  basePrice,
  discount = 0,
  discountType = '%',
  compoundingDiscount = 0,
  compoundingDiscountType = '%'
) {
  // Parse and validate inputs
  basePrice = parseFloat(basePrice) || 0;
  discount = parseFloat(discount) || 0;
  compoundingDiscount = parseFloat(compoundingDiscount) || 0;

  // Ensure base price is positive
  if (basePrice < 0) {
    basePrice = 0;
  }

  // Step 1: Apply primary discount
  let discountedPrice = basePrice;

  if (discount > 0) {
    if (discountType === '%') {
      // Percentage discount: ensure it's between 0-100
      const discountPercent = Math.min(Math.max(discount, 0), 100);
      discountedPrice = basePrice * (1 - discountPercent / 100);
    } else if (discountType === '$') {
      // Fixed discount
      discountedPrice = basePrice - discount;
    }
  }

  // Step 2: Apply compounding discount to already-discounted price
  let finalPrice = discountedPrice;

  if (compoundingDiscount > 0) {
    if (compoundingDiscountType === '%') {
      const compoundingPercent = Math.min(Math.max(compoundingDiscount, 0), 100);
      finalPrice = discountedPrice * (1 - compoundingPercent / 100);
    } else if (compoundingDiscountType === '$') {
      finalPrice = discountedPrice - compoundingDiscount;
    }
  }

  // Ensure price never goes negative
  finalPrice = Math.max(0, finalPrice);

  // Round to 2 decimal places
  return Math.round(finalPrice * 100) / 100;
}

/**
 * Validate discount parameters
 * @param {number|string} discount - Discount value
 * @param {string} discountType - Discount type: '%' or '$'
 * @returns {Object} { valid: boolean, error: string|null }
 */
function validateDiscount(discount, discountType) {
  const numValue = parseFloat(discount);

  if (isNaN(numValue)) {
    return { valid: false, error: 'Discount must be a valid number' };
  }

  if (numValue < 0) {
    return { valid: false, error: 'Discount cannot be negative' };
  }

  if (discountType === '%' && numValue > 100) {
    return { valid: false, error: 'Percentage discount cannot exceed 100%' };
  }

  if (!['%', '$'].includes(discountType)) {
    return { valid: false, error: 'Discount type must be % or $' };
  }

  return { valid: true, error: null };
}

/**
 * Calculate price breakdown for display purposes
 * Returns step-by-step calculation details
 * @param {number|string} basePrice - Base price of equipment
 * @param {number|string} discount - Primary discount value
 * @param {string} discountType - Primary discount type
 * @param {number|string} compoundingDiscount - Compounding discount value
 * @param {string} compoundingDiscountType - Compounding discount type
 * @returns {Object} Breakdown with base, after primary discount, and final price
 */
function getPriceBreakdown(
  basePrice,
  discount = 0,
  discountType = '%',
  compoundingDiscount = 0,
  compoundingDiscountType = '%'
) {
  basePrice = parseFloat(basePrice) || 0;
  discount = parseFloat(discount) || 0;
  compoundingDiscount = parseFloat(compoundingDiscount) || 0;

  // Calculate step by step
  let afterPrimaryDiscount = basePrice;
  let primaryDiscountAmount = 0;

  if (discount > 0) {
    if (discountType === '%') {
      const discountPercent = Math.min(Math.max(discount, 0), 100);
      primaryDiscountAmount = basePrice * (discountPercent / 100);
      afterPrimaryDiscount = basePrice - primaryDiscountAmount;
    } else if (discountType === '$') {
      primaryDiscountAmount = Math.min(discount, basePrice); // Can't discount more than base price
      afterPrimaryDiscount = basePrice - primaryDiscountAmount;
    }
  }

  let finalPrice = afterPrimaryDiscount;
  let compoundingDiscountAmount = 0;

  if (compoundingDiscount > 0) {
    if (compoundingDiscountType === '%') {
      const compoundingPercent = Math.min(Math.max(compoundingDiscount, 0), 100);
      compoundingDiscountAmount = afterPrimaryDiscount * (compoundingPercent / 100);
      finalPrice = afterPrimaryDiscount - compoundingDiscountAmount;
    } else if (compoundingDiscountType === '$') {
      compoundingDiscountAmount = Math.min(compoundingDiscount, afterPrimaryDiscount);
      finalPrice = afterPrimaryDiscount - compoundingDiscountAmount;
    }
  }

  // Ensure nothing goes negative
  finalPrice = Math.max(0, finalPrice);

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    primaryDiscount: {
      amount: Math.round(primaryDiscountAmount * 100) / 100,
      type: discountType,
      value: discount
    },
    afterPrimaryDiscount: Math.round(afterPrimaryDiscount * 100) / 100,
    compoundingDiscount: {
      amount: Math.round(compoundingDiscountAmount * 100) / 100,
      type: compoundingDiscountType,
      value: compoundingDiscount
    },
    finalPrice: Math.round(finalPrice * 100) / 100,
    totalSavings: Math.round((basePrice - finalPrice) * 100) / 100
  };
}

/**
 * Generate SQL CASE statement for calculating price in queries
 * Use this in SELECT statements to calculate price directly in database
 * @returns {string} SQL CASE statement
 */
function getPriceSQLFormula() {
  return `
    CASE
      WHEN ce.compounding_discount_type = '%' THEN
        (CASE
          WHEN ce.discount_type = '%' THEN e.base_price * (1 - ce.discount / 100)
          WHEN ce.discount_type = '$' THEN e.base_price - ce.discount
          ELSE e.base_price
        END) * (1 - ce.compounding_discount / 100)
      WHEN ce.compounding_discount_type = '$' THEN
        (CASE
          WHEN ce.discount_type = '%' THEN e.base_price * (1 - ce.discount / 100)
          WHEN ce.discount_type = '$' THEN e.base_price - ce.discount
          ELSE e.base_price
        END) - ce.compounding_discount
      ELSE
        (CASE
          WHEN ce.discount_type = '%' THEN e.base_price * (1 - ce.discount / 100)
          WHEN ce.discount_type = '$' THEN e.base_price - ce.discount
          ELSE e.base_price
        END)
    END
  `.trim();
}

module.exports = {
  calculateEquipmentPrice,
  validateDiscount,
  getPriceBreakdown,
  getPriceSQLFormula
};
