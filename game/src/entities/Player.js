import Phaser from 'phaser';

export default class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y, config, team, isAI = false) {
    super(scene, x, y);

    this.scene = scene;
    this.config = config;
    this.team = team;
    this.isAI = isAI;
    this.hasBall = false;
    this.isActive = false;
    this.shootCooldown = 0;
    this.speed = config.speed;
    this.shootAccuracy = config.shootAccuracy;
    this.wantsToShoot = false; // Flag for AI shooting intent

    // Create player body (colored rectangle)
    this.body_sprite = scene.add.rectangle(0, 0, 40, 50, team.color);
    this.body_sprite.setStrokeStyle(2, 0xffffff);
    this.add(this.body_sprite);

    // Create name label
    this.nameLabel = scene.add.text(0, -35, config.name, {
      fontSize: '12px',
      fontFamily: 'Arial Black',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.add(this.nameLabel);

    // Active player indicator
    this.activeIndicator = scene.add.triangle(0, 35, -8, 0, 8, 0, 0, 10, 0xffff00);
    this.activeIndicator.setVisible(false);
    this.add(this.activeIndicator);

    // Add to scene
    scene.add.existing(this);

    // Enable physics
    scene.physics.world.enable(this);
    this.body.setSize(40, 50);
    this.body.setCollideWorldBounds(true);
    this.body.setBounce(0.1);
    this.body.setDrag(800);
  }

  setActive(active) {
    this.isActive = active;
    this.activeIndicator.setVisible(active);
    if (active) {
      this.body_sprite.setStrokeStyle(3, 0xffff00);
    } else {
      this.body_sprite.setStrokeStyle(2, 0xffffff);
    }
  }

  move(dirX, dirY) {
    const speed = this.speed;
    this.body.setVelocity(dirX * speed, dirY * speed);
  }

  // Direct velocity control (used by AI)
  setVelocity(vx, vy) {
    this.body.setVelocity(vx, vy);
  }

  stop() {
    this.body.setVelocity(0, 0);
  }

  update(time, delta) {
    if (this.shootCooldown > 0) {
      this.shootCooldown -= delta;
    }
  }

  canShoot() {
    return this.hasBall && this.shootCooldown <= 0;
  }

  shoot() {
    if (!this.canShoot()) return false;
    this.shootCooldown = 500; // 500ms cooldown
    this.wantsToShoot = true; // Signal intent (GameScene handles actual shot)
    return true;
  }

  pickUpBall() {
    this.hasBall = true;
  }

  dropBall() {
    this.hasBall = false;
  }
}
