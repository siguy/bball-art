import Phaser from 'phaser';

export default class Ball extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);

    this.scene = scene;
    this.holder = null;
    this.isLoose = true;
    this.isInFlight = false;
    this.targetHoop = null;
    this.flightTime = 0;
    this.flightDuration = 0;
    this.startPos = { x: 0, y: 0 };
    this.peakHeight = 0;

    // Create ball graphics (orange circle)
    this.ballGraphic = scene.add.circle(0, 0, 12, 0xff6b35);
    this.ballGraphic.setStrokeStyle(2, 0x000000);
    this.add(this.ballGraphic);

    // Ball lines (for spin effect)
    this.lines = scene.add.graphics();
    this.lines.lineStyle(2, 0x000000);
    this.lines.moveTo(-8, 0);
    this.lines.lineTo(8, 0);
    this.add(this.lines);

    // Shadow
    this.shadow = scene.add.ellipse(0, 20, 20, 8, 0x000000, 0.3);
    this.add(this.shadow);
    this.sendToBack(this.shadow);

    scene.add.existing(this);

    // Physics for loose ball
    scene.physics.world.enable(this);
    this.body.setCircle(12);
    this.body.setBounce(0.7);
    this.body.setDrag(100);
    this.body.setCollideWorldBounds(true);
  }

  update(time, delta) {
    if (this.holder && !this.isInFlight) {
      // Follow holder
      this.x = this.holder.x + 25;
      this.y = this.holder.y;
      this.body.setVelocity(0, 0);
    } else if (this.isInFlight) {
      // Arc trajectory toward hoop
      this.flightTime += delta;
      const progress = Math.min(this.flightTime / this.flightDuration, 1);

      // Lerp position
      this.x = Phaser.Math.Linear(this.startPos.x, this.targetHoop.x, progress);

      // Parabolic arc for Y
      const arcHeight = Math.sin(progress * Math.PI) * this.peakHeight;
      const baseY = Phaser.Math.Linear(this.startPos.y, this.targetHoop.y, progress);
      this.y = baseY - arcHeight;

      // Scale ball to simulate height
      const scale = 1 + (arcHeight / 200);
      this.setScale(scale);

      // Update shadow position
      this.shadow.y = 20 + arcHeight * 0.3;

      if (progress >= 1) {
        this.isInFlight = false;
        this.setScale(1);
        this.scene.events.emit('shotComplete', this);
      }
    }

    // Rotate ball lines for spin effect
    if (this.isInFlight || (this.isLoose && (Math.abs(this.body.velocity.x) > 10 || Math.abs(this.body.velocity.y) > 10))) {
      this.lines.rotation += 0.2;
    }
  }

  attachTo(player) {
    this.holder = player;
    this.isLoose = false;
    this.isInFlight = false;
    player.pickUpBall();
  }

  shootAt(targetHoop, accuracy) {
    if (!this.holder) return;

    this.holder.dropBall();
    this.holder = null;
    this.isInFlight = true;
    this.isLoose = false;
    this.targetHoop = targetHoop;

    // Calculate flight parameters
    this.startPos = { x: this.x, y: this.y };
    const distance = Phaser.Math.Distance.Between(this.x, this.y, targetHoop.x, targetHoop.y);
    this.flightDuration = 600 + distance * 0.5; // Longer shots take more time
    this.flightTime = 0;
    this.peakHeight = 80 + distance * 0.15; // Higher arc for longer shots

    // Store accuracy for shot resolution
    this.shotAccuracy = accuracy;
  }

  makeLoose(velocityX = 0, velocityY = 0) {
    this.holder = null;
    this.isLoose = true;
    this.isInFlight = false;
    this.body.setVelocity(velocityX, velocityY);
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.holder = null;
    this.isLoose = true;
    this.isInFlight = false;
    this.setScale(1);
    this.body.setVelocity(0, 0);
  }
}
