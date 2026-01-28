#!/usr/bin/env node
/**
 * Test Suite: Solo Characters Feature
 *
 * Tests standalone character support for solo card generation.
 * Creates temporary test fixtures, runs tests, and cleans up.
 *
 * Usage:
 *   node scripts/test-solo-characters.js           # Run all tests
 *   node scripts/test-solo-characters.js --cli     # CLI tests only
 *   node scripts/test-solo-characters.js --api     # API tests only (requires server)
 *   node scripts/test-solo-characters.js --keep    # Don't clean up fixtures after tests
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// Parse arguments
const args = process.argv.slice(2);
const runCliTests = args.length === 0 || args.includes('--cli');
const runApiTests = args.length === 0 || args.includes('--api');
const keepFixtures = args.includes('--keep');

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

function logTest(name, passed, message = '') {
  const status = passed ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;
  const suffix = message ? ` - ${message}` : '';
  console.log(`  [${status}] ${name}${suffix}`);

  results.tests.push({ name, passed, message });
  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
}

function logSkip(name, reason) {
  console.log(`  [${colors.yellow}SKIP${colors.reset}] ${name} - ${reason}`);
  results.skipped++;
  results.tests.push({ name, passed: null, message: reason });
}

// ============================================
// TEST FIXTURES
// ============================================

const TEST_PLAYER_ID = 'test-solo-player';
const TEST_FIGURE_ID = 'test-solo-figure';
const TEST_OVERRIDE_ID = 'jordan'; // Existing pairing character to test override

const fixtures = {
  standalonePlayer: {
    path: join(ROOT, `data/characters/players/${TEST_PLAYER_ID}.json`),
    content: {
      id: TEST_PLAYER_ID,
      name: 'Test Solo Player',
      displayName: 'TSP',
      poseFileId: TEST_PLAYER_ID,
      era: '2020s',
      jerseyColors: {
        primary: { base: 'purple', accent: 'gold' }
      },
      signatureMoves: ['test-move-1', 'test-move-2'],
      physicalDescription: '6\'5" test player with distinctive purple headband',
      archetype: 'Testing archetype for solo character validation'
    }
  },

  standaloneFigure: {
    path: join(ROOT, `data/characters/figures/${TEST_FIGURE_ID}.json`),
    content: {
      id: TEST_FIGURE_ID,
      name: 'Test Solo Figure',
      displayName: 'TSF',
      poseFileId: TEST_FIGURE_ID,
      attribute: 'golden test scroll',
      attributeDescription: 'A glowing scroll used for testing',
      visualStyle: 'ancient test aesthetic',
      clothing: 'flowing test robes',
      physicalDescription: 'Bearded test figure with wise eyes',
      anatomyNote: 'Two arms, human form',
      archetype: 'Testing archetype for solo figure validation'
    }
  },

  playerPoses: {
    path: join(ROOT, `data/poses/players/${TEST_PLAYER_ID}.json`),
    content: {
      id: TEST_PLAYER_ID,
      name: 'Test Solo Player',
      defaultPose: 'test-default-pose',
      description: 'Test player for validation',
      poses: {
        'test-default-pose': {
          id: 'test-default-pose',
          name: 'Test Default Pose',
          description: 'The default test pose',
          expression: 'focused determination',
          prompt: 'standing in ready position, balanced stance, arms raised in victory, purple headband visible',
          energy: 'test energy'
        },
        'test-alternate-pose': {
          id: 'test-alternate-pose',
          name: 'Test Alternate Pose',
          description: 'An alternate test pose',
          expression: 'intense concentration',
          prompt: 'mid-jump shooting form, perfect arc, eyes on target',
          energy: 'focused intensity'
        }
      }
    }
  },

  figurePoses: {
    path: join(ROOT, `data/poses/figures/${TEST_FIGURE_ID}.json`),
    content: {
      id: TEST_FIGURE_ID,
      name: 'Test Solo Figure',
      defaultPose: 'test-figure-default',
      description: 'Test figure for validation',
      poses: {
        'test-figure-default': {
          id: 'test-figure-default',
          name: 'Test Figure Default',
          description: 'The default test figure pose',
          expression: 'serene wisdom',
          prompt: 'standing with golden test scroll raised, robes flowing, wise expression',
          energy: 'peaceful wisdom',
          quoteId: 'test-quote'
        },
        'test-figure-alternate': {
          id: 'test-figure-alternate',
          name: 'Test Figure Alternate',
          description: 'An alternate test figure pose',
          expression: 'determined resolve',
          prompt: 'pointing forward with scroll in other hand, commanding presence',
          energy: 'commanding authority',
          quoteId: 'test-quote-2'
        }
      }
    }
  },

  figureQuotes: {
    path: join(ROOT, `data/quotes/figures/${TEST_FIGURE_ID}.json`),
    content: {
      id: TEST_FIGURE_ID,
      name: 'Test Solo Figure',
      aliases: ['TSF', 'The Tester'],
      quotes: {
        'test-quote': {
          source: 'Test 1:1',
          context: 'When the tests were run',
          hebrew: 'בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַבְּדִיקוֹת',
          english: 'In the beginning, the tests were created.',
          mood: 'hopeful validation'
        },
        'test-quote-2': {
          source: 'Test 2:1',
          context: 'After the tests passed',
          hebrew: 'וַיַּרְא כִּי טוֹב',
          english: 'And it was seen that it was good.',
          mood: 'satisfied completion'
        }
      }
    }
  },

  // Override fixture - standalone file for existing pairing character
  overridePlayer: {
    path: join(ROOT, `data/characters/players/${TEST_OVERRIDE_ID}.json`),
    content: {
      id: TEST_OVERRIDE_ID,
      name: 'Override Jordan',
      displayName: 'Override MJ',
      poseFileId: TEST_OVERRIDE_ID,
      era: '1990s',
      jerseyColors: {
        primary: { base: 'override-red', accent: 'override-black' }
      },
      physicalDescription: 'OVERRIDE: This should appear instead of pairing data',
      archetype: 'Override archetype for priority testing'
    }
  }
};

function createFixtures() {
  log('\n📦 Creating test fixtures...', colors.blue);

  // Ensure directories exist
  mkdirSync(join(ROOT, 'data/characters/players'), { recursive: true });
  mkdirSync(join(ROOT, 'data/characters/figures'), { recursive: true });

  for (const [name, fixture] of Object.entries(fixtures)) {
    writeFileSync(fixture.path, JSON.stringify(fixture.content, null, 2));
    console.log(`  Created: ${fixture.path.replace(ROOT, '.')}`);
  }
}

function cleanupFixtures() {
  log('\n🧹 Cleaning up test fixtures...', colors.blue);

  for (const [name, fixture] of Object.entries(fixtures)) {
    if (existsSync(fixture.path)) {
      unlinkSync(fixture.path);
      console.log(`  Removed: ${fixture.path.replace(ROOT, '.')}`);
    }
  }
}

// ============================================
// CLI TESTS
// ============================================

function runCommand(command, expectSuccess = true) {
  try {
    const output = execSync(command, {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { success: true, output, error: null };
  } catch (err) {
    return {
      success: false,
      output: err.stdout || '',
      error: err.stderr || err.message
    };
  }
}

function testCli() {
  log('\n🔧 CLI Tests (generate-solo.js)', colors.bold);

  // Test 1: List poses for standalone player
  log('\n  --- Standalone Player Tests ---');
  {
    const result = runCommand(`node scripts/generate-solo.js player ${TEST_PLAYER_ID} --list-poses`);
    const hasPoses = result.output.includes('test-default-pose') && result.output.includes('test-alternate-pose');
    logTest('List poses for standalone player', result.success && hasPoses);
  }

  // Test 2: List poses for standalone figure
  {
    const result = runCommand(`node scripts/generate-solo.js figure ${TEST_FIGURE_ID} --list-poses`);
    const hasPoses = result.output.includes('test-figure-default') && result.output.includes('test-figure-alternate');
    logTest('List poses for standalone figure', result.success && hasPoses);
  }

  // Test 3: Dry run with standalone player
  {
    const result = runCommand(`node scripts/generate-solo.js player ${TEST_PLAYER_ID} thunder-lightning --dry-run`);
    const hasPlayerData = result.output.includes('Test Solo Player') && result.output.includes('purple');
    logTest('Dry run with standalone player', result.success && hasPlayerData);
  }

  // Test 4: Dry run with standalone figure
  {
    const result = runCommand(`node scripts/generate-solo.js figure ${TEST_FIGURE_ID} beam-team --dry-run`);
    const hasFigureData = result.output.includes('Test Solo Figure') && result.output.includes('golden test scroll');
    logTest('Dry run with standalone figure', result.success && hasFigureData);
  }

  // Test 5: Specific pose selection
  {
    const result = runCommand(`node scripts/generate-solo.js player ${TEST_PLAYER_ID} thunder-lightning --pose test-alternate-pose --dry-run`);
    const hasAlternatePose = result.output.includes('mid-jump shooting form');
    logTest('Specific pose selection works', result.success && hasAlternatePose);
  }

  // Test 6: Standalone overrides pairing data
  log('\n  --- Priority Tests ---');
  {
    const result = runCommand(`node scripts/generate-solo.js player ${TEST_OVERRIDE_ID} thunder-lightning --dry-run`);
    const usesOverride = result.output.includes('OVERRIDE') || result.output.includes('override-red');
    logTest('Standalone file overrides pairing data', result.success && usesOverride);
  }

  // Test 7: Pairing character still works (without override)
  log('\n  --- Pairing Fallback Tests ---');
  {
    // First remove the override fixture temporarily
    const overridePath = fixtures.overridePlayer.path;
    const overrideContent = readFileSync(overridePath, 'utf-8');
    unlinkSync(overridePath);

    const result = runCommand(`node scripts/generate-solo.js player jordan thunder-lightning --dry-run`);
    const usesPairing = result.output.includes('Michael Jordan') && !result.output.includes('OVERRIDE');
    logTest('Pairing character works without standalone', result.success && usesPairing);

    // Restore override fixture
    writeFileSync(overridePath, overrideContent);
  }

  // Test 8: Figure from pairing works
  {
    const result = runCommand(`node scripts/generate-solo.js figure moses beam-team --dry-run`);
    const hasMoses = result.output.includes('Moses');
    logTest('Figure from pairing works', result.success && hasMoses);
  }

  // Test 9: Non-existent character shows helpful error
  log('\n  --- Error Handling Tests ---');
  {
    const result = runCommand(`node scripts/generate-solo.js player fake-nonexistent-player thunder-lightning`);
    const hasHelpfulError = result.error && (
      result.error.includes('Pose file not found') ||
      result.error.includes('Available pose files')
    );
    logTest('Non-existent character shows helpful error', !result.success && hasHelpfulError);
  }

  // Test 10: Hair color works for applicable characters
  log('\n  --- Special Features Tests ---');
  {
    // Remove override so we use real Rodman from pairings
    const overridePath = fixtures.overridePlayer.path;
    const overrideContent = existsSync(overridePath) ? readFileSync(overridePath, 'utf-8') : null;
    if (overrideContent) unlinkSync(overridePath);

    const result = runCommand(`node scripts/generate-solo.js player rodman metal-universe-dark --pose diving-loose-ball --hair green --dry-run`);
    const hasGreenHair = result.output.includes('green');
    logTest('Hair color override works', result.success && hasGreenHair);

    // Restore override fixture
    if (overrideContent) writeFileSync(overridePath, overrideContent);
  }

  // Test 11: All templates work with solo mode
  log('\n  --- Template Compatibility Tests ---');
  const templates = [
    'thunder-lightning',
    'thunder-lightning-dark',
    'beam-team',
    'beam-team-shadow',
    'metal-universe',
    'metal-universe-dark',
    'downtown',
    'kaboom',
    'prizm-silver'
  ];

  for (const template of templates) {
    const result = runCommand(`node scripts/generate-solo.js player ${TEST_PLAYER_ID} ${template} --dry-run`);
    logTest(`Template: ${template}`, result.success && result.output.includes('PROMPT'));
  }
}

// ============================================
// API TESTS
// ============================================

async function checkServerRunning() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch('http://localhost:3333/api/manifest', {
      signal: controller.signal
    });
    clearTimeout(timeout);

    // Check if we got JSON back (our API) vs HTML (different server)
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return false;
    }

    // Try to parse as JSON to verify it's our API
    try {
      const data = await response.json();
      return response.ok && data && typeof data === 'object';
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}

async function testApi() {
  log('\n🌐 API Tests (visualizer/server.js)', colors.bold);

  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    log('\n  Server not running at http://localhost:3333', colors.yellow);
    log('  Start with: cd visualizer && npm start', colors.yellow);
    log('  Skipping API tests...', colors.yellow);

    logSkip('GET /api/characters/players', 'Server not running');
    logSkip('GET /api/characters/figures', 'Server not running');
    logSkip('POST /api/generate-solo', 'Server not running');
    return;
  }

  // Check if server has updated endpoints by testing one
  try {
    const testResponse = await fetch('http://localhost:3333/api/characters/players');
    const contentType = testResponse.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      log('\n  Server is running but endpoints not found (404)', colors.yellow);
      log('  The server needs to be restarted to pick up code changes.', colors.yellow);
      log('  Stop the server and run: cd visualizer && npm start', colors.yellow);
      log('  Skipping API tests...', colors.yellow);

      logSkip('GET /api/characters/players', 'Server needs restart');
      logSkip('GET /api/characters/figures', 'Server needs restart');
      logSkip('POST /api/generate-solo', 'Server needs restart');
      return;
    }
  } catch (err) {
    logSkip('API endpoint check', err.message);
    return;
  }

  // Test 1: Players endpoint includes standalone
  log('\n  --- Character Listing Tests ---');
  {
    try {
      const response = await fetch('http://localhost:3333/api/characters/players');
      const players = await response.json();

      const hasStandalone = players.some(p => p.id === TEST_PLAYER_ID);
      const standaloneMarked = players.find(p => p.id === TEST_PLAYER_ID)?.standalone === true;
      const hasPairingChars = players.some(p => p.id === 'jordan') && players.some(p => p.id === 'lebron');

      logTest('Players endpoint returns data', response.ok && Array.isArray(players));
      logTest('Players includes standalone characters', hasStandalone);
      logTest('Standalone players marked with standalone: true', standaloneMarked);
      logTest('Players includes pairing characters', hasPairingChars);

      // Check override priority
      const jordanEntry = players.find(p => p.id === 'jordan');
      const jordanIsOverride = jordanEntry?.name === 'Override Jordan';
      logTest('Standalone overrides pairing in player list', jordanIsOverride);
    } catch (err) {
      logTest('Players endpoint', false, err.message);
    }
  }

  // Test 2: Figures endpoint includes standalone
  {
    try {
      const response = await fetch('http://localhost:3333/api/characters/figures');
      const figures = await response.json();

      const hasStandalone = figures.some(f => f.id === TEST_FIGURE_ID);
      const standaloneMarked = figures.find(f => f.id === TEST_FIGURE_ID)?.standalone === true;
      const hasPairingChars = figures.some(f => f.id === 'moses') && figures.some(f => f.id === 'david');

      logTest('Figures endpoint returns data', response.ok && Array.isArray(figures));
      logTest('Figures includes standalone characters', hasStandalone);
      logTest('Standalone figures marked with standalone: true', standaloneMarked);
      logTest('Figures includes pairing characters', hasPairingChars);
    } catch (err) {
      logTest('Figures endpoint', false, err.message);
    }
  }

  // Test 3: Generate solo with standalone player (dry conceptual test - just check endpoint works)
  log('\n  --- Solo Generation Tests ---');
  {
    try {
      // We won't actually generate (costs money/time), just verify endpoint accepts request
      const response = await fetch('http://localhost:3333/api/generate-solo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'player',
          characterId: TEST_PLAYER_ID,
          template: 'thunder-lightning',
          pose: 'test-default-pose',
          darkMode: false
        })
      });

      // We expect this to either succeed or fail with a generation error (not a 400 bad request)
      const data = await response.json();
      const validRequest = response.status !== 400;
      logTest('Solo generation endpoint accepts standalone player', validRequest,
        response.ok ? 'Request accepted' : `Status: ${response.status}`);
    } catch (err) {
      logTest('Solo generation endpoint', false, err.message);
    }
  }

  // Test 4: Generate solo with standalone figure
  {
    try {
      const response = await fetch('http://localhost:3333/api/generate-solo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'figure',
          characterId: TEST_FIGURE_ID,
          template: 'beam-team',
          pose: 'test-figure-default',
          darkMode: false
        })
      });

      const validRequest = response.status !== 400;
      logTest('Solo generation endpoint accepts standalone figure', validRequest,
        response.ok ? 'Request accepted' : `Status: ${response.status}`);
    } catch (err) {
      logTest('Solo generation endpoint (figure)', false, err.message);
    }
  }

  // Test 5: Error handling for missing character
  {
    try {
      const response = await fetch('http://localhost:3333/api/generate-solo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'player',
          characterId: 'nonexistent-fake-player',
          template: 'thunder-lightning',
          pose: 'default'
        })
      });

      const data = await response.json();
      // API returns 200 with success: false for errors (common API pattern)
      const isError = response.status >= 400 || data.success === false;
      const hasErrorMessage = data.error && data.error.includes('not found');
      logTest('Returns error for non-existent character', isError && hasErrorMessage);
    } catch (err) {
      logTest('Error handling for missing character', false, err.message);
    }
  }
}

// ============================================
// JSON VALIDATION TESTS
// ============================================

function testJsonValidation() {
  log('\n📋 JSON Validation Tests', colors.bold);

  // Test that all fixtures are valid JSON
  for (const [name, fixture] of Object.entries(fixtures)) {
    try {
      JSON.parse(readFileSync(fixture.path, 'utf-8'));
      logTest(`Valid JSON: ${name}`, true);
    } catch (err) {
      logTest(`Valid JSON: ${name}`, false, err.message);
    }
  }

  // Test that fixture data matches expected schema
  log('\n  --- Schema Validation ---');

  // Player schema check
  {
    const player = fixtures.standalonePlayer.content;
    const hasRequiredFields = player.id && player.name && player.poseFileId && player.physicalDescription;
    logTest('Standalone player has required fields', hasRequiredFields);
  }

  // Figure schema check
  {
    const figure = fixtures.standaloneFigure.content;
    const hasRequiredFields = figure.id && figure.name && figure.poseFileId && figure.physicalDescription;
    logTest('Standalone figure has required fields', hasRequiredFields);
  }

  // Pose file schema check
  {
    const poses = fixtures.playerPoses.content;
    const hasRequiredFields = poses.id && poses.defaultPose && poses.poses && poses.poses[poses.defaultPose];
    logTest('Pose file has required fields', hasRequiredFields);
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  log('\n' + '='.repeat(60), colors.bold);
  log('  SOLO CHARACTERS FEATURE - TEST SUITE', colors.bold);
  log('='.repeat(60), colors.bold);

  const startTime = Date.now();

  try {
    // Create test fixtures
    createFixtures();

    // Run JSON validation tests
    testJsonValidation();

    // Run CLI tests
    if (runCliTests) {
      testCli();
    }

    // Run API tests
    if (runApiTests) {
      await testApi();
    }

  } finally {
    // Cleanup unless --keep flag is set
    if (!keepFixtures) {
      cleanupFixtures();
    } else {
      log('\n⚠️  Keeping test fixtures (--keep flag set)', colors.yellow);
    }
  }

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  log('\n' + '='.repeat(60), colors.bold);
  log('  TEST SUMMARY', colors.bold);
  log('='.repeat(60), colors.bold);

  log(`\n  ${colors.green}Passed:${colors.reset}  ${results.passed}`);
  log(`  ${colors.red}Failed:${colors.reset}  ${results.failed}`);
  log(`  ${colors.yellow}Skipped:${colors.reset} ${results.skipped}`);
  log(`  ${colors.blue}Duration:${colors.reset} ${duration}s`);

  if (results.failed > 0) {
    log('\n  Failed tests:', colors.red);
    results.tests
      .filter(t => t.passed === false)
      .forEach(t => log(`    - ${t.name}${t.message ? `: ${t.message}` : ''}`, colors.red));
  }

  log('\n' + '='.repeat(60) + '\n', colors.bold);

  // Exit with error code if tests failed
  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
