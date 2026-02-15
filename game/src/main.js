/**
 * Court & Covenant: Covenant Jam
 * Main entry point - Phaser game configuration
 */

import Phaser from 'phaser';

import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: {
        activePointers: 3 // Support joystick + 2 buttons simultaneously
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);

// Expose game for testing
window.game = game;

export default game;
