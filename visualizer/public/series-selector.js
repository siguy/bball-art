/**
 * Global Series Selector
 *
 * Provides a shared series selection component across all pages.
 * Stores the selected series in localStorage for persistence.
 */

const SERIES_STORAGE_KEY = 'selectedSeries';
const DEFAULT_SERIES = 'court-covenant';

// Series configurations
const SERIES_CONFIG = {
  'court-covenant': {
    name: 'Court & Covenant',
    shortName: 'C&C',
    logo: '/brand/logos/court and covenant logo - 1.png',
    color: '#d4af37' // gold
  },
  'torah-titans': {
    name: 'Torah Titans',
    shortName: 'TT',
    logo: '/brand/logos/court and covenant logo - 1.png', // TODO: Create Torah Titans logo
    color: '#4a7c59' // ancient green
  }
};

/**
 * Get the currently selected series
 */
function getSelectedSeries() {
  return localStorage.getItem(SERIES_STORAGE_KEY) || DEFAULT_SERIES;
}

/**
 * Set the selected series
 */
function setSelectedSeries(seriesId) {
  localStorage.setItem(SERIES_STORAGE_KEY, seriesId);
  // Dispatch event for other components to react
  window.dispatchEvent(new CustomEvent('seriesChanged', { detail: { series: seriesId } }));
}

/**
 * Get series configuration
 */
function getSeriesConfig(seriesId) {
  return SERIES_CONFIG[seriesId] || SERIES_CONFIG[DEFAULT_SERIES];
}

/**
 * Initialize the series selector in the header
 * Call this from each page's init function
 */
function initSeriesSelector() {
  const headerContent = document.querySelector('.header-content');
  if (!headerContent) return;

  const currentSeries = getSelectedSeries();
  const config = getSeriesConfig(currentSeries);

  // Create series selector dropdown
  const selectorHtml = `
    <div class="series-selector">
      <select id="global-series-select" class="series-select">
        <option value="court-covenant" ${currentSeries === 'court-covenant' ? 'selected' : ''}>Court & Covenant</option>
        <option value="torah-titans" ${currentSeries === 'torah-titans' ? 'selected' : ''}>Torah Titans</option>
      </select>
    </div>
  `;

  // Insert after logo
  const logo = headerContent.querySelector('.logo');
  if (logo) {
    logo.insertAdjacentHTML('afterend', selectorHtml);
  } else {
    headerContent.insertAdjacentHTML('afterbegin', selectorHtml);
  }

  // Add event listener
  const select = document.getElementById('global-series-select');
  if (select) {
    select.addEventListener('change', (e) => {
      setSelectedSeries(e.target.value);
      // Reload page to refresh data
      window.location.reload();
    });
  }

  // Update page title/header based on series
  updatePageTitle(config);
}

/**
 * Update page title based on selected series
 */
function updatePageTitle(config) {
  const h1 = document.querySelector('header h1');
  if (h1) {
    // Keep the page-specific title but prepend series name if not Court & Covenant
    const currentText = h1.textContent;
    if (config.name !== 'Court & Covenant') {
      document.title = document.title.replace('Court & Covenant', config.name);
    }
  }
}

/**
 * Get API URL with series filter
 */
function getApiUrl(endpoint, additionalParams = {}) {
  const series = getSelectedSeries();
  const params = new URLSearchParams({ series, ...additionalParams });
  return `${endpoint}?${params.toString()}`;
}

/**
 * Fetch data filtered by selected series
 */
async function fetchWithSeries(endpoint) {
  const series = getSelectedSeries();
  const url = endpoint.includes('?')
    ? `${endpoint}&series=${series}`
    : `${endpoint}?series=${series}`;
  return fetch(url);
}

// Export for use in other scripts
window.SeriesSelector = {
  getSelectedSeries,
  setSelectedSeries,
  getSeriesConfig,
  initSeriesSelector,
  getApiUrl,
  fetchWithSeries,
  SERIES_CONFIG
};
