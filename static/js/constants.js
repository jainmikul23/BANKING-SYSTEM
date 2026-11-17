/**
 * Atheria Reserve Bank - Central JavaScript Constants
 * Reusable single source of truth for branding, card names, and endpoints.
 */

export const CARD_NAME = "Atheria Reserve";
export const CARD_NAME_UPPER = "ATHERIA RESERVE";
export const BANK_NAME = "Atheria Reserve Bank";
export const BANK_SHORT_NAME = "Atheria Reserve";
export const BANK_MONOGRAM = "ARB";

if (typeof window !== 'undefined') {
  window.CARD_NAME = CARD_NAME;
  window.CARD_NAME_UPPER = CARD_NAME_UPPER;
  window.BANK_NAME = BANK_NAME;
  window.BANK_SHORT_NAME = BANK_SHORT_NAME;
  window.BANK_MONOGRAM = BANK_MONOGRAM;
}
