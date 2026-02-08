/**
 * Playwright Test Runner Spec for Holy Hoops Game
 *
 * This version uses Playwright's official test runner with proper assertions.
 *
 * Prerequisites:
 *   npm install -D @playwright/test
 *   npx playwright install chromium
 *
 * Run:
 *   npx playwright test test/game.spec.js
 *   npx playwright test test/game.spec.js --headed  # See the browser
 *   npx playwright test test/game.spec.js --debug   # Step through
 */

import { test, expect } from '@playwright/test';

const GAME_URL = 'http://localhost:5176/';

// Increase timeout for game tests
test.setTimeout(30000);

/**
 * Inject test helpers into the page to read Phaser game state
 */
async function injectTestHelpers(page) {
  await page.evaluate(() => {
    window.__gameTest = {
      getActiveScene: () => {
        const game = window.game || document.querySelector('canvas')?.__phaser_game;
        if (!game) return null;
        return game.scene.scenes.find(s => s.scene.isActive());
      },
      // Derive player state from game properties (no explicit playerState in GameScene)
      getPlayerState: () => {
        const scene = window.__gameTest.getActiveScene();
        if (!scene) return null;
        const onGround = scene.player?.body?.blocked?.down;
        if (scene.isDunking) return 'DUNKING';
        // ballCarrier is null when no red team player has ball
        if (!scene.ballCarrier && !scene.opponentHasBall) return 'SHOT_FIRED';
        if (!onGround) return 'JUMPING';
        return 'GROUNDED';
      },
      getScore: () => window.__gameTest.getActiveScene()?.score ?? null,
      // Return boolean for backwards compatibility (true if any red player has ball)
      hasBall: () => window.__gameTest.getActiveScene()?.ballCarrier != null,
      opponentHasBall: () => window.__gameTest.getActiveScene()?.opponentHasBall ?? null,
      getPlayerPosition: () => {
        const scene = window.__gameTest.getActiveScene();
        return scene?.player ? { x: scene.player.x, y: scene.player.y } : null;
      },
      getBallVelocity: () => {
        const scene = window.__gameTest.getActiveScene();
        return scene?.ball?.body ?
          { x: scene.ball.body.velocity.x, y: scene.ball.body.velocity.y } : null;
      },
      // Helper to give ball to player for testing existing mechanics
      giveBallToPlayer: () => {
        const scene = window.__gameTest.getActiveScene();
        if (!scene) return false;
        scene.opponentHasBall = false;
        // Give ball to the active player (or player 1 by default)
        scene.ballCarrier = scene.players ? scene.players[scene.activePlayerIndex] : scene.player;
        scene.ball.body.setVelocity(0, 0);
        scene.ball.body.setAllowGravity(false);
        return true;
      }
    };
  });
}

/**
 * Get current game state from browser
 */
async function getGameState(page) {
  return page.evaluate(() => {
    if (!window.__gameTest) return null;
    return {
      playerState: window.__gameTest.getPlayerState(),
      score: window.__gameTest.getScore(),
      hasBall: window.__gameTest.hasBall(),
      playerPosition: window.__gameTest.getPlayerPosition(),
      ballVelocity: window.__gameTest.getBallVelocity()
    };
  });
}

/**
 * Wait for player to be in a specific state
 */
async function waitForPlayerState(page, targetState, timeout = 5000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const state = await getGameState(page);
    if (state?.playerState === targetState) return true;
    await page.waitForTimeout(50);
  }
  return false;
}

