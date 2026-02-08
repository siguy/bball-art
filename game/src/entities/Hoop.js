/**
 * Hoop.js - Basketball hoop entity for top-down Phaser game
 *
 * Visual representation includes backboard, rim, and net indication.
 * Contains a scoring zone for detecting when the ball enters.
 *
 * Team 1's hoop is on the RIGHT (facing left)
 * Team 2's hoop is on the LEFT (facing right)
 */

export default class Hoop {
    /**
     * Create a basketball hoop
     * @param {Phaser.Scene} scene - The Phaser scene
     * @param {number} x - X position of the hoop
     * @param {number} y - Y position of the hoop
     * @param {string} facingDirection - 'left' or 'right'
     */
    constructor(scene, x, y, facingDirection) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.facingDirection = facingDirection;

        // Create visual elements container
        this.container = scene.add.container(x, y);

        // Create the hoop components
        this.createBackboard();
        this.createRim();
        this.createNet();
        this.createScoringZone();
    }

    /**
     * Create the backboard rectangle
     * Backboard is positioned behind the rim
     */
    createBackboard() {
        const backboardWidth = 10;
        const backboardHeight = 60;

        // Position backboard offset based on facing direction
        const backboardOffsetX = this.facingDirection === 'left' ? 15 : -15;

        this.backboard = this.scene.add.rectangle(
            backboardOffsetX,
            0,
            backboardWidth,
            backboardHeight,
            0x8b4513 // Brown/wood color
        );
        this.backboard.setStrokeStyle(2, 0x5c2d0a); // Darker brown border

        this.container.add(this.backboard);
    }

    /**
     * Create the rim (orange circle/arc)
     * In top-down view, the rim appears as a circle
     */
    createRim() {
        const rimRadius = 12;

        // Rim is positioned in front of backboard
        const rimOffsetX = this.facingDirection === 'left' ? -5 : 5;

        // Create rim as an arc/circle outline
        this.rim = this.scene.add.circle(
            rimOffsetX,
            0,
            rimRadius
        );
        this.rim.setStrokeStyle(3, 0xff6b35); // Orange rim
        this.rim.setFillStyle(0x000000, 0); // Transparent fill

        this.container.add(this.rim);
    }

    /**
     * Create net indication with small lines below the rim
     * In top-down view, net appears as lines extending from rim
     */
    createNet() {
        const netLines = [];
        const rimOffsetX = this.facingDirection === 'left' ? -5 : 5;
        const netDirection = this.facingDirection === 'left' ? -1 : 1;

        // Create 5 small lines to indicate the net
        for (let i = -2; i <= 2; i++) {
            const startX = rimOffsetX + (i * 4);
            const startY = 0;
            const endX = startX + (netDirection * 8);
            const endY = i * 3;

            const netLine = this.scene.add.line(
                0, 0,
                startX, startY,
                endX, endY,
                0xffffff, // White net
                0.6 // Slightly transparent
            );
            netLine.setLineWidth(1);

            netLines.push(netLine);
            this.container.add(netLine);
        }

        this.netLines = netLines;
    }

    /**
     * Create the scoring zone - a circular physics body for collision detection
     * This is where the ball needs to enter to score
     */
    createScoringZone() {
        const rimOffsetX = this.facingDirection === 'left' ? -5 : 5;
        const zoneX = this.x + rimOffsetX;
        const zoneY = this.y;
        const zoneRadius = 10;

        // Create a circular zone for scoring detection
        this.scoringZone = this.scene.add.circle(
            rimOffsetX,
            0,
            zoneRadius,
            0xff6b35, // Orange, matching rim
            0.2 // Very transparent - just for debug visibility
        );

        this.container.add(this.scoringZone);

        // Add physics body to the scoring zone
        this.scene.physics.add.existing(this.scoringZone, true); // true = static body

        // Set circular body
        this.scoringZone.body.setCircle(zoneRadius);

        // Offset the physics body to match visual position
        this.scoringZone.body.setOffset(-zoneRadius, -zoneRadius);

        // Store world position for external access
        this.scoringZone.worldX = zoneX;
        this.scoringZone.worldY = zoneY;
    }

    /**
     * Get the position of the rim center (for aiming)
     * @returns {{x: number, y: number}} Rim center position
     */
    getRimPosition() {
        const rimOffsetX = this.facingDirection === 'left' ? -5 : 5;
        return {
            x: this.x + rimOffsetX,
            y: this.y
        };
    }

    /**
     * Flash the rim when a shot is made (visual feedback)
     */
    flashOnScore() {
        this.scene.tweens.add({
            targets: this.rim,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 100,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut'
        });

        // Also flash the scoring zone
        this.scene.tweens.add({
            targets: this.scoringZone,
            alpha: 0.8,
            duration: 100,
            yoyo: true,
            repeat: 2
        });
    }

    /**
     * Set visibility of the scoring zone (for debug)
     * @param {boolean} visible - Whether to show the scoring zone
     */
    setDebugVisible(visible) {
        this.scoringZone.setAlpha(visible ? 0.4 : 0.2);
    }

    /**
     * Destroy the hoop and all its components
     */
    destroy() {
        this.container.destroy();
    }
}
