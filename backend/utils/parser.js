/**
 * =====================================================================
 * File: /backend/utils/parser.js
 * Owner: Member 1 (feat/backend-core)
 * Description: Natural language / structured food input parser
 * =====================================================================
 */

/**
 * Placeholder function to parse raw food descriptions into structured portions/items
 * @param {string} rawText Raw input text describing surplus food
 * @returns {Object} Structured food batch properties
 */
function parseFoodInput(rawText) {
  // TODO: (Member 1) Implement parsing logic to extract total_portions, items, trays, allergens
  return {
    rawDescription: typeof rawText === 'string' ? rawText.trim() : '',
    totalPortions: 0,
    hasTrays: false
  };
}

module.exports = {
  parseFoodInput
};
