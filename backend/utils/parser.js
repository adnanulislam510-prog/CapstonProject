<<<<<<< HEAD
const DEFAULT_PORTIONS = 20;
const DEFAULT_PICKUP_LOCATION = 'Back gate';
const DEFAULT_HOLD_HHMM = '23:30';

/**
 * Returns the food-safety maximum deadline (02:00 AM next morning for the active service night).
 */
function getFoodSafetyCeiling(referenceDate = new Date()) {
  const ref = new Date(referenceDate);
  const ceiling = new Date(ref);
  if (ref.getHours() >= 3) {
    ceiling.setDate(ceiling.getDate() + 1);
  }
  ceiling.setHours(2, 0, 0, 0);
  return ceiling;
}

/**
 * Caps any deadline timestamp at the food-safety ceiling (02:00 AM next morning)
 * so cooked surplus food is never held overnight past safe consumption limits.
 */
function enforceFoodSafetyDeadline(isoOrDate, referenceDate = new Date()) {
  const parsed = isoOrDate instanceof Date ? new Date(isoOrDate.getTime()) : new Date(isoOrDate);
  if (Number.isNaN(parsed.getTime())) {
    const err = new Error('Invalid hold_until datetime value.');
    err.code = 'INVALID_HOLD_UNTIL';
    throw err;
  }

  const ceiling = getFoodSafetyCeiling(referenceDate);
  if (parsed.getTime() > ceiling.getTime()) {
    return ceiling.toISOString();
  }
  return parsed.toISOString();
}

/**
 * Maps a 24-hour hour/minute pair onto the current service night and applies the food-safety cap.
 */
function resolveServiceTime(hour24, minute, referenceDate = new Date()) {
  const ref = new Date(referenceDate);
  const target = new Date(ref);

  if (ref.getHours() >= 3 && hour24 < 6) {
    target.setDate(target.getDate() + 1);
  }
  target.setHours(hour24, minute, 0, 0);
  return enforceFoodSafetyDeadline(target, ref);
}

/**
 * Converts a 24-hour HH:MM string (e.g., "23:30") to tonight's ISO datetime string.
 */
function buildTonightIso(hhmm = DEFAULT_HOLD_HHMM, referenceDate = new Date()) {
  const match = typeof hhmm === 'string' && hhmm.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) {
    return resolveServiceTime(23, 30, referenceDate);
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return resolveServiceTime(hour, minute, referenceDate);
}

function formatPickupLocation(location) {
  const cleaned = location
    .replace(/\b(?:until|before|by|after)\s+.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[,.\-:\s]+|[,.\-:\s]+$/g, '');

  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Parses a single-line closing-time surplus description such as:
 * "about 30 plates rice and dal, 2 trays chicken curry, can hold until 11:30pm, pickup from back gate"
 *
 * Returns `{ total_portions, has_trays, hold_until, pickup_location }`.
 */
function parseFoodInput(rawText, fallbackLocation, fallbackHoldUntil, referenceDate = new Date()) {
  const text = typeof rawText === 'string' ? rawText.trim() : '';

  // 1. Extract and sum portion counts
  let portionSum = 0;
  const portionRegex = /\b(\d+)\s*(?:plates?|portions?|packets?|packs?|boxes?|box|meals?|servings?)\b/gi;
  for (const match of text.matchAll(portionRegex)) {
    const qty = Number(match[1]);
    if (Number.isInteger(qty) && qty > 0) {
      portionSum += qty;
    }
  }
  const total_portions = portionSum > 0 ? portionSum : DEFAULT_PORTIONS;

  // 2. Detect open trays
  const has_trays = /\btrays?\b/i.test(text) ? 1 : 0;

  // 3. Extract deadline time or fall back safely
  let hold_until;
  const ampmMatch = text.match(/\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)\b/i);
  if (ampmMatch) {
    let hour = Number(ampmMatch[1]);
    const minute = ampmMatch[2] ? Number(ampmMatch[2]) : 0;
    const period = ampmMatch[3].toLowerCase();

    if (period === 'pm' && hour < 12) {
      hour += 12;
    } else if (period === 'am' && hour === 12) {
      hour = 0;
    }
    hold_until = resolveServiceTime(hour, minute, referenceDate);
  } else {
    const time24Match = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (time24Match) {
      hold_until = resolveServiceTime(Number(time24Match[1]), Number(time24Match[2]), referenceDate);
    } else if (typeof fallbackHoldUntil === 'string' && fallbackHoldUntil.trim()) {
      const trimmedFallback = fallbackHoldUntil.trim();
      hold_until = /^([01]?\d|2[0-3]):([0-5]\d)$/.test(trimmedFallback)
        ? buildTonightIso(trimmedFallback, referenceDate)
        : enforceFoodSafetyDeadline(trimmedFallback, referenceDate);
    } else if (fallbackHoldUntil instanceof Date) {
      hold_until = enforceFoodSafetyDeadline(fallbackHoldUntil, referenceDate);
    } else {
      hold_until = buildTonightIso(DEFAULT_HOLD_HHMM, referenceDate);
    }
  }

  // 4. Extract pickup location ("pickup from ..." or "... gate") or fall back to restaurant default
  let pickup_location = '';
  const explicitPickupMatch = text.match(/\bpick\s*-?\s*up\s+(?:from|at)\s+([^,.;\n]+)/i);
  if (explicitPickupMatch && explicitPickupMatch[1]) {
    pickup_location = formatPickupLocation(explicitPickupMatch[1]);
  }

  if (!pickup_location) {
    const gateMatch = text.match(
      /\b(?:from\s+|at\s+|near\s+)?((?:(?:back|front|side|main|rear|north|south|east|west|kitchen|service)\s+)?gate(?:\s+(?!until\b|before\b|by\b|after\b)[a-z0-9#-]+){0,3})/i
    );
    if (gateMatch && gateMatch[1]) {
      pickup_location = formatPickupLocation(gateMatch[1]);
    }
  }

  if (!pickup_location) {
    pickup_location =
      typeof fallbackLocation === 'string' && fallbackLocation.trim()
        ? fallbackLocation.trim()
        : DEFAULT_PICKUP_LOCATION;
  }

  return {
    total_portions,
    has_trays,
    hold_until,
    pickup_location,
=======
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
>>>>>>> 1f7eb3bb65dbd9dd4386327b8a6aae07a29ebf9b
  };
}

module.exports = {
<<<<<<< HEAD
  parseFoodInput,
  enforceFoodSafetyDeadline,
  buildTonightIso,
=======
  parseFoodInput
>>>>>>> 1f7eb3bb65dbd9dd4386327b8a6aae07a29ebf9b
};
