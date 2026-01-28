/**
 * Sefaria REST API Client
 * Fetches real biblical text data (Hebrew + English) for character research.
 * Falls back gracefully if Sefaria is unavailable.
 */

const SEFARIA_BASE = 'https://www.sefaria.org/api';
const FETCH_TIMEOUT = 10000; // 10s timeout

/**
 * Fetch with timeout wrapper
 * @param {string} url
 * @param {object} [options] - Additional fetch options (method, headers, body)
 */
async function sefariaFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(url, { signal: controller.signal, ...options });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn(`Sefaria fetch failed for ${url}:`, e.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Try to resolve a figure name to a Sefaria topic slug.
 * Sefaria topics use lowercase slugs, sometimes with special formatting.
 */
function nameToSlug(name) {
  // Common Sefaria topic slug mappings for figures that don't match simple lowercase
  const slugMap = {
    'king david': 'david',
    'king solomon': 'solomon',
    'judah maccabee': 'judah-the-maccabee',
    'judah the maccabee': 'judah-the-maccabee',
    'pharaoh': 'pharaoh',
    'goliath': 'goliath',
    'esau': 'esau',
    'haman': 'haman',
    'joab': 'joab',
    'jacob': 'jacob',
    'cain': 'cain',
  };

  const lower = name.toLowerCase().trim();
  return slugMap[lower] || lower.replace(/\s+/g, '-');
}

/**
 * Lookup a biblical figure as a Sefaria topic.
 * Returns topic data with description and text references.
 */
async function lookupTopic(figureName) {
  const slug = nameToSlug(figureName);
  const data = await sefariaFetch(`${SEFARIA_BASE}/topics/${slug}?with_links=0&with_refs=1&annotate_links=0&annotate_time_period=0`);

  if (!data || data.error) {
    // Try alternate slug formats
    const altSlug = figureName.toLowerCase().replace(/\s+/g, '%20');
    const altData = await sefariaFetch(`${SEFARIA_BASE}/topics/${altSlug}?with_links=0&with_refs=1`);
    if (altData && !altData.error) return altData;
    return null;
  }

  return data;
}

/**
 * Flatten possibly nested arrays of text into a single string.
 * Sefaria returns single verses as strings, ranges as arrays,
 * and chapter spans as nested arrays.
 */
function flattenText(text) {
  if (!text) return '';
  if (typeof text === 'string') return text;
  if (Array.isArray(text)) return text.map(flattenText).filter(Boolean).join(' ');
  return String(text);
}

/**
 * Fetch a specific text passage with Hebrew and English.
 * @param {string} ref - Sefaria text reference (e.g., "Genesis 1:1", "Exodus 14:21")
 * @returns {Promise<{ref: string, hebrew: string, english: string}|null>}
 */
async function getText(ref) {
  // URL-encode the reference
  const encoded = encodeURIComponent(ref);
  // Request primary (Hebrew) + English versions explicitly,
  // since no English version is marked as primary in Sefaria
  const data = await sefariaFetch(`${SEFARIA_BASE}/v3/texts/${encoded}?version=primary&version=english`);

  if (!data || !data.versions) return null;

  // Extract Hebrew and English text
  let hebrew = '';
  let english = '';

  for (const version of data.versions) {
    if (version.language === 'he' && version.text) {
      hebrew = flattenText(version.text);
    }
    if (version.language === 'en' && version.text) {
      english = flattenText(version.text);
    }
  }

  // Strip HTML tags from text
  hebrew = hebrew.replace(/<[^>]+>/g, '').trim();
  english = english.replace(/<[^>]+>/g, '').trim();

  if (!hebrew && !english) return null;

  return {
    ref: data.ref || ref,
    hebrew,
    english
  };
}

/**
 * Search Sefaria for passages mentioning a figure.
 * Uses the POST-based Elasticsearch proxy endpoint.
 * Returns up to `limit` results.
 */
async function searchTexts(query, limit = 8) {
  const data = await sefariaFetch(`${SEFARIA_BASE}/search/text/_search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      size: limit,
      query: {
        match: {
          naive_lemmatizer: query
        }
      },
      highlight: {
        fields: {
          naive_lemmatizer: { pre_tags: [''], post_tags: [''] }
        }
      }
    })
  });

  if (!data || !data.hits?.hits) return [];

  return data.hits.hits.map(hit => ({
    ref: hit._source?.ref || '',
    text: (hit._source?.exact || hit._source?.naive_lemmatizer || '').replace(/<[^>]+>/g, '').trim(),
    heRef: hit._source?.heRef || ''
  })).filter(r => r.ref);
}

/**
 * Research a biblical figure using Sefaria.
 * Returns structured data with real Hebrew quotes and context.
 *
 * @param {string} figureName - Name of the biblical figure
 * @returns {Promise<{found: boolean, description?: string, quotes: Array, refs: Array}>}
 */
export async function researchBiblicalFigure(figureName) {
  console.log(`[Sefaria] Researching figure: ${figureName}`);

  const result = {
    found: false,
    description: '',
    quotes: [],
    refs: []
  };

  // Step 1: Try topic lookup
  const topic = await lookupTopic(figureName);

  if (topic) {
    result.found = true;
    console.log(`[Sefaria] Found topic: ${topic.slug || figureName}`);

    // Get description
    if (topic.description?.en) {
      result.description = topic.description.en;
    }

    // Get text references from topic
    // Sefaria returns refs as a flat list: [{ref: "Genesis 25:20", is_sheet: false}, ...]
    const rawRefs = Array.isArray(topic.refs) ? topic.refs : (topic.refs?.about?.source || topic.refs?.about || []);
    const allRefs = (Array.isArray(rawRefs) ? rawRefs : [])
      .filter(r => !r.is_sheet)
      .map(r => typeof r === 'string' ? r : r.ref)
      .filter(Boolean);

    // Prioritize Tanakh (Bible) refs over commentaries
    const tanakhBooks = /^(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|I Samuel|II Samuel|I Kings|II Kings|Isaiah|Jeremiah|Ezekiel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Psalms|Proverbs|Job|Song of Songs|Ruth|Lamentations|Ecclesiastes|Esther|Daniel|Ezra|Nehemiah|I Chronicles|II Chronicles)\b/;
    const tanakhRefs = allRefs.filter(r => tanakhBooks.test(r));
    const otherRefs = allRefs.filter(r => !tanakhBooks.test(r));
    const refList = [...tanakhRefs, ...otherRefs];

    // Fetch actual text for up to 8 refs (Tanakh first)
    const refsToFetch = refList.slice(0, 8);
    console.log(`[Sefaria] Fetching ${refsToFetch.length} text references...`);

    for (const ref of refsToFetch) {
      const text = await getText(ref);
      if (text && (text.hebrew || text.english)) {
        result.quotes.push({
          source: text.ref,
          hebrew: text.hebrew,
          english: text.english
        });
      }
    }

    result.refs = refList;
  }

  // Step 2: If topic didn't yield enough quotes, try text search
  if (result.quotes.length < 4) {
    console.log(`[Sefaria] Supplementing with text search (have ${result.quotes.length} quotes)...`);
    const searchResults = await searchTexts(figureName, 6);
    const existingRefs = new Set(result.quotes.map(q => q.source));

    for (const sr of searchResults) {
      if (existingRefs.has(sr.ref)) continue;

      const text = await getText(sr.ref);
      if (text && (text.hebrew || text.english)) {
        result.quotes.push({
          source: text.ref,
          hebrew: text.hebrew,
          english: text.english
        });
        existingRefs.add(sr.ref);
      }

      if (result.quotes.length >= 8) break;
    }
  }

  // Step 3: Search for physical description passages
  result.physicalDescriptions = [];
  try {
    const descSearches = [
      `${figureName} beautiful`,
      `${figureName} appearance`,
      `${figureName} stature`
    ];
    const descRefs = new Set(result.quotes.map(q => q.source));

    for (const query of descSearches) {
      const searchResults = await searchTexts(query, 3);
      for (const sr of searchResults) {
        if (descRefs.has(sr.ref)) continue;
        const text = await getText(sr.ref);
        if (text && (text.hebrew || text.english)) {
          result.physicalDescriptions.push({
            source: text.ref,
            hebrew: text.hebrew,
            english: text.english
          });
          descRefs.add(sr.ref);
        }
        if (result.physicalDescriptions.length >= 4) break;
      }
      if (result.physicalDescriptions.length >= 4) break;
    }
    console.log(`[Sefaria] Found ${result.physicalDescriptions.length} physical description passages`);
  } catch (e) {
    console.warn('[Sefaria] Physical description search failed:', e.message);
  }

  console.log(`[Sefaria] Research complete: ${result.quotes.length} quotes, ${result.physicalDescriptions.length} desc passages`);
  return result;
}

export default {
  researchBiblicalFigure,
  lookupTopic,
  getText,
  searchTexts
};
