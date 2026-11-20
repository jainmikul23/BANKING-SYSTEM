/**
 * Atheria Reserve Bank - Central JavaScript Constants
 * Reusable single source of truth for branding, card names, and endpoints.
 * Compatible with standard script tags and ES/CommonJS modules.
 */

(function (global) {
  const CARD_NAME = "Atheria Reserve";
  const CARD_NAME_UPPER = "ATHERIA RESERVE";
  const BANK_NAME = "Atheria Reserve Bank";
  const BANK_SHORT_NAME = "Atheria Reserve";
  const BANK_MONOGRAM = "ARB";

  // Assign to global window / globalThis scope
  global.CARD_NAME = CARD_NAME;
  global.CARD_NAME_UPPER = CARD_NAME_UPPER;
  global.BANK_NAME = BANK_NAME;
  global.BANK_SHORT_NAME = BANK_SHORT_NAME;
  global.BANK_MONOGRAM = BANK_MONOGRAM;

  // Optional CommonJS export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CARD_NAME, CARD_NAME_UPPER, BANK_NAME, BANK_SHORT_NAME, BANK_MONOGRAM };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
