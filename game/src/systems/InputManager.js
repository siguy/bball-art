/**
 * InputManager - Unified keyboard and touch input system for Phaser
 *
 * Supports:
 * - Keyboard: WASD/Arrows for movement, Space for shoot, Shift for pass, Tab for switch
 * - Touch: Virtual joystick (left), Shoot/Pass buttons (right)
 */

export default class InputManager {
  constructor(scene) {
    this.scene = scene;

    // Input state
    this.movement = { x: 0, y: 0 };
    this.shootPressed = false;
    this.passPressed = false;
    this.switchPressed = false;

    // Track previous frame state for edge detection
    this.prevShoot = false;
    this.prevPass = false;
    this.prevSwitch = false;

    // Touch state
    this.joystickActive = false;
    this.joystickPointer = null;
    this.joystickStart = { x: 0, y: 0 };

    // Joystick configuration
    this.joystickRadius = 100;
    this.joystickX = 150; // Center X of joystick zone
    this.joystickY = scene.scale.height - 150; // Bottom-left area

    // Button configuration
    this.buttonPadding = 30;
    this.shootButtonRadius = 80;
    this.passButtonRadius = 60;

    // Graphics containers
    this.touchGraphics = null;
    this.joystickBase = null;
    this.joystickThumb = null;
    this.shootButton = null;
    this.shootButtonText = null;
    this.passButton = null;
    this.passButtonText = null;

    // Detect if touch is available
    this.isTouchDevice = this.scene.sys.game.device.input.touch;

    this.setupKeyboard();

    if (this.isTouchDevice) {
      this.setupTouch();
    }
  }

  /**
   * Set up keyboard input handlers
   */
  setupKeyboard() {
    const { scene } = this;

    // Movement keys
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = {
      up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };

    // Action keys
    this.shootKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.passKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.switchKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);

