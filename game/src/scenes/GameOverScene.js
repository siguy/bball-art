import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        // Receive winner and score from GameScene
        this.winner = data.winner || 'Unknown';
        this.score = data.score || { team1: 0, team2: 0 };
    }

    create() {
        const { width, height } = this.cameras.main;

        // Dark background
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // Team colors
        const team1Color = '#e63946';
        const team2Color = '#7b2cbf';

        // Determine winner color
        const winnerColor = this.winner.includes('1') || this.winner.toLowerCase().includes('red')
            ? team1Color
            : team2Color;

        // "GAME OVER" title
        this.add.text(width / 2, height / 4, 'GAME OVER', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '64px',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Winner announcement
        this.add.text(width / 2, height / 2 - 40, `${this.winner.toUpperCase()} WINS!`, {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '48px',
            color: winnerColor,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Final score display
        const scoreText = `${this.score.team1} - ${this.score.team2}`;
        this.add.text(width / 2, height / 2 + 40, scoreText, {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '56px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Team score labels with colors
        this.add.text(width / 2 - 80, height / 2 + 100, 'TEAM 1', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '24px',
            color: team1Color
        }).setOrigin(0.5);

        this.add.text(width / 2 + 80, height / 2 + 100, 'TEAM 2', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '24px',
            color: team2Color
        }).setOrigin(0.5);

        // "PLAY AGAIN" button with flashing effect
        const playAgainText = this.add.text(width / 2, height * 3 / 4, 'PLAY AGAIN', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '36px',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Flash the play again text
        this.tweens.add({
            targets: playAgainText,
            alpha: 0.4,
            duration: 400,
            yoyo: true,
            repeat: -1
        });

        // Instruction text
        this.add.text(width / 2, height * 3 / 4 + 50, 'TAP or PRESS SPACE', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '20px',
            color: '#888888'
        }).setOrigin(0.5);

        // Listen for space key to restart
        this.input.keyboard.once('keydown-SPACE', () => {
            this.restartGame();
        });

        // Listen for pointer/tap to restart
        this.input.once('pointerdown', () => {
            this.restartGame();
        });
    }

    restartGame() {
        this.scene.start('GameScene');
    }
}
