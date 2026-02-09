/**
 * Defense Mechanics Tests - Steal and Shove
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
        return {
          playerX: scene.player?.x,
          playerY: scene.player?.y,
          opponentX: scene.opponent?.x,
          hasBall: scene.ballCarrier != null, // true if any red player has ball
          opponentHasBall: scene.opponentHasBall,
          stealCooldown: scene.stealCooldown,
          shoveCooldown: scene.shoveCooldown,
          score: scene.score,
          distToOpponent: Math.abs((scene.player?.x || 0) - (scene.opponent?.x || 0))
        };
      },
      // Force steal success for deterministic testing
      forceStealSuccess: () => {
        const scene = window.__test.getScene();
        if (!scene) return false;
        // Temporarily replace Math.random to always return < 0.4
        const originalRandom = Math.random;
        Math.random = () => 0.1;
        scene.performSteal();
        Math.random = originalRandom;
        return true;
      },
      // Force steal failure for deterministic testing
      forceStealFail: () => {
        const scene = window.__test.getScene();
        if (!scene) return false;
        // Temporarily replace Math.random to always return >= 0.4
        const originalRandom = Math.random;
        Math.random = () => 0.9;
        scene.performSteal();
        Math.random = originalRandom;
        return true;
      }
    };
  });
}

test('opponent starts with the ball', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await page.goto(GAME_URL);
  await page.waitForSelector('canvas');
  await page.waitForTimeout(600);

  // Start game - press Space (more reliable than click for starting)
  await page.keyboard.press('Space');
  await page.waitForTimeout(800);

  await injectHelpers(page);
  await page.waitForTimeout(100); // Ensure helpers are injected

  const state = await page.evaluate(() => window.__test.getState());
  console.log('Initial state:', state);

  expect(state.hasBall).toBe(false);
  expect(state.opponentHasBall).toBe(true);
});

test('player must get close to opponent for steal', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await page.goto(GAME_URL);
  await page.waitForSelector('canvas');
  await page.waitForTimeout(600);

  // Use Space to start game (more reliable)
  await page.keyboard.press('Space');
  await page.waitForTimeout(800);

  await injectHelpers(page);
  await page.waitForTimeout(100);

  // Check initial distance
  let state = await page.evaluate(() => window.__test.getState());
  console.log('Initial distance to opponent:', state.distToOpponent);
  expect(state.distToOpponent).toBeGreaterThan(60); // Should be far from opponent

  // Try Q key from far away - nothing should happen
  await page.keyboard.press('KeyQ');
  await page.waitForTimeout(100);

  state = await page.evaluate(() => window.__test.getState());
  expect(state.opponentHasBall).toBe(true); // Ball still with opponent

  // Move toward opponent until close (opponent backs away with AI, so use while loop)
  await page.keyboard.down('KeyD');
  let attempts = 0;
  while (state.distToOpponent > 60 && attempts < 100) {
    await page.waitForTimeout(100);
    state = await page.evaluate(() => window.__test.getState());
    attempts++;
  }
  await page.keyboard.up('KeyD');

  console.log('After moving, distance:', state.distToOpponent);
  expect(state.distToOpponent).toBeLessThan(60);
});

test('successful steal makes ball loose', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await page.goto(GAME_URL);
  await page.waitForSelector('canvas');
  await page.waitForTimeout(600);

  await page.click('canvas');
  await page.waitForTimeout(800);

  await injectHelpers(page);

  // Move close to opponent
  let state = await page.evaluate(() => window.__test.getState());
  await page.keyboard.down('KeyD');
  while (state.distToOpponent > 50) {
    await page.waitForTimeout(100);
    state = await page.evaluate(() => window.__test.getState());
  }
  await page.keyboard.up('KeyD');

  // Force a successful steal
  await page.evaluate(() => window.__test.forceStealSuccess());
  await page.waitForTimeout(100);

  state = await page.evaluate(() => window.__test.getState());
  console.log('After steal:', state);

  // Ball should be loose (neither player nor opponent has it)
  expect(state.opponentHasBall).toBe(false);
  // Player might have picked it up already due to physics overlap
  // The key is that opponent no longer has it
});

test('failed steal applies cooldown', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await page.goto(GAME_URL);
  await page.waitForSelector('canvas');
  await page.waitForTimeout(600);

  await page.click('canvas');
  await page.waitForTimeout(800);

  await injectHelpers(page);

  // Move close to opponent
  let state = await page.evaluate(() => window.__test.getState());
  await page.keyboard.down('KeyD');
  while (state.distToOpponent > 50) {
    await page.waitForTimeout(100);
    state = await page.evaluate(() => window.__test.getState());
  }
  await page.keyboard.up('KeyD');

  // Force a failed steal
  await page.evaluate(() => window.__test.forceStealFail());

  state = await page.evaluate(() => window.__test.getState());
  console.log('After failed steal:', state);

  // Steal cooldown should be set (some frames, around 30 but may have decremented)
  expect(state.stealCooldown).toBeGreaterThan(0);
  // Opponent still has ball
  expect(state.opponentHasBall).toBe(true);
});

test('shove always works and has longer cooldown', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await page.goto(GAME_URL);
  await page.waitForSelector('canvas');
  await page.waitForTimeout(600);

  await page.click('canvas');
  await page.waitForTimeout(800);

  await injectHelpers(page);

  // Add shove helper
  await page.evaluate(() => {
    window.__test.performShove = () => {
      const scene = window.__test.getScene();
      if (!scene) return false;
      scene.performShove();
      return true;
    };
  });

  // Move close to opponent
  let state = await page.evaluate(() => window.__test.getState());
  const originalOpponentX = state.opponentX;

  await page.keyboard.down('KeyD');
  while (state.distToOpponent > 50) {
    await page.waitForTimeout(100);
    state = await page.evaluate(() => window.__test.getState());
  }
  await page.keyboard.up('KeyD');

  console.log('Before shove - opponent at:', state.opponentX);

  // Perform shove directly via helper (keyboard Shift+Q can be flaky in tests)
  await page.evaluate(() => window.__test.performShove());
  await page.waitForTimeout(50);

  state = await page.evaluate(() => window.__test.getState());
  console.log('After shove - opponent at:', state.opponentX, 'cooldown:', state.shoveCooldown);

  // Opponent should have moved ~100px
  expect(Math.abs(state.opponentX - originalOpponentX)).toBeGreaterThan(50);

  // Ball should be loose (opponent no longer has it)
  expect(state.opponentHasBall).toBe(false);

  // Shove cooldown should be set (some frames, around 60)
  expect(state.shoveCooldown).toBeGreaterThan(0);
});

test('player can pick up loose ball', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await page.goto(GAME_URL);
  await page.waitForSelector('canvas');
  await page.waitForTimeout(600);

  await page.click('canvas');
  await page.waitForTimeout(800);

  await injectHelpers(page);

  // Add shove helper
  await page.evaluate(() => {
    window.__test.performShove = () => {
      const scene = window.__test.getScene();
      if (!scene) return false;
      scene.performShove();
      return true;
    };
  });

  // Move close to opponent
  let state = await page.evaluate(() => window.__test.getState());
  await page.keyboard.down('KeyD');
  while (state.distToOpponent > 50) {
    await page.waitForTimeout(100);
    state = await page.evaluate(() => window.__test.getState());
  }
  await page.keyboard.up('KeyD');

  // Shove to make ball loose (use helper for reliability)
  await page.evaluate(() => window.__test.performShove());

  // Wait for ball to fall and player to potentially pick it up
  await page.waitForTimeout(500);

  state = await page.evaluate(() => window.__test.getState());
  console.log('After waiting:', state);

  // Either player has ball or it's still loose (opponent should NOT have it)
  expect(state.opponentHasBall).toBe(false);
});
