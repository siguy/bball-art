import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // Dark background
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // Loading text centered
        this.add.text(width / 2, height / 2, 'LOADING...', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '48px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Transition to MenuScene after 500ms
        this.time.delayedCall(500, () => {
            this.scene.start('MenuScene');
        });
    }
}
