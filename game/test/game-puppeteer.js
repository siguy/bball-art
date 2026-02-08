/**
 * Puppeteer Test Script for Holy Hoops Game
 *
 * Alternative to Playwright if you prefer Puppeteer.
 *
 * Prerequisites:
 *   npm install puppeteer
 *
 * Run:
 *   node test/game-puppeteer.js
 */

import puppeteer from 'puppeteer';

const GAME_URL = 'http://localhost:5176/';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Inject test helpers into the page
 */
async function injectTestHelpers(page) {
  await page.evaluate(() => {
    window.__gameTest = {
      getActiveScene: () => {
        const game = window.game || document.querySelector('canvas')?.__phaser_game;
        if (!game) return null;
        return game.scene.scenes.find(s => s.scene.isActive());
      },
      getState: () => {
        const scene = window.__gameTest.getActiveScene();
        if (!scene) return null;
        return {
          playerState: scene.playerState ?? null,
          score: scene.score ?? null,
          hasBall: scene.hasBall ?? null,
          playerY: scene.player?.y ?? null
        };
      }
    };
  });
}

async function getGameState(page) {
  return page.evaluate(() => window.__gameTest?.getState() ?? null);
}

async function runTest() {
  console.log('=== Puppeteer Game Test ===\n');

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--window-size=1280,720']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  try {
    // Navigate to game
    console.log('1. Loading game...');
    await page.goto(GAME_URL);
    await page.waitForSelector('canvas', { timeout: 10000 });
    await delay(500);
    console.log('   ✓ Canvas loaded');

    // Start game with Space
    console.log('\n2. Starting game...');
    await page.keyboard.press('Space');
    await delay(500);
    await injectTestHelpers(page);
    console.log('   ✓ Game started');

    // Check initial state
    let state = await getGameState(page);
    console.log('   State:', state);

    // Move right
    console.log('\n3. Moving right...');
    await page.keyboard.down('KeyD');
    await delay(500);
    await page.keyboard.up('KeyD');
    console.log('   ✓ Moved');

    // Jump (hold Space)
    console.log('\n4. Jumping...');
    await page.keyboard.down('Space');
    await delay(350);

    state = await getGameState(page);
    console.log('   State during jump:', state);

    // Release to shoot
    console.log('\n5. Shooting...');
    await page.keyboard.up('Space');
    await delay(100);

    state = await getGameState(page);
    console.log('   State after shot:', state);

    if (state?.hasBall === false) {
      console.log('   ✓ Shot fired!');
    }

    // Wait for result
    await delay(2000);
    state = await getGameState(page);
    console.log('\n6. Final state:', state);

    console.log('\n=== TEST COMPLETE ===\n');
    await delay(3000);

  } finally {
    await browser.close();
  }
}

runTest().catch(console.error);
