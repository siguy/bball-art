/**
 * Playwright Test Script for Holy Hoops Game
 *
 * Tests keyboard input (hold space, release space) and game state responses.
 *
 * Prerequisites:
 *   npm install @playwright/test
 *   npx playwright install chromium
 *
 * Run:
 *   npx playwright test test/game-test.js
 *
 * Or run interactively:
 *   node test/game-test.js
 */

import { chromium } from 'playwright';

const GAME_URL = 'http://localhost:5176/';

/**
 * Helper to wait for a specific duration
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for the game canvas to be ready
 */
async function waitForGameReady(page) {
  // Wait for Phaser canvas to appear
  await page.waitForSelector('canvas', { timeout: 10000 });
  // Give Phaser time to initialize
  await delay(500);
}

/**
 * Expose game state for testing via browser console
 * This injects a helper that can read Phaser's internal state
 */
async function injectTestHelpers(page) {
  await page.evaluate(() => {
    window.__gameTest = {
      getGameInstance: () => {
        // Phaser stores game instance; we can access via the global
        return window.game || document.querySelector('canvas')?.__phaser_game;
      },
      getActiveScene: () => {
        const game = window.__gameTest.getGameInstance();
        if (!game) return null;
        return game.scene.scenes.find(s => s.scene.isActive());
      },
      getPlayerState: () => {
        const scene = window.__gameTest.getActiveScene();
        if (!scene || !scene.playerState) return null;
        return scene.playerState;
      },
      getScore: () => {
        const scene = window.__gameTest.getActiveScene();
        if (!scene || scene.score === undefined) return null;
        return scene.score;
      },
      hasBall: () => {
        const scene = window.__gameTest.getActiveScene();
        if (!scene) return null;
        return scene.hasBall;
      },
      getPlayerPosition: () => {
        const scene = window.__gameTest.getActiveScene();
        if (!scene || !scene.player) return null;
        return { x: scene.player.x, y: scene.player.y };
      },
      getBallPosition: () => {
        const scene = window.__gameTest.getActiveScene();
        if (!scene || !scene.ball) return null;
        return { x: scene.ball.x, y: scene.ball.y };
      }
    };
  });
}

/**
 * Get game state from the browser
 */
async function getGameState(page) {
  return await page.evaluate(() => {
    if (!window.__gameTest) return null;
    return {
      playerState: window.__gameTest.getPlayerState(),
      score: window.__gameTest.getScore(),
      hasBall: window.__gameTest.hasBall(),
      playerPosition: window.__gameTest.getPlayerPosition(),
      ballPosition: window.__gameTest.getBallPosition()
    };
  });
}

/**
 * Test sequence: Menu -> Game -> Move -> Jump -> Shoot
 */
async function runGameTest() {
  console.log('Starting Playwright game test...\n');

  const browser = await chromium.launch({
    headless: false,  // Set to true for CI
    slowMo: 50        // Slow down for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  try {
    // Step 1: Navigate to game
    console.log('1. Opening game at', GAME_URL);
    await page.goto(GAME_URL);
    await waitForGameReady(page);
    console.log('   ✓ Game canvas loaded');

    // Step 2: Start the game (press Space on menu)
    console.log('\n2. Starting game (pressing Space on menu)...');
    await page.keyboard.press('Space');
    await delay(500);  // Wait for scene transition

    // Inject test helpers after GameScene is active
    await injectTestHelpers(page);
    await delay(200);

    let state = await getGameState(page);
    console.log('   Initial state:', state);

    if (state?.playerState === 'GROUNDED') {
      console.log('   ✓ Game started, player is GROUNDED');
    }

    // Step 3: Move right
    console.log('\n3. Moving right (holding D key)...');
    const initialPos = state?.playerPosition;

    await page.keyboard.down('KeyD');
    await delay(500);  // Hold for 500ms
    await page.keyboard.up('KeyD');

    state = await getGameState(page);
    const movedPos = state?.playerPosition;
    console.log('   Position before:', initialPos);
    console.log('   Position after:', movedPos);

    if (movedPos && initialPos && movedPos.x > initialPos.x) {
      console.log('   ✓ Player moved right');
    } else {
      console.log('   ✗ Player did not move right');
    }

    // Step 4: Jump (hold Space)
    console.log('\n4. Jumping (holding Space)...');

    // Verify player has the ball before shooting
    const hasBallBefore = state?.hasBall;
    console.log('   Has ball:', hasBallBefore);

    // Hold Space to jump
    await page.keyboard.down('Space');
    console.log('   Space key DOWN - jumping...');

    // Wait for player to rise
    await delay(400);

    state = await getGameState(page);
    console.log('   Player state during jump:', state?.playerState);
    console.log('   Player Y position:', state?.playerPosition?.y);

    if (state?.playerState === 'JUMPING' || state?.playerState === 'CAN_SHOOT') {
      console.log('   ✓ Player is jumping/can shoot');
    }

    // Step 5: Release Space to shoot
    console.log('\n5. Releasing Space to shoot...');
    await page.keyboard.up('Space');
    console.log('   Space key UP - shooting...');

    await delay(100);
    state = await getGameState(page);
    console.log('   Player state after release:', state?.playerState);
    console.log('   Has ball after release:', state?.hasBall);

    if (state?.hasBall === false) {
      console.log('   ✓ Shot was fired (ball released)');
    } else {
      console.log('   ✗ Shot was NOT fired');
    }

    // Step 6: Wait for ball to land and check results
    console.log('\n6. Waiting for shot result...');
    await delay(2000);  // Wait for ball trajectory

    state = await getGameState(page);
    console.log('   Final score:', state?.score);
    console.log('   Ball position:', state?.ballPosition);
    console.log('   Has ball (picked up?):', state?.hasBall);

    // Step 7: Run multiple shot attempts
    console.log('\n7. Running automated shot sequence...');
    await runMultipleShotSequence(page, 3);

    state = await getGameState(page);
    console.log('   Final score after sequence:', state?.score);

    console.log('\n========================================');
    console.log('TEST COMPLETE');
    console.log('========================================\n');

    // Keep browser open for inspection
    console.log('Keeping browser open for 5 seconds...');
    await delay(5000);

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

/**
 * Run multiple shot sequences automatically
 */
async function runMultipleShotSequence(page, attempts) {
  for (let i = 0; i < attempts; i++) {
    console.log(`   Attempt ${i + 1}/${attempts}...`);

    // Wait to be grounded and have ball
    let ready = false;
    for (let j = 0; j < 20; j++) {
      const state = await getGameState(page);
      if (state?.playerState === 'GROUNDED' && state?.hasBall) {
        ready = true;
        break;
      }
      await delay(200);
    }

    if (!ready) {
      console.log('     Skipped - player not ready');
      continue;
    }

    // Move closer to hoop
    await page.keyboard.down('KeyD');
    await delay(800);
    await page.keyboard.up('KeyD');

    // Jump and shoot sequence
    await page.keyboard.down('Space');
    await delay(350);  // Wait for apex
    await page.keyboard.up('Space');

    // Wait for result
    await delay(1500);

    const state = await getGameState(page);
    console.log(`     Score: ${state?.score}`);
  }
}

// Run the test
runGameTest().catch(console.error);
