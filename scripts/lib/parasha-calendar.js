/**
 * Parasha Calendar - Sefaria API Integration
 *
 * Fetches current/upcoming parasha from Sefaria's calendar API.
 * Used to auto-select which deck to generate.
 */

const SEFARIA_CALENDAR_URL = 'https://www.sefaria.org/api/calendars';

/**
 * Normalize parasha name to ID format
 * @param {string} name - Parasha name (e.g., "Yitro", "Lech Lecha")
 * @returns {string} Normalized ID (e.g., "yitro", "lech-lecha")
 */
function normalizeParashaId(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, '')           // Remove apostrophes
    .replace(/\s+/g, '-')           // Spaces to hyphens
    .replace(/[^a-z0-9-]/g, '');    // Remove other special chars
}

/**
 * Fetch current parasha from Sefaria Calendar API
 * @returns {Promise<object|null>} Parasha info or null on error
 */
export async function getCurrentParasha() {
  try {
    const response = await fetch(SEFARIA_CALENDAR_URL);

    if (!response.ok) {
      throw new Error(`Sefaria API returned ${response.status}`);
    }

    const data = await response.json();

    // Find the Parashat Hashavua entry
    const parashaEntry = data.calendar_items?.find(
      item => item.title?.en === 'Parashat Hashavua'
    );

    if (!parashaEntry) {
      console.warn('Parashat Hashavua not found in calendar');
      return null;
    }

    // Extract the display value (parasha name)
    const nameEn = parashaEntry.displayValue?.en || '';
    const nameHe = parashaEntry.displayValue?.he || '';

    // Handle double parashiyot (e.g., "Nitzavim-Vayelech")
    const isDouble = nameEn.includes('-') && !nameEn.includes('Lech');

    return {
      id: normalizeParashaId(nameEn),
      name: nameEn,
      nameHebrew: nameHe,
      ref: parashaEntry.ref,
      heRef: parashaEntry.heRef,
      url: parashaEntry.url,
      date: data.date,
      isDouble,
      raw: parashaEntry
    };

  } catch (error) {
    console.error('Error fetching parasha from Sefaria:', error.message);
    return null;
  }
}

/**
 * Get parasha info by name (validates against Sefaria)
 * @param {string} parashaName - Parasha name or ID
 * @returns {Promise<object|null>} Parasha info or null
 */
export async function getParashaInfo(parashaName) {
  // First try to get from Sefaria
  const current = await getCurrentParasha();

  if (current && normalizeParashaId(current.name) === normalizeParashaId(parashaName)) {
    return current;
  }

  // Return a minimal object for offline/test use
  return {
    id: normalizeParashaId(parashaName),
    name: parashaName,
    nameHebrew: null,
    ref: null,
    isFromSefaria: false
  };
}

/**
 * List of all 54 parashiyot in order
 */
export const PARASHIYOT = [
  // Bereshit (Genesis)
  { id: 'bereshit', book: 'Genesis', order: 1 },
  { id: 'noach', book: 'Genesis', order: 2 },
  { id: 'lech-lecha', book: 'Genesis', order: 3 },
  { id: 'vayera', book: 'Genesis', order: 4 },
  { id: 'chayei-sarah', book: 'Genesis', order: 5 },
  { id: 'toldot', book: 'Genesis', order: 6 },
  { id: 'vayetzei', book: 'Genesis', order: 7 },
  { id: 'vayishlach', book: 'Genesis', order: 8 },
  { id: 'vayeshev', book: 'Genesis', order: 9 },
  { id: 'miketz', book: 'Genesis', order: 10 },
  { id: 'vayigash', book: 'Genesis', order: 11 },
  { id: 'vayechi', book: 'Genesis', order: 12 },

  // Shemot (Exodus)
  { id: 'shemot', book: 'Exodus', order: 13 },
  { id: 'vaera', book: 'Exodus', order: 14 },
  { id: 'bo', book: 'Exodus', order: 15 },
  { id: 'beshalach', book: 'Exodus', order: 16 },
  { id: 'yitro', book: 'Exodus', order: 17 },
  { id: 'mishpatim', book: 'Exodus', order: 18 },
  { id: 'terumah', book: 'Exodus', order: 19 },
  { id: 'tetzaveh', book: 'Exodus', order: 20 },
  { id: 'ki-tisa', book: 'Exodus', order: 21 },
  { id: 'vayakhel', book: 'Exodus', order: 22 },
  { id: 'pekudei', book: 'Exodus', order: 23 },

  // Vayikra (Leviticus)
  { id: 'vayikra', book: 'Leviticus', order: 24 },
  { id: 'tzav', book: 'Leviticus', order: 25 },
  { id: 'shemini', book: 'Leviticus', order: 26 },
  { id: 'tazria', book: 'Leviticus', order: 27 },
  { id: 'metzora', book: 'Leviticus', order: 28 },
  { id: 'acharei-mot', book: 'Leviticus', order: 29 },
  { id: 'kedoshim', book: 'Leviticus', order: 30 },
  { id: 'emor', book: 'Leviticus', order: 31 },
  { id: 'behar', book: 'Leviticus', order: 32 },
  { id: 'bechukotai', book: 'Leviticus', order: 33 },

  // Bamidbar (Numbers)
  { id: 'bamidbar', book: 'Numbers', order: 34 },
  { id: 'naso', book: 'Numbers', order: 35 },
  { id: 'behaalotcha', book: 'Numbers', order: 36 },
  { id: 'shelach', book: 'Numbers', order: 37 },
  { id: 'korach', book: 'Numbers', order: 38 },
  { id: 'chukat', book: 'Numbers', order: 39 },
  { id: 'balak', book: 'Numbers', order: 40 },
  { id: 'pinchas', book: 'Numbers', order: 41 },
  { id: 'matot', book: 'Numbers', order: 42 },
  { id: 'masei', book: 'Numbers', order: 43 },

  // Devarim (Deuteronomy)
  { id: 'devarim', book: 'Deuteronomy', order: 44 },
  { id: 'vaetchanan', book: 'Deuteronomy', order: 45 },
  { id: 'eikev', book: 'Deuteronomy', order: 46 },
  { id: 'reeh', book: 'Deuteronomy', order: 47 },
  { id: 'shoftim', book: 'Deuteronomy', order: 48 },
  { id: 'ki-teitzei', book: 'Deuteronomy', order: 49 },
  { id: 'ki-tavo', book: 'Deuteronomy', order: 50 },
  { id: 'nitzavim', book: 'Deuteronomy', order: 51 },
  { id: 'vayelech', book: 'Deuteronomy', order: 52 },
  { id: 'haazinu', book: 'Deuteronomy', order: 53 },
  { id: 'vezot-haberachah', book: 'Deuteronomy', order: 54 }
];

/**
 * Get parasha metadata by ID
 * @param {string} parashaId - Parasha ID
 * @returns {object|null} Parasha metadata
 */
export function getParashaMetadata(parashaId) {
  const normalized = parashaId.toLowerCase().replace(/\s+/g, '-');
  return PARASHIYOT.find(p => p.id === normalized) || null;
}

export default {
  getCurrentParasha,
  getParashaInfo,
  getParashaMetadata,
  PARASHIYOT
};
