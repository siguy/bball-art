/**
 * Filename Builder
 *
 * Creates descriptive filenames for generated cards with series, pairing,
 * template, pose, and timestamp information.
 *
 * New format: {series}_{pairing}_{template}_{playerPose}_{figurePose}_{timestamp}.jpeg
 * Example: cc_jordan-moses_tl_tongue-dunk_part-sea_20260127T024755.jpeg
 *
 * Solo format: {series}_{solo-type-id}_{template}_{pose}_{timestamp}.jpeg
 * Example: cc_solo-player-jordan_tl_tongue-dunk_20260127T024755.jpeg
 */

// Series abbreviations
const SERIES_ABBREV = {
  'court-covenant': 'cc',
  'torah-titans': 'tt',
  'scripture-titans': 'st',
  'founding-fathers': 'ff'
};

// Template abbreviations
const TEMPLATE_ABBREV = {
  'thunder-lightning': 'tl',
  'thunder-lightning-dark': 'tld',
  'thunder-lightning-rivalry': 'tlr',
  'beam-team': 'bt',
  'beam-team-shadow': 'bts',
  'beam-team-rivalry': 'btr',
  'beam-team-a': 'bta',
  'beam-team-b': 'btb',
  'beam-team-c': 'btc',
  'beam-team-c-dunk': 'btcd',
  'metal-universe': 'mu',
  'metal-universe-dark': 'mud',
  'metal-universe-dark-alt': 'muda',
  'metal-universe-dark-alt-realistic': 'mudar',
  'metal-universe-rivalry': 'mur',
  'downtown': 'dt',
  'kaboom': 'kb',
  'prizm-silver': 'ps',
  // Torah Titans specific templates
  'spouse-blessing': 'sb',
  'trial-card': 'tc',
  'plague-card': 'pc',
  'three-way': 'tw'
};

/**
 * Abbreviate a pose ID for filename
 * Takes first 4 chars of each word, max 12 chars total
 * e.g., "tongue-out-dunk" -> "tong-out-dunk" -> "tong-out-dun"
 */
export function abbreviatePose(poseId) {
  if (!poseId || poseId === 'default') return 'def';

  const parts = poseId.split('-');
  const abbreviated = parts.map(p => p.slice(0, 4)).join('-');

  // Truncate to max 12 chars
  return abbreviated.slice(0, 12);
}

/**
 * Get series abbreviation
 */
export function getSeriesAbbrev(series) {
  return SERIES_ABBREV[series] || series.slice(0, 2);
}

/**
 * Get template abbreviation
 */
export function getTemplateAbbrev(template) {
  return TEMPLATE_ABBREV[template] || template.replace(/-/g, '').slice(0, 4);
}

/**
 * Generate timestamp in compact format
 * Format: YYYYMMDDTHHMMSS
 */
export function getCompactTimestamp() {
  const now = new Date();
  return now.toISOString()
    .replace(/-/g, '')
    .replace(/:/g, '')
    .replace(/\.\d{3}Z$/, '')
    .slice(0, 15); // YYYYMMDDTHHMMSS
}

/**
 * Build filename for a pairing card
 *
 * @param {Object} options
 * @param {string} options.series - Series ID (e.g., 'court-covenant')
 * @param {string} options.pairingId - Pairing ID (e.g., 'jordan-moses')
 * @param {string} options.template - Template name (e.g., 'thunder-lightning')
 * @param {string} options.playerPose - Player pose ID (e.g., 'tongue-out-dunk')
 * @param {string} options.figurePose - Figure pose ID (e.g., 'parting-sea')
 * @param {string} [options.timestamp] - Optional timestamp (defaults to now)
 * @param {string} [options.extension] - File extension (defaults to 'jpeg')
 * @returns {string} Formatted filename
 */
export function buildPairingFilename({
  series,
  pairingId,
  template,
  playerPose,
  figurePose,
  timestamp,
  extension = 'jpeg'
}) {
  const seriesAbbr = getSeriesAbbrev(series);
  const templateAbbr = getTemplateAbbrev(template);
  const playerPoseAbbr = abbreviatePose(playerPose);
  const figurePoseAbbr = abbreviatePose(figurePose);
  const ts = timestamp || getCompactTimestamp();

  return `${seriesAbbr}_${pairingId}_${templateAbbr}_${playerPoseAbbr}_${figurePoseAbbr}_${ts}.${extension}`;
}

/**
 * Build filename for a solo character card
 *
 * @param {Object} options
 * @param {string} options.series - Series ID
 * @param {string} options.characterType - 'player' or 'figure'
 * @param {string} options.characterId - Character ID (e.g., 'jordan')
 * @param {string} options.template - Template name
 * @param {string} options.pose - Pose ID
 * @param {string} [options.timestamp] - Optional timestamp
 * @param {string} [options.extension] - File extension
 * @returns {string} Formatted filename
 */
