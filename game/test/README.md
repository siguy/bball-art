# Holy Hoops Game Testing

Automated browser tests for the Holy Hoops Phaser.js game using Playwright.

## Setup

```bash
# Install dependencies
cd game
npm install

# Install Playwright browsers
npx playwright install chromium
```

## Running Tests

### Playwright Test Runner (Recommended)

```bash
# Headless (CI mode)
npm test

# With browser visible
npm run test:headed

# Debug mode (step through)
npm run test:debug

# Single test file
npx playwright test test/game.spec.js
```

### Standalone Script

```bash
# Playwright version
npm run test:manual

# Or Puppeteer version (requires: npm install puppeteer)
node test/game-puppeteer.js
```

## Test Coverage

The test suite covers:

| Test | Description |
|------|-------------|
| Game loads | Canvas renders, menu appears |
| Press Space starts game | Transitions from MenuScene to GameScene |
| Move right (D key) | Player X position increases |
| Move left (A key) | Player X position decreases |
| Hold Space to jump | Player state changes, Y position decreases |
| Release Space to shoot | Ball is released, has velocity toward hoop |
| Full shot sequence | Move, jump, shoot workflow |
| Multiple shots | Automated scoring attempts |

## How It Works

### Keyboard Input Simulation

Playwright provides `keyboard.down()` and `keyboard.up()` for holding keys:

```javascript
// Hold Space to jump
await page.keyboard.down('Space');
await page.waitForTimeout(350);

// Release Space to shoot
await page.keyboard.up('Space');
```

### Reading Game State

We inject helper functions that access Phaser's internal state:

```javascript
await page.evaluate(() => {
  window.__gameTest = {
    getActiveScene: () => {
      const game = window.game;
      return game.scene.scenes.find(s => s.scene.isActive());
    },
    getPlayerState: () => window.__gameTest.getActiveScene()?.playerState,
    // ...
  };
});

// Then read state from test
const state = await page.evaluate(() => ({
  playerState: window.__gameTest.getPlayerState(),
  hasBall: window.__gameTest.getActiveScene()?.hasBall
}));
```

### Key Methods

| Method | Use |
|--------|-----|
| `page.keyboard.press('Space')` | Quick press and release |
| `page.keyboard.down('KeyD')` | Hold key down |
| `page.keyboard.up('KeyD')` | Release held key |
| `page.keyboard.type('text')` | Type text with keydown/up events |

## Troubleshooting

### Game Not Responding to Input

1. Ensure the game canvas has focus
2. Try clicking the canvas first: `await page.click('canvas')`
3. Check that the correct scene is active

### Flaky Tests

- Increase timeouts for game state transitions
- Use `waitForTimeout` instead of fixed delays when possible
- Game physics can introduce randomness in shot outcomes

### Headless vs Headed

Some Phaser features may behave differently in headless mode. If tests pass headed but fail headless:

```javascript
// Force headed mode
const browser = await chromium.launch({ headless: false });
```

## Files

```
test/
├── README.md           # This file
├── game.spec.js        # Playwright test runner specs
├── game-test.js        # Standalone Playwright script
└── game-puppeteer.js   # Alternative Puppeteer version
```