    // Prevent Tab from switching browser focus
    scene.input.keyboard.addCapture(Phaser.Input.Keyboard.KeyCodes.TAB);
  }

  /**
   * Set up touch input with virtual joystick and buttons
   */
  setupTouch() {
    const { scene } = this;
    const gameWidth = scene.scale.width;
    const gameHeight = scene.scale.height;

    // Create graphics layer for touch controls (fixed to camera)
    this.touchGraphics = scene.add.container(0, 0);
    this.touchGraphics.setScrollFactor(0);
    this.touchGraphics.setDepth(1000);

    // === Virtual Joystick ===
    // Base circle (outer ring)
    this.joystickBase = scene.add.graphics();
    this.joystickBase.lineStyle(3, 0xffffff, 0.5);
    this.joystickBase.fillStyle(0xffffff, 0.15);
    this.joystickBase.strokeCircle(this.joystickX, this.joystickY, this.joystickRadius);
    this.joystickBase.fillCircle(this.joystickX, this.joystickY, this.joystickRadius);
    this.touchGraphics.add(this.joystickBase);

    // Thumb circle (inner, movable)
    this.joystickThumb = scene.add.graphics();
    this.joystickThumb.fillStyle(0xffffff, 0.6);
    this.joystickThumb.fillCircle(0, 0, 40);
    this.joystickThumb.x = this.joystickX;
    this.joystickThumb.y = this.joystickY;
    this.touchGraphics.add(this.joystickThumb);

    // === Action Buttons ===
    const buttonX = gameWidth - this.buttonPadding - this.shootButtonRadius;
    const shootButtonY = gameHeight - this.buttonPadding - this.shootButtonRadius - this.passButtonRadius * 2 - 20;
    const passButtonY = gameHeight - this.buttonPadding - this.passButtonRadius;

    // Shoot button (large)
    this.shootButton = scene.add.graphics();
    this.shootButton.fillStyle(0xff4444, 0.7);
    this.shootButton.lineStyle(3, 0xffffff, 0.8);
    this.shootButton.fillRoundedRect(
      buttonX - this.shootButtonRadius,
      shootButtonY - this.shootButtonRadius,
      this.shootButtonRadius * 2,
      this.shootButtonRadius * 2,
      20
    );
    this.shootButton.strokeRoundedRect(
      buttonX - this.shootButtonRadius,
      shootButtonY - this.shootButtonRadius,
      this.shootButtonRadius * 2,
      this.shootButtonRadius * 2,
      20
    );
    this.touchGraphics.add(this.shootButton);

    this.shootButtonText = scene.add.text(buttonX, shootButtonY, 'SHOOT', {
      fontSize: '24px',
      fontFamily: 'Arial Black',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.touchGraphics.add(this.shootButtonText);

    // Store button bounds for hit detection
    this.shootButtonBounds = {
      x: buttonX - this.shootButtonRadius,
      y: shootButtonY - this.shootButtonRadius,
      width: this.shootButtonRadius * 2,
      height: this.shootButtonRadius * 2
    };

    // Pass button (smaller)
    this.passButton = scene.add.graphics();
    this.passButton.fillStyle(0x4444ff, 0.7);
    this.passButton.lineStyle(3, 0xffffff, 0.8);
    this.passButton.fillRoundedRect(
      buttonX - this.passButtonRadius,
      passButtonY - this.passButtonRadius,
      this.passButtonRadius * 2,
      this.passButtonRadius * 2,
      15
    );
    this.passButton.strokeRoundedRect(
      buttonX - this.passButtonRadius,
      passButtonY - this.passButtonRadius,
      this.passButtonRadius * 2,
      this.passButtonRadius * 2,
      15
    );
    this.touchGraphics.add(this.passButton);

    this.passButtonText = scene.add.text(buttonX, passButtonY, 'PASS', {
      fontSize: '20px',
      fontFamily: 'Arial Black',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.touchGraphics.add(this.passButtonText);

    // Store button bounds for hit detection
    this.passButtonBounds = {
      x: buttonX - this.passButtonRadius,
      y: passButtonY - this.passButtonRadius,
      width: this.passButtonRadius * 2,
      height: this.passButtonRadius * 2
    };

    // === Touch Event Handlers ===
    scene.input.on('pointerdown', this.onPointerDown, this);
    scene.input.on('pointermove', this.onPointerMove, this);
    scene.input.on('pointerup', this.onPointerUp, this);
  }

  /**
   * Handle touch/pointer down events
   */
  onPointerDown(pointer) {
    const x = pointer.x;
    const y = pointer.y;

    // Check if touching joystick area (left side of screen)
    const distFromJoystick = Phaser.Math.Distance.Between(
      x, y,
      this.joystickX, this.joystickY
    );

    if (distFromJoystick <= this.joystickRadius && !this.joystickActive) {
      this.joystickActive = true;
      this.joystickPointer = pointer;
      this.joystickStart.x = this.joystickX;
      this.joystickStart.y = this.joystickY;
      return;
    }

    // Check if touching shoot button
    if (this.isPointInRect(x, y, this.shootButtonBounds)) {
      this.shootPressed = true;
      this.highlightButton(this.shootButton, 0xff6666);
      return;
    }

    // Check if touching pass button
    if (this.isPointInRect(x, y, this.passButtonBounds)) {
      this.passPressed = true;
      this.highlightButton(this.passButton, 0x6666ff);
      return;
    }
  }

  /**
   * Handle touch/pointer move events
   */
  onPointerMove(pointer) {
    if (this.joystickActive && pointer === this.joystickPointer) {
      const dx = pointer.x - this.joystickStart.x;
      const dy = pointer.y - this.joystickStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Clamp to joystick radius
      const clampedDistance = Math.min(distance, this.joystickRadius);
      const angle = Math.atan2(dy, dx);

      // Update thumb position
      const thumbX = this.joystickStart.x + Math.cos(angle) * clampedDistance;
      const thumbY = this.joystickStart.y + Math.sin(angle) * clampedDistance;
      this.joystickThumb.x = thumbX;
      this.joystickThumb.y = thumbY;

      // Update movement (normalized -1 to 1)
      if (distance > 10) { // Dead zone
        this.movement.x = (clampedDistance / this.joystickRadius) * Math.cos(angle);
        this.movement.y = (clampedDistance / this.joystickRadius) * Math.sin(angle);
      } else {
        this.movement.x = 0;
        this.movement.y = 0;
      }
    }
  }

  /**
   * Handle touch/pointer up events
   */
  onPointerUp(pointer) {
    // Release joystick
    if (this.joystickActive && pointer === this.joystickPointer) {
      this.joystickActive = false;
      this.joystickPointer = null;
      this.movement.x = 0;
      this.movement.y = 0;

      // Reset thumb position
      this.joystickThumb.x = this.joystickX;
      this.joystickThumb.y = this.joystickY;
    }

    // Reset button highlights
    if (this.shootButton) {
      this.resetButton(this.shootButton, 0xff4444, this.shootButtonBounds, 20);
    }
    if (this.passButton) {
      this.resetButton(this.passButton, 0x4444ff, this.passButtonBounds, 15);
    }
  }

  /**
   * Check if a point is inside a rectangle
   */
  isPointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.width &&
           y >= rect.y && y <= rect.y + rect.height;
  }

  /**
   * Highlight a button when pressed
   */
  highlightButton(buttonGraphics, color) {
    buttonGraphics.clear();
    buttonGraphics.fillStyle(color, 0.9);
    buttonGraphics.lineStyle(4, 0xffffff, 1.0);

    if (buttonGraphics === this.shootButton) {
      buttonGraphics.fillRoundedRect(
        this.shootButtonBounds.x, this.shootButtonBounds.y,
        this.shootButtonBounds.width, this.shootButtonBounds.height, 20
      );
      buttonGraphics.strokeRoundedRect(
        this.shootButtonBounds.x, this.shootButtonBounds.y,
        this.shootButtonBounds.width, this.shootButtonBounds.height, 20
      );
    } else {
      buttonGraphics.fillRoundedRect(
        this.passButtonBounds.x, this.passButtonBounds.y,
        this.passButtonBounds.width, this.passButtonBounds.height, 15
      );
      buttonGraphics.strokeRoundedRect(
        this.passButtonBounds.x, this.passButtonBounds.y,
        this.passButtonBounds.width, this.passButtonBounds.height, 15
      );
    }
  }

  /**
   * Reset button to default appearance
   */
  resetButton(buttonGraphics, color, bounds, radius) {
    buttonGraphics.clear();
    buttonGraphics.fillStyle(color, 0.7);
    buttonGraphics.lineStyle(3, 0xffffff, 0.8);
    buttonGraphics.fillRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, radius);
    buttonGraphics.strokeRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, radius);
  }

  /**
   * Call each frame to update input state
   */
  update() {
    // Store previous states for edge detection
    this.prevShoot = this.shootPressed;
    this.prevPass = this.passPressed;
    this.prevSwitch = this.switchPressed;

    // Reset pressed states (will be set again if still pressed)
    this.shootPressed = false;
    this.passPressed = false;
    this.switchPressed = false;

    // Update keyboard movement (only if joystick not active)
    if (!this.joystickActive) {
      this.movement.x = 0;
      this.movement.y = 0;

      // Horizontal
      if (this.cursors.left.isDown || this.wasd.left.isDown) {
        this.movement.x = -1;
      } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
        this.movement.x = 1;
      }

      // Vertical
      if (this.cursors.up.isDown || this.wasd.up.isDown) {
        this.movement.y = -1;
      } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
        this.movement.y = 1;
      }

      // Normalize diagonal movement
      if (this.movement.x !== 0 && this.movement.y !== 0) {
        const length = Math.sqrt(this.movement.x * this.movement.x + this.movement.y * this.movement.y);
        this.movement.x /= length;
        this.movement.y /= length;
      }
    }

    // Update keyboard action states
    if (Phaser.Input.Keyboard.JustDown(this.shootKey)) {
      this.shootPressed = true;
    }
    if (Phaser.Input.Keyboard.JustDown(this.passKey)) {
      this.passPressed = true;
    }
    if (Phaser.Input.Keyboard.JustDown(this.switchKey)) {
      this.switchPressed = true;
    }
  }

  /**
   * Get current movement direction
   * @returns {{x: number, y: number}} Normalized direction (-1 to 1)
   */
  getMovement() {
    return { x: this.movement.x, y: this.movement.y };
  }

  /**
   * Check if shoot was just pressed (edge detection)
   * @returns {boolean} True once per press
   */
  isShootPressed() {
    return this.shootPressed && !this.prevShoot;
  }

  /**
   * Check if pass was just pressed (edge detection)
   * @returns {boolean} True once per press
   */
  isPassPressed() {
    return this.passPressed && !this.prevPass;
  }

  /**
   * Check if switch was just pressed (edge detection)
   * @returns {boolean} True once per press
   */
  isSwitchPressed() {
    return this.switchPressed && !this.prevSwitch;
  }

  /**
   * Manually trigger player switch (for external tap-on-court handling)
   */
  triggerSwitch() {
    this.switchPressed = true;
  }

  /**
   * Show or hide touch controls
   * @param {boolean} visible
   */
  setTouchControlsVisible(visible) {
    if (this.touchGraphics) {
      this.touchGraphics.setVisible(visible);
    }
  }

  /**
   * Clean up all input handlers and graphics
   */
  destroy() {
    // Remove keyboard captures
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.TAB);
    }

    // Remove touch event listeners
    if (this.isTouchDevice) {
      this.scene.input.off('pointerdown', this.onPointerDown, this);
      this.scene.input.off('pointermove', this.onPointerMove, this);
      this.scene.input.off('pointerup', this.onPointerUp, this);
    }

    // Destroy graphics
    if (this.touchGraphics) {
      this.touchGraphics.destroy();
    }

    // Clear references
    this.scene = null;
    this.cursors = null;
    this.wasd = null;
    this.shootKey = null;
    this.passKey = null;
    this.switchKey = null;
  }
}