export function buildSoloFilename({
  series,
  characterType,
  characterId,
  template,
  pose,
  timestamp,
  extension = 'jpeg'
}) {
  const seriesAbbr = getSeriesAbbrev(series);
  const templateAbbr = getTemplateAbbrev(template);
  const poseAbbr = abbreviatePose(pose);
  const ts = timestamp || getCompactTimestamp();

  return `${seriesAbbr}_solo-${characterType}-${characterId}_${templateAbbr}_${poseAbbr}_${ts}.${extension}`;
}

/**
 * Build filename for figure-figure pairing (Torah Titans, etc.)
 *
 * @param {Object} options
 * @param {string} options.series - Series ID
 * @param {string} options.pairingId - Pairing ID (e.g., 'david-goliath')
 * @param {string} options.template - Template name
 * @param {string} options.figure1Pose - First figure pose ID
 * @param {string} options.figure2Pose - Second figure pose ID
 * @param {string} [options.timestamp] - Optional timestamp
 * @param {string} [options.extension] - File extension
 * @returns {string} Formatted filename
 */
export function buildFigureFigureFilename({
  series,
  pairingId,
  template,
  figure1Pose,
  figure2Pose,
  timestamp,
  extension = 'jpeg'
}) {
  const seriesAbbr = getSeriesAbbrev(series);
  const templateAbbr = getTemplateAbbrev(template);
  const pose1Abbr = abbreviatePose(figure1Pose);
  const pose2Abbr = abbreviatePose(figure2Pose);
  const ts = timestamp || getCompactTimestamp();

  return `${seriesAbbr}_${pairingId}_${templateAbbr}_${pose1Abbr}_${pose2Abbr}_${ts}.${extension}`;
}

/**
 * Parse a new-format filename back into its components
 *
 * @param {string} filename - Filename to parse
 * @returns {Object|null} Parsed components or null if not matching
 */
export function parseNewFilename(filename) {
  // Remove extension
  const base = filename.replace(/\.(jpeg|jpg|png)$/, '');

  // Try pairing format: {series}_{pairing}_{template}_{pose1}_{pose2}_{timestamp}
  const pairingMatch = base.match(/^([a-z]{2})_([a-z0-9-]+)_([a-z]+)_([a-z0-9-]+)_([a-z0-9-]+)_(\d{8}T\d{6})$/);
  if (pairingMatch) {
    const [, seriesAbbr, pairingId, templateAbbr, pose1, pose2, timestamp] = pairingMatch;
    return {
      format: 'new',
      mode: pairingId.startsWith('solo-') ? 'solo' : 'pairing',
      seriesAbbr,
      pairingId,
      templateAbbr,
      pose1,
      pose2,
      timestamp
    };
  }

  // Try solo format: {series}_{solo-type-id}_{template}_{pose}_{timestamp}
  const soloMatch = base.match(/^([a-z]{2})_(solo-(?:player|figure)-[a-z0-9-]+)_([a-z]+)_([a-z0-9-]+)_(\d{8}T\d{6})$/);
  if (soloMatch) {
    const [, seriesAbbr, soloId, templateAbbr, pose, timestamp] = soloMatch;
    return {
      format: 'new',
      mode: 'solo',
      seriesAbbr,
      pairingId: soloId,
      templateAbbr,
      pose1: pose,
      timestamp
    };
  }

  return null;
}

/**
 * Parse an old-format filename
 *
 * Old format: {template}-{timestamp}.ext
 * Example: thunder-lightning-2026-01-27T02-34-06.jpeg
 *
 * @param {string} filename
 * @returns {Object|null}
 */
export function parseOldFilename(filename) {
  const match = filename.match(/^(.+)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})\.(png|jpe?g)$/);
  if (!match) return null;

  const [, template, timestamp, ext] = match;
  return {
    format: 'old',
    template,
    timestamp,
    extension: ext
  };
}

/**
 * Convert old timestamp format to new compact format
 * Old: 2026-01-27T02-34-06
 * New: 20260127T023406
 */
export function convertTimestamp(oldTimestamp) {
  return oldTimestamp.replace(/-/g, '').replace(/T(\d{2})(\d{2})(\d{2})$/, 'T$1$2$3');
}

/**
 * Get output directory for a card based on series
 *
 * @param {string} rootDir - Project root directory
 * @param {string} series - Series ID
 * @param {string} pairingId - Pairing ID or solo-type-id
 * @param {string} [subSeries] - Optional sub-series (for Torah Titans)
 * @returns {string} Output directory path
 */
export function getOutputDir(rootDir, series, pairingId, subSeries = null) {
  const basePath = `${rootDir}/output/cards/${series}`;

  if (subSeries) {
    return `${basePath}/${subSeries}/${pairingId}`;
  }

  return `${basePath}/${pairingId}`;
}

// Export constants for use in other modules
export const SERIES_ABBREVIATIONS = SERIES_ABBREV;
export const TEMPLATE_ABBREVIATIONS = TEMPLATE_ABBREV;

export default {
  buildPairingFilename,
  buildSoloFilename,
  buildFigureFigureFilename,
  parseNewFilename,
  parseOldFilename,
  convertTimestamp,
  getOutputDir,
  getSeriesAbbrev,
  getTemplateAbbrev,
  abbreviatePose,
  SERIES_ABBREVIATIONS,
  TEMPLATE_ABBREVIATIONS
};
