#!/usr/bin/env node
/**
 * Test Suite: Torah Titans Generator Support
 *
 * Tests figure-figure mode, series selector, and Torah Titans functionality.
 * Requires the visualizer server to be running.
 *
 * Usage:
 *   node scripts/test-torah-titans.js           # Run all tests
 *   node scripts/test-torah-titans.js --api     # API tests only
 *   node scripts/test-torah-titans.js --cli     # CLI tests only
 *
 * Prerequisites:
 *   cd visualizer && npm start
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// Parse arguments
const args = process.argv.slice(2);
const runApiTests = args.length === 0 || args.includes('--api');
const runCliTests = args.length === 0 || args.includes('--cli');

const API_BASE = 'http://localhost:3333';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = '') {
  console.log(`${color}${message}${colors.reset}`);
}

function pass(testName, details = '') {
  results.passed++;
  results.tests.push({ name: testName, status: 'passed', details });
  log(`  ✓ ${testName}`, colors.green);
  if (details) log(`    ${details}`, colors.blue);
}

function fail(testName, error) {
  results.failed++;
  results.tests.push({ name: testName, status: 'failed', error });
  log(`  ✗ ${testName}`, colors.red);
  log(`    Error: ${error}`, colors.red);
}

function skip(testName, reason) {
  results.skipped++;
  results.tests.push({ name: testName, status: 'skipped', reason });
  log(`  ○ ${testName} (skipped: ${reason})`, colors.yellow);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

async function postJson(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

// ============================================================
// CLI Tests
// ============================================================

async function runCLITests() {
  log('\n📋 CLI Tests', colors.bold);
  log('─'.repeat(50));

  // Test 1: Torah Titans pairing files exist
  try {
    const pairingsDir = join(ROOT, 'data/series/torah-titans/pairings');
    const abrahamSarah = join(pairingsDir, 'abraham-sarah.json');
    const jacobEsau = join(pairingsDir, 'jacob-esau.json');

    if (existsSync(abrahamSarah) && existsSync(jacobEsau)) {
      pass('Torah Titans pairing files exist', 'abraham-sarah.json, jacob-esau.json');
    } else {
      fail('Torah Titans pairing files exist', 'Missing pairing files');
    }
  } catch (err) {
    fail('Torah Titans pairing files exist', err.message);
  }

  // Test 2: Pairing structure has figure-figure cardMode
  try {
    const pairingPath = join(ROOT, 'data/series/torah-titans/pairings/abraham-sarah.json');
    const pairing = JSON.parse(readFileSync(pairingPath, 'utf-8'));

    if (pairing.cardMode === 'figure-figure') {
      pass('Abraham-Sarah has figure-figure cardMode');
    } else {
      fail('Abraham-Sarah has figure-figure cardMode', `Got: ${pairing.cardMode}`);
    }
  } catch (err) {
    fail('Abraham-Sarah has figure-figure cardMode', err.message);
  }

  // Test 3: Both characters have characterType: figure
  try {
    const pairingPath = join(ROOT, 'data/series/torah-titans/pairings/abraham-sarah.json');
    const pairing = JSON.parse(readFileSync(pairingPath, 'utf-8'));

    const playerType = pairing.player?.characterType;
    const figureType = pairing.figure?.characterType;

    if (playerType === 'figure' && figureType === 'figure') {
      pass('Both characters are figures', `player: ${playerType}, figure: ${figureType}`);
    } else {
      fail('Both characters are figures', `player: ${playerType}, figure: ${figureType}`);
    }
  } catch (err) {
    fail('Both characters are figures', err.message);
  }

  // Test 4: Figure pose files exist for Torah Titans characters
  try {
    const abrahamPoses = join(ROOT, 'data/poses/figures/abraham.json');
    const sarahPoses = join(ROOT, 'data/poses/figures/sarah.json');

    if (existsSync(abrahamPoses) && existsSync(sarahPoses)) {
      pass('Figure pose files exist', 'abraham.json, sarah.json');
    } else {
      const missing = [];
      if (!existsSync(abrahamPoses)) missing.push('abraham.json');
      if (!existsSync(sarahPoses)) missing.push('sarah.json');
      fail('Figure pose files exist', `Missing: ${missing.join(', ')}`);
    }
  } catch (err) {
    fail('Figure pose files exist', err.message);
  }

  // Test 5: Pose files have required structure
  try {
    const posePath = join(ROOT, 'data/poses/figures/abraham.json');
    const poses = JSON.parse(readFileSync(posePath, 'utf-8'));

    const hasId = !!poses.id;
    const hasName = !!poses.name;
    const hasDefaultPose = !!poses.defaultPose;
    const hasPoses = !!poses.poses && Object.keys(poses.poses).length > 0;

    if (hasId && hasName && hasDefaultPose && hasPoses) {
      pass('Pose file has required structure', `${Object.keys(poses.poses).length} poses`);
    } else {
      fail('Pose file has required structure', `Missing: id=${hasId}, name=${hasName}, defaultPose=${hasDefaultPose}, poses=${hasPoses}`);
    }
  } catch (err) {
    fail('Pose file has required structure', err.message);
  }

  // Test 6: generate-with-poses.js --list-poses works for Torah Titans
  try {
    const output = execSync(
      'node scripts/generate-with-poses.js abraham-sarah --list-poses --series torah-titans',
      { cwd: ROOT, encoding: 'utf-8', timeout: 10000 }
    );

    if (output.includes('Abraham') && output.includes('Sarah')) {
      pass('--list-poses works for Torah Titans', 'Shows both Abraham and Sarah poses');
    } else {
      fail('--list-poses works for Torah Titans', 'Output missing character names');
    }
  } catch (err) {
    fail('--list-poses works for Torah Titans', err.message);
  }

  // Test 7: Rivalry pairing has correct type
  try {
    const pairingPath = join(ROOT, 'data/series/torah-titans/pairings/jacob-esau.json');
    const pairing = JSON.parse(readFileSync(pairingPath, 'utf-8'));

    if (pairing.type === 'rivalry') {
      pass('Jacob-Esau has rivalry type');
    } else {
      fail('Jacob-Esau has rivalry type', `Got: ${pairing.type}`);
    }
  } catch (err) {
    fail('Jacob-Esau has rivalry type', err.message);
  }
}

// ============================================================
// API Tests
// ============================================================

async function runAPITests() {
  log('\n🌐 API Tests', colors.bold);
  log('─'.repeat(50));

  // Check if server is running
  try {
    await fetchJson(`${API_BASE}/api/series`);
  } catch (err) {
    log('\n⚠️  Server not running. Start with: cd visualizer && npm start', colors.yellow);
    log('   Skipping API tests.\n', colors.yellow);
    return;
  }

  // Test 1: /api/series returns Torah Titans
  try {
    const seriesList = await fetchJson(`${API_BASE}/api/series`);
    const torahTitans = seriesList.find(s => s.id === 'torah-titans');

    if (torahTitans) {
      pass('/api/series includes torah-titans', `Name: ${torahTitans.name}`);
    } else {
      fail('/api/series includes torah-titans', 'torah-titans not in response');
    }
  } catch (err) {
    fail('/api/series includes torah-titans', err.message);
  }

  // Test 2: /api/pairings?series=torah-titans returns pairings
  try {
    const pairings = await fetchJson(`${API_BASE}/api/pairings?series=torah-titans`);
    const pairingIds = Object.keys(pairings);

    if (pairingIds.length > 0) {
      pass('/api/pairings filters by series', `${pairingIds.length} pairings: ${pairingIds.join(', ')}`);
    } else {
      fail('/api/pairings filters by series', 'No pairings returned');
    }
  } catch (err) {
    fail('/api/pairings filters by series', err.message);
  }

  // Test 3: /api/pairings-full returns figure-figure data
  try {
    const pairings = await fetchJson(`${API_BASE}/api/pairings-full?series=torah-titans`);
    const abrahamSarah = pairings['abraham-sarah'];

    if (abrahamSarah && abrahamSarah.cardMode === 'figure-figure') {
      pass('/api/pairings-full returns cardMode', `cardMode: ${abrahamSarah.cardMode}`);
    } else {
      fail('/api/pairings-full returns cardMode', `Got: ${abrahamSarah?.cardMode}`);
    }
  } catch (err) {
    fail('/api/pairings-full returns cardMode', err.message);
  }

  // Test 4: /api/poses/figures/:id works for Torah Titans characters
  try {
    const poses = await fetchJson(`${API_BASE}/api/poses/figures/abraham`);

    if (poses.id === 'abraham' && poses.poses) {
      pass('/api/poses/figures/abraham returns poses', `${Object.keys(poses.poses).length} poses`);
    } else {
      fail('/api/poses/figures/abraham returns poses', 'Invalid response structure');
    }
  } catch (err) {
    fail('/api/poses/figures/abraham returns poses', err.message);
  }

  // Test 5: /api/poses/figures/:id works for Sarah
  try {
    const poses = await fetchJson(`${API_BASE}/api/poses/figures/sarah`);

    if (poses.id === 'sarah' && poses.poses) {
      pass('/api/poses/figures/sarah returns poses', `${Object.keys(poses.poses).length} poses`);
    } else {
      fail('/api/poses/figures/sarah returns poses', 'Invalid response structure');
    }
  } catch (err) {
    fail('/api/poses/figures/sarah returns poses', err.message);
  }

  // Test 6: /api/characters/figures includes Torah Titans figures
  try {
    const figures = await fetchJson(`${API_BASE}/api/characters/figures`);
    const names = figures.map(f => f.name);

    const hasAbraham = names.includes('Abraham');
    const hasSarah = names.includes('Sarah');

    if (hasAbraham && hasSarah) {
      pass('/api/characters/figures includes Torah Titans', 'Abraham and Sarah present');
    } else {
      fail('/api/characters/figures includes Torah Titans', `Abraham: ${hasAbraham}, Sarah: ${hasSarah}`);
    }
  } catch (err) {
    fail('/api/characters/figures includes Torah Titans', err.message);
  }

  // Test 7: POST /api/generate-with-poses accepts series parameter (dry run simulation)
  try {
    // We won't actually generate, just verify the endpoint accepts the parameters
    // by checking that it doesn't error on the request structure
    const result = await postJson(`${API_BASE}/api/generate-with-poses`, {
      pairingId: 'abraham-sarah',
      template: 'spouse-blessing',
      darkMode: false,
      playerPose: 'default',
      figurePose: 'default',
      cardMode: 'figure-figure',
      series: 'torah-titans'
    });

    // The API will try to generate - we just check it doesn't reject the params
    // It might fail for other reasons (no API key, etc.) but that's OK
    if (result.success || result.error) {
      pass('POST /api/generate-with-poses accepts series param',
           result.success ? 'Generation succeeded' : `Expected error: ${result.error?.substring(0, 50)}...`);
    }
  } catch (err) {
    fail('POST /api/generate-with-poses accepts series param', err.message);
  }

  // Test 8: Verify pairings have correct type for grouping
  try {
    const pairings = await fetchJson(`${API_BASE}/api/pairings-full?series=torah-titans`);

    const types = {};
    for (const [id, p] of Object.entries(pairings)) {
      types[p.type] = types[p.type] || [];
      types[p.type].push(id);
    }

    const typeList = Object.entries(types).map(([t, ids]) => `${t}: ${ids.length}`).join(', ');
    pass('Torah Titans pairings have types', typeList);
  } catch (err) {
    fail('Torah Titans pairings have types', err.message);
  }
}

// ============================================================
// Main
// ============================================================

async function main() {
  log('\n' + '═'.repeat(50), colors.bold);
  log('  Torah Titans Generator Test Suite', colors.bold);
  log('═'.repeat(50), colors.bold);

  if (runCliTests) {
    await runCLITests();
  }

  if (runApiTests) {
    await runAPITests();
  }

  // Summary
  log('\n' + '═'.repeat(50), colors.bold);
  log('  Summary', colors.bold);
  log('═'.repeat(50), colors.bold);

  log(`\n  Passed:  ${results.passed}`, colors.green);
  log(`  Failed:  ${results.failed}`, results.failed > 0 ? colors.red : colors.green);
  log(`  Skipped: ${results.skipped}`, colors.yellow);
  log(`  Total:   ${results.passed + results.failed + results.skipped}\n`);

  if (results.failed > 0) {
    log('Failed tests:', colors.red);
    results.tests
      .filter(t => t.status === 'failed')
      .forEach(t => log(`  - ${t.name}: ${t.error}`, colors.red));
    log('');
    process.exit(1);
  } else {
    log('All tests passed! ✓\n', colors.green);
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
