import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // Dark background
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // Title: "HOLY HOOPS" in large gold text
        this.add.text(width / 2, height / 3, 'HOLY HOOPS', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '72px',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Subtitle: "Court & Covenant" in white
        this.add.text(width / 2, height / 3 + 70, 'Court & Covenant', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Flashing "TAP TO START" / "PRESS SPACE" text
        const startText = this.add.text(width / 2, height * 2 / 3, 'TAP TO START\nor\nPRESS SPACE', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '28px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Flash the start text
        this.tweens.add({
            targets: startText,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Listen for space key
        this.input.keyboard.once('keydown-SPACE', () => {
            this.startGame();
        });

        // Listen for pointer/tap
        this.input.once('pointerdown', () => {
            this.startGame();
        });
    }

    startGame() {
        this.scene.start('GameScene');
    }
}
