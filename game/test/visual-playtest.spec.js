/**
 * Visual Playtest - Automated gameplay with screenshots and state logging
 *
 * This test simulates actual gameplay sequences and captures visual snapshots
 * along with game state data for review. It is NOT a pass/fail test suite --
 * it is a visual regression and playtesting harness.
 *
 * Run:
 *   npx playwright test test/visual-playtest.spec.js --headed
 *   npx playwright test test/visual-playtest.spec.js --project=chromium
 *   ./test/run-visual-test.sh   # starts server, runs test, cleans up
 *
 * Screenshots saved to: test-results/visual-playtest/
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Use GAME_BASE_URL env var if set (from run-visual-test.sh), otherwise
// use '/' which relies on baseURL from playwright.config.js
const GAME_URL = process.env.GAME_BASE_URL || '/';

// Screenshot output directory
const SCREENSHOT_DIR = path.resolve('test-results/visual-playtest');

// Longer timeout -- this test runs a full minute of gameplay
test.setTimeout(120000);

// ---------- Helpers ----------

/**
 * Ensure the screenshot directory exists
 */
function ensureScreenshotDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

/**
 * Take a labeled screenshot and save it to the visual-playtest directory
 */
async function takeScreenshot(page, label) {
  ensureScreenshotDir();
  const filename = `${label}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`  [screenshot] ${filepath}`);
  return filepath;
}

/**
 * Inject test helpers into the page to read Phaser game state.
 * Mirrors the pattern from existing tests but adds more state extraction.
 */
async function injectTestHelpers(page) {
  await page.evaluate(() => {
    window.__visualTest = {
      getScene: () => {
        const game = window.game;
        if (!game) return null;
        // GameScene is scenes[2] (Boot=0, Menu=1, Game=2, GameOver=3)
        return game.scene.scenes.find(s => s.scene.isActive() && s.scene.key === 'GameScene');
      },

      getFullState: () => {
        const scene = window.__visualTest.getScene();
        if (!scene) return null;

        // Ball ownership (uses new state machine)
        let ballOwnership = scene.ballState === 'LOOSE' ? 'loose' : (scene.ballState === 'IN_FLIGHT' ? 'in_flight' : 'unknown');
        if (scene.ballState === 'CARRIED') {
          if (scene.ballOwner === scene.player) ballOwnership = 'player1';
          else if (scene.ballOwner === scene.teammate) ballOwnership = 'player2';
          else if (scene.ballOwner === scene.opponent) ballOwnership = 'opponent1';
          else if (scene.ballOwner === scene.opponent2) ballOwnership = 'opponent2';
        }

        // AI states
        const aiStates = [];
        if (scene.opponents) {
          for (const opp of scene.opponents) {
            aiStates.push(opp.aiState || 'unknown');
          }
        }

        return {
          // Ball
          ballPosition: scene.ball
            ? { x: Math.round(scene.ball.x), y: Math.round(scene.ball.y) }
            : null,
          ballVelocity: scene.ball?.body
            ? {
                x: Math.round(scene.ball.body.velocity.x),
                y: Math.round(scene.ball.body.velocity.y)
              }
            : null,
          ballOwnership,

          // Players
          player1: scene.player
            ? { x: Math.round(scene.player.x), y: Math.round(scene.player.y) }
            : null,
          player2: scene.teammate
            ? { x: Math.round(scene.teammate.x), y: Math.round(scene.teammate.y) }
            : null,
          activePlayerIndex: scene.activePlayerIndex,

          // Opponents
          opponent1: scene.opponent
            ? { x: Math.round(scene.opponent.x), y: Math.round(scene.opponent.y) }
            : null,
          opponent2: scene.opponent2
            ? { x: Math.round(scene.opponent2.x), y: Math.round(scene.opponent2.y) }
            : null,

          // Scores
          redScore: scene.score,
          purpleScore: scene.opponentScore,

          // AI
          aiStates,
          aiPaused: scene.aiPaused,

          // Ball state machine
          ballState: scene.ballState,

          // Game state flags
          isDunking: scene.isDunking,
          stealCooldown: scene.stealCooldown,
          shoveCooldown: scene.shoveCooldown,
          ballPickupCooldown: scene.ballPickupCooldown
        };
      },

      giveBallToPlayer: () => {
        const scene = window.__visualTest.getScene();
        if (!scene) return false;
        const activePlayer = scene.players[scene.activePlayerIndex];
        scene.ballState = 'CARRIED';
        scene.ballOwner = activePlayer;
        scene.ball.body.setVelocity(0, 0);
        scene.ball.body.setAllowGravity(false);
        return true;
      }
    };
  });
}

/**
 * Capture game state and log it alongside a screenshot label
 */
async function captureState(page, label) {
  const state = await page.evaluate(() => {
    return window.__visualTest ? window.__visualTest.getFullState() : null;
  });
  if (state) {
    console.log(`  [state @ ${label}]`, JSON.stringify(state, null, 2));
  } else {
    console.log(`  [state @ ${label}] GameScene not active or helpers not injected`);
  }
  return state;
}

/**
 * Take a screenshot and capture state together
 */
async function snapshot(page, label) {
  const filepath = await takeScreenshot(page, label);
  const state = await captureState(page, label);
  return { filepath, state };
}

/**
 * Start the game: navigate, wait for canvas, press Space to leave menu
 */
async function startGame(page) {
  await page.goto(GAME_URL);
  await page.waitForSelector('canvas', { timeout: 15000 });
  await page.waitForTimeout(1000); // Let Phaser fully initialize

  // Press Space to start from MenuScene
  await page.keyboard.press('Space');
  await page.waitForTimeout(1000); // Let GameScene initialize

  await injectTestHelpers(page);
  await page.waitForTimeout(200);
}

/**
 * Hold a key for a given duration (ms)
 */
async function holdKey(page, key, duration) {
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
}

/**
 * Wait for the AI to pick up the ball (opponent gets possession)
 */
async function waitForAIBall(page, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const state = await page.evaluate(() => {
      return window.__visualTest ? window.__visualTest.getFullState() : null;
    });
    if (state && state.ballOwnership.startsWith('opponent')) {
      return true;
    }
    await page.waitForTimeout(100);
  }
  return false;
}

// ---------- Random input helper for extended gameplay ----------

const INPUT_ACTIONS = [
  { name: 'move-right',  fn: async (page) => { await holdKey(page, 'KeyD', 300 + Math.random() * 400); } },
  { name: 'move-left',   fn: async (page) => { await holdKey(page, 'KeyA', 300 + Math.random() * 400); } },
  { name: 'jump-shoot',  fn: async (page) => {
    await page.keyboard.down('Space');
    await page.waitForTimeout(250 + Math.random() * 200);
    await page.keyboard.up('Space');
  }},
  { name: 'steal',       fn: async (page) => { await page.keyboard.press('ArrowDown'); } },
  { name: 'shove',       fn: async (page) => {
    await page.keyboard.down('ShiftLeft');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.up('ShiftLeft');
  }},
  { name: 'pass',        fn: async (page) => { await page.keyboard.press('KeyE'); } },
  { name: 'switch',      fn: async (page) => { await page.keyboard.press('Tab'); } },
  { name: 'move-right-jump', fn: async (page) => {
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(200);
    await page.keyboard.down('Space');
    await page.waitForTimeout(300);
    await page.keyboard.up('Space');
    await page.waitForTimeout(200);
    await page.keyboard.up('KeyD');
  }},
  { name: 'idle',        fn: async (page) => { await page.waitForTimeout(500); } },
];

function pickRandomAction() {
  return INPUT_ACTIONS[Math.floor(Math.random() * INPUT_ACTIONS.length)];
}

// ---------- Test Suite ----------

test.describe('Visual Playtest', () => {

  test.beforeEach(async () => {
    ensureScreenshotDir();
  });

  test('1 - Shot sequence: move right, shoot, capture result', async ({ page }) => {
    await startGame(page);

    // Give ball to player for controlled testing
    await page.evaluate(() => window.__visualTest.giveBallToPlayer());
    await page.waitForTimeout(200);

    await snapshot(page, 'shot-01-start');

    // Move right for 2 seconds
    console.log('  Moving right for 2 seconds...');
    await holdKey(page, 'KeyD', 2000);

    await snapshot(page, 'shot-02-after-move');

    // Jump and shoot
    console.log('  Jumping and shooting...');
    await page.keyboard.down('Space');
    await page.waitForTimeout(350);
    await page.keyboard.up('Space');

    await page.waitForTimeout(200);
    await snapshot(page, 'shot-03-mid-flight');

    // Wait for ball to land
    console.log('  Waiting for ball to settle...');
    await page.waitForTimeout(2500);

    await snapshot(page, 'after-shot');
  });

  test('2 - Defensive play: wait for AI, approach, steal attempt', async ({ page }) => {
    await startGame(page);

    await snapshot(page, 'defense-01-start');

    // Opponent starts with ball. Wait for AI to start moving.
    console.log('  Waiting for AI ball carrier...');
    const gotBall = await waitForAIBall(page, 5000);
    console.log(`  AI has ball: ${gotBall}`);

    await snapshot(page, 'defense-02-ai-has-ball');

    // Move toward opponent (they are to the right of spawn)
    console.log('  Moving toward opponent...');
    await holdKey(page, 'KeyD', 1500);

    await snapshot(page, 'defense-03-approaching');

    // Keep approaching until close
    let state = await page.evaluate(() => window.__visualTest.getFullState());
    let closeAttempts = 0;
    while (closeAttempts < 20) {
      const activeIdx = state?.activePlayerIndex ?? 0;
      const playerPos = activeIdx === 0 ? state?.player1 : state?.player2;
      // Check distance to whichever opponent has ball
      let oppPos = null;
      if (state?.ballOwnership === 'opponent1') oppPos = state?.opponent1;
      else if (state?.ballOwnership === 'opponent2') oppPos = state?.opponent2;

      if (playerPos && oppPos && Math.abs(playerPos.x - oppPos.x) < 80) {
        break;
      }

      await holdKey(page, 'KeyD', 200);
      state = await page.evaluate(() => window.__visualTest.getFullState());
      closeAttempts++;
    }

    await snapshot(page, 'defense-04-close-to-opponent');

    // Attempt steal
    console.log('  Attempting steal (Down arrow)...');
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);

    await snapshot(page, 'after-steal-attempt');
  });

  test('3 - Full minute of random gameplay with periodic snapshots', async ({ page }) => {
    await startGame(page);

    const PLAY_DURATION_MS = 60000; // 1 minute
    const SNAPSHOT_INTERVAL_MS = 5000; // every 5 seconds
    const ACTION_INTERVAL_MS = 400; // new action attempt every 400ms

    const startTime = Date.now();
    let snapshotCount = 0;
    let lastSnapshotTime = startTime;
    let actionLog = [];

    console.log('  Starting 60-second random gameplay...');

    await snapshot(page, 'gameplay-00-start');

    while (Date.now() - startTime < PLAY_DURATION_MS) {
      const elapsed = Date.now() - startTime;
      const elapsedSec = (elapsed / 1000).toFixed(1);

      // Pick and execute a random action
      const action = pickRandomAction();
      actionLog.push({ time: elapsedSec, action: action.name });

      try {
        await action.fn(page);
      } catch (e) {
        // Action might fail if page navigated or key state conflicts; continue
        console.log(`  [warn] Action "${action.name}" at ${elapsedSec}s failed: ${e.message}`);
      }

      // Take snapshot every 5 seconds
      if (Date.now() - lastSnapshotTime >= SNAPSHOT_INTERVAL_MS) {
        snapshotCount++;
        const label = `gameplay-${String(snapshotCount).padStart(2, '0')}-${elapsedSec}s`;
        await snapshot(page, label);
        lastSnapshotTime = Date.now();
      }

      // Brief pause between actions
      await page.waitForTimeout(ACTION_INTERVAL_MS);
    }

    // Final snapshot
    snapshotCount++;
    const finalLabel = `gameplay-${String(snapshotCount).padStart(2, '0')}-final`;
    const { state: finalState } = await snapshot(page, finalLabel);

    console.log('\n  === GAMEPLAY SUMMARY ===');
    console.log(`  Duration: 60 seconds`);
    console.log(`  Screenshots taken: ${snapshotCount + 1}`); // +1 for start
    console.log(`  Actions performed: ${actionLog.length}`);
    console.log(`  Final score: RED ${finalState?.redScore ?? '?'} - PURPLE ${finalState?.purpleScore ?? '?'}`);
    console.log(`  Action breakdown:`);

    // Count action types
    const actionCounts = {};
    for (const entry of actionLog) {
      actionCounts[entry.action] = (actionCounts[entry.action] || 0) + 1;
    }
    for (const [action, count] of Object.entries(actionCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${action}: ${count}`);
    }

    // Write a JSON summary alongside the screenshots
    const summaryPath = path.join(SCREENSHOT_DIR, 'gameplay-summary.json');
    const summary = {
      timestamp: new Date().toISOString(),
      durationMs: PLAY_DURATION_MS,
      screenshotCount: snapshotCount + 1,
      finalState,
      actionLog,
      actionCounts
    };
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`  Summary written to: ${summaryPath}`);
  });

});
