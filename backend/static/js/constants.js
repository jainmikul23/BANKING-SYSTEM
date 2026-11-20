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
  const BACKEND_BASE_URL = "https://banking-system-1-0ae4.onrender.com";

  const isSameOrigin = (typeof window !== 'undefined' && window.location && window.location.origin)
    ? (window.location.origin.includes('onrender.com') ||
       window.location.origin.includes('vercel.app') ||
       window.location.hostname === 'localhost' ||
       window.location.hostname === '127.0.0.1')
    : false;

  const API_BASE_URL = isSameOrigin ? '' : BACKEND_BASE_URL;

  // Assign to global window / globalThis scope
  global.CARD_NAME = CARD_NAME;
  global.CARD_NAME_UPPER = CARD_NAME_UPPER;
  global.BANK_NAME = BANK_NAME;
  global.BANK_SHORT_NAME = BANK_SHORT_NAME;
  global.BANK_MONOGRAM = BANK_MONOGRAM;
  global.BACKEND_BASE_URL = BACKEND_BASE_URL;
  global.API_BASE_URL = API_BASE_URL;

  // Optional CommonJS export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CARD_NAME, CARD_NAME_UPPER, BANK_NAME, BANK_SHORT_NAME, BANK_MONOGRAM, BACKEND_BASE_URL };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