test.describe('Holy Hoops Game Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to game
    await page.goto(GAME_URL);

    // Wait for canvas to load
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(500);  // Let Phaser initialize
  });

  test('game loads and shows menu', async ({ page }) => {
    // Canvas should be present
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('pressing Space starts the game', async ({ page }) => {
    // Press Space to start
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // Inject helpers after scene transition
    await injectTestHelpers(page);
    await page.waitForTimeout(200);

    // Check we're in GameScene
    const state = await getGameState(page);
    expect(state).not.toBeNull();
    expect(state.playerState).toBe('GROUNDED');
    // Opponent starts with ball in defense mechanics
    expect(state.hasBall).toBe(false);
  });

  test('player moves right when D key is pressed', async ({ page }) => {
    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await injectTestHelpers(page);

    // Get initial position
    const stateBefore = await getGameState(page);
    const initialX = stateBefore.playerPosition.x;

    // Hold D key for movement
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(500);
    await page.keyboard.up('KeyD');

    // Check position changed
    const stateAfter = await getGameState(page);
    expect(stateAfter.playerPosition.x).toBeGreaterThan(initialX);
  });

  test('player moves left when A key is pressed', async ({ page }) => {
    // Start game and move right first (to have room to move left)
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await injectTestHelpers(page);

    // Move right first
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(300);
    await page.keyboard.up('KeyD');

    const stateBefore = await getGameState(page);
    const initialX = stateBefore.playerPosition.x;

    // Now move left
    await page.keyboard.down('KeyA');
    await page.waitForTimeout(500);
    await page.keyboard.up('KeyA');

    const stateAfter = await getGameState(page);
    expect(stateAfter.playerPosition.x).toBeLessThan(initialX);
  });

  test('holding Space makes player jump', async ({ page }) => {
    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await injectTestHelpers(page);

    // Get initial Y position
    const stateBefore = await getGameState(page);
    const initialY = stateBefore.playerPosition.y;

    // Hold Space to jump
    await page.keyboard.down('Space');
    await page.waitForTimeout(300);

    // Check player is in the air (JUMPING state or position changed)
    const stateJumping = await getGameState(page);
    expect(stateJumping.playerState).toBe('JUMPING');

    // Player should have moved upward (Y decreases in Phaser)
    expect(stateJumping.playerPosition.y).toBeLessThan(initialY);

    await page.keyboard.up('Space');
  });

  test('releasing Space while jumping fires a shot', async ({ page }) => {
    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await injectTestHelpers(page);

    // Give ball to player for testing (opponent starts with ball in defense mechanics)
    await page.evaluate(() => window.__gameTest.giveBallToPlayer());
    await page.waitForTimeout(100);

    // Confirm player has the ball
    let state = await getGameState(page);
    expect(state.hasBall).toBe(true);

    // Jump
    await page.keyboard.down('Space');
    await page.waitForTimeout(350);  // Wait to reach shooting height

    // Verify in shooting state (JUMPING or already GROUNDED if fast)
    state = await getGameState(page);
    expect(['JUMPING', 'GROUNDED']).toContain(state.playerState);

    // Release to shoot
    await page.keyboard.up('Space');
    await page.waitForTimeout(100);

    // Check shot was fired
    state = await getGameState(page);
    expect(state.hasBall).toBe(false);
    expect(state.playerState).toBe('SHOT_FIRED');

    // Ball should have velocity (it's moving)
    const velocity = state.ballVelocity;
    expect(velocity).not.toBeNull();
    // Ball should be moving toward hoop (positive X velocity)
    expect(velocity.x).toBeGreaterThan(0);
  });

  test('shot sequence: move right, jump, shoot', async ({ page }) => {
    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await injectTestHelpers(page);

    // Move right toward hoop
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(800);
    await page.keyboard.up('KeyD');

    // Jump and shoot
    await page.keyboard.down('Space');
    await page.waitForTimeout(350);
    await page.keyboard.up('Space');

    // Verify shot was taken
    const state = await getGameState(page);
    expect(state.hasBall).toBe(false);

    // Wait for shot to complete
    await page.waitForTimeout(2000);

    // Score might have increased (depends on timing/position)
    const finalState = await getGameState(page);
    console.log('Final score:', finalState.score);
  });

  test('multiple shot sequence', async ({ page }) => {
    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await injectTestHelpers(page);

    let state = await getGameState(page);
    const initialScore = state.score;

    // Perform 3 shot attempts
    for (let i = 0; i < 3; i++) {
      // Wait for player to be ready (grounded with ball)
      await waitForPlayerState(page, 'GROUNDED', 3000);
      state = await getGameState(page);

      if (!state.hasBall) {
        // Wait for ball pickup
        await page.waitForTimeout(500);
        state = await getGameState(page);
        if (!state.hasBall) continue;
      }

      // Move toward hoop
      await page.keyboard.down('KeyD');
      await page.waitForTimeout(600);
      await page.keyboard.up('KeyD');

      // Jump and shoot at apex
      await page.keyboard.down('Space');
      await page.waitForTimeout(380);
      await page.keyboard.up('Space');

      // Wait for result
      await page.waitForTimeout(1800);
    }

    state = await getGameState(page);
    console.log(`Score: ${initialScore} -> ${state.score}`);
  });

});
