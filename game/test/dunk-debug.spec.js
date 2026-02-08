/**
 * Dunk Debug Test - specifically testing the dunk mechanic
 */
import { test, expect } from '@playwright/test';

const GAME_URL = 'http://localhost:5176/';

test.setTimeout(30000);

async function injectHelpers(page) {
  await page.evaluate(() => {
    window.__test = {
      getScene: () => {
        const game = window.game;
        if (!game) return null;
        return game.scene.scenes.find(s => s.scene.isActive());
      },
      getState: () => {
        const scene = window.__test.getScene();
        if (!scene) return null;
        // Use active player position (defaults to player 1)
        const activePlayer = scene.players ? scene.players[scene.activePlayerIndex] : scene.player;
        return {
          playerX: activePlayer?.x,
          playerY: activePlayer?.y,
          hasBall: scene.ballCarrier != null, // true if any red player has ball
          opponentHasBall: scene.opponentHasBall,
          isDunking: scene.isDunking,
          score: scene.score,
          onGround: activePlayer?.body?.blocked?.down,
          distToHoop: 1070 - (activePlayer?.x || 0),
          inDunkRange: (1070 - (activePlayer?.x || 0)) > 0 && (1070 - (activePlayer?.x || 0)) < 200,
          jumpedThisPress: scene.jumpedThisPress
        };
      },
      // Helper to give ball to player for testing existing mechanics
      giveBallToPlayer: () => {
        const scene = window.__test.getScene();
        if (!scene) return false;
        scene.opponentHasBall = false;
        // Give ball to active player
        const activePlayer = scene.players ? scene.players[scene.activePlayerIndex] : scene.player;
        scene.ballCarrier = activePlayer;
        scene.ball.body.setVelocity(0, 0);
        scene.ball.body.setAllowGravity(false);
        return true;
      }
    };
  });
}

test('DEBUG: Dunk range detection and single-jump dunk', async ({ page }) => {
  // Capture browser console
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  // Go to game
  await page.goto(GAME_URL);
  await page.waitForSelector('canvas');
  await page.waitForTimeout(600);

  // Start game (click instead of space to avoid triggering jump)
  await page.click('canvas');
  await page.waitForTimeout(800);

  // Inject helpers
  await injectHelpers(page);

  // Wait for game to initialize
  await page.waitForTimeout(500);

  // Get initial state
  let state = await page.evaluate(() => window.__test.getState());
  console.log('Initial state:', state);

  // Give ball to player for testing (opponent starts with ball in defense mechanics)
  await page.evaluate(() => window.__test.giveBallToPlayer());
  await page.waitForTimeout(100);
  state = await page.evaluate(() => window.__test.getState());
  console.log('After giving ball to player:', state);

  expect(state.hasBall).toBe(true);
  expect(state.score).toBe(0);

  // Move right toward hoop until in dunk range
  console.log('Moving toward hoop...');
  await page.keyboard.down('KeyD');

  // Keep moving until in dunk range
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(200);
    state = await page.evaluate(() => window.__test.getState());
    console.log(`Position: x=${state.playerX}, distToHoop=${state.distToHoop}, inDunkRange=${state.inDunkRange}`);

    if (state.inDunkRange) {
      console.log('IN DUNK RANGE!');
      break;
    }
  }

  await page.keyboard.up('KeyD');
  await page.waitForTimeout(100);

  // Verify we're in dunk range
  state = await page.evaluate(() => window.__test.getState());
  console.log('Before jump:', state);
  expect(state.inDunkRange).toBe(true);
  expect(state.onGround).toBe(true);
  expect(state.hasBall).toBe(true);

  const scoreBefore = state.score;

  // Press Space ONCE - player jumps toward hoop with ball
  console.log('Pressing SPACE for dunk...');
  await page.keyboard.down('Space');
  await page.waitForTimeout(50);
  await page.keyboard.up('Space');

  // Check state - should be dunking but ball still with player
  state = await page.evaluate(() => window.__test.getState());
  console.log('After space press (mid-air):', state);
  expect(state.isDunking).toBe(true);

  // Wait for player to reach the hoop and complete the dunk
  console.log('Waiting for player to reach hoop...');
  await page.waitForTimeout(800);

  // Check final state - dunk should be complete
  state = await page.evaluate(() => window.__test.getState());
  console.log('After dunk completes:', state);

  // Score should have increased when ball reached the rim
  expect(state.score).toBe(scoreBefore + 2);
  expect(state.hasBall).toBe(false);

  console.log('DUNK TEST PASSED! Score:', state.score);
});

test('DEBUG: Normal shot from distance', async ({ page }) => {
  // Capture browser console
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await page.goto(GAME_URL);
  await page.waitForSelector('canvas');
  await page.waitForTimeout(600);

  // Start game with click (not Space) to avoid triggering jump
  await page.click('canvas');
  await page.waitForTimeout(800);

  await injectHelpers(page);

  // Give ball to player for testing (opponent starts with ball in defense mechanics)
  await page.evaluate(() => window.__test.giveBallToPlayer());
  await page.waitForTimeout(100);

  // Get initial state - player should be far from hoop
  let state = await page.evaluate(() => window.__test.getState());
  console.log('Initial state:', state);
  expect(state.inDunkRange).toBe(false);
  expect(state.hasBall).toBe(true);

  // Jump (hold space)
  console.log('Jumping...');
  await page.keyboard.down('Space');
  await page.waitForTimeout(350);

  state = await page.evaluate(() => window.__test.getState());
  console.log('While jumping:', state);
  expect(state.onGround).toBe(false); // Should be in air

  // Release to shoot
  console.log('Releasing to shoot...');
  await page.keyboard.up('Space');
  await page.waitForTimeout(100);

  state = await page.evaluate(() => window.__test.getState());
  console.log('After release:', state);
  expect(state.hasBall).toBe(false); // Ball should be released

  console.log('SHOT TEST PASSED!');
});
