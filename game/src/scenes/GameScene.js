import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // === WORLD + CAMERA SETUP ===
    // World is wider than viewport, camera scrolls to follow action
    // Right basket at x=1270, allow 200px behind it
    const worldWidth = 1470;
    const worldHeight = 720;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // Court floor (full world width)
    this.floor = this.add.rectangle(worldWidth / 2, 670, worldWidth, 100, 0x8B4513);
    this.physics.add.existing(this.floor, true);

    // Player 1 (red)
    this.player = this.add.rectangle(200, 500, 40, 60, 0xff0000);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);

    // Player 2 / Teammate (red, at x=350)
    this.teammate = this.add.rectangle(350, 500, 40, 60, 0xff0000);
    this.physics.add.existing(this.teammate);
    this.teammate.body.setCollideWorldBounds(true);

    // Players array and active player tracking
    this.players = [this.player, this.teammate];
    this.activePlayerIndex = 0;

    // Yellow outline graphics for active player
    this.activeOutline = this.add.graphics();
    this.activeOutline.lineStyle(3, 0xffff00, 1);

    // Opponents (purple team)
    this.opponent = this.add.rectangle(700, 500, 40, 60, 0x800080);
    this.physics.add.existing(this.opponent);
    this.opponent.body.setCollideWorldBounds(true);

    this.opponent2 = this.add.rectangle(500, 500, 40, 60, 0x800080);
    this.physics.add.existing(this.opponent2);
    this.opponent2.body.setCollideWorldBounds(true);

    // Array for easy iteration
    this.opponents = [this.opponent, this.opponent2];

    // AI state for each opponent: 'CHASE_BALL', 'ATTACK', 'DEFEND'
    this.opponent.aiState = 'ATTACK'; // Starts with ball
    this.opponent2.aiState = 'DEFEND';

    // Assign each opponent a defensive target (one per red player)
    this.opponent.defendTarget = this.player;
    this.opponent2.defendTarget = this.teammate;

    // Per-entity state (stun, cooldown, turbo)
    const allEntities = [...this.players, ...this.opponents];
    for (const entity of allEntities) {
      entity.stunTimer = 0;       // Frames where entity cannot act
      entity.pickupCooldown = 0;  // Per-entity ball pickup cooldown
      entity.turboMeter = 100;    // Turbo fuel (0-100)
      entity.turboActive = false; // Whether turbo is currently firing
    }

    // Turbo meter visual bars (drawn per-frame in update)
    this.turboGraphics = this.add.graphics();

    // AI-specific per-opponent state
    this.opponent.aiStealCooldown = 0;
    this.opponent2.aiStealCooldown = 0;
    this.opponent.aiSwayTimer = 0;
    this.opponent2.aiSwayTimer = Math.PI; // Offset so they don't sync

    // Reset all input when tab loses focus (prevents stuck keys)
    this.game.events.on('blur', () => {
      this.input.keyboard.resetKeys();
      const activePlayer = this.players[this.activePlayerIndex];
      if (activePlayer.body) activePlayer.body.setVelocityX(0);
    });

    // Movement keys
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // Tab key for switching players
    this.tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);

    // E key for passing
    this.passKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Space key
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Defense keys
    this.qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    // Debug toggle key (I)
    this.debugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    // Simple state
    this.isDunking = false;
    this.dunkingPlayer = null; // Which player is currently dunking
    this.wasInAir = false; // Track if player has left the ground during dunk
    this.jumpedThisPress = true; // Start true to ignore space held from menu
    this.ballPickupCooldown = 0; // Frames before ball can be picked up
    this.ballEnteredHoop = false; // Track two-zone scoring (right hoop)
    this.ballEnteredLeftHoop = false; // Track two-zone scoring (left hoop)
    this.scoringInProgress = false; // Prevents camera from following ball during net animation

    // === BALL STATE MACHINE ===
    // Single source of truth for ball ownership (replaces scattered booleans)
    // States: 'CARRIED' (someone has it), 'IN_FLIGHT' (shot/pass), 'LOOSE' (free ball)
    this.ballState = 'CARRIED';
    this.ballOwner = this.opponent; // Opponent starts with ball
    this.lastThrower = null; // Who last shot/passed (for cooldown logic)

    // Defense state
    this.stealCooldown = 0; // Frames before steal can be attempted again
    this.shoveCooldown = 0; // Frames before shove can be used again
    this.stealKeyPressed = false; // Track steal key state to prevent repeat triggers

    // AI control
    this.aiPaused = false; // Set true to pause AI actions (for testing)
    this.aiDunkingOpponent = null; // Track AI opponent currently dunking

    // Dribbling state
    this.dribbleTime = 0; // Counter for dribble animation
    this.lastBallSide = 25; // Track which side ball was on (25 = right, -25 = left)

    // Collisions
    this.physics.add.collider(this.player, this.floor);
    this.physics.add.collider(this.teammate, this.floor);
    this.physics.add.collider(this.opponent, this.floor);
    this.physics.add.collider(this.opponent2, this.floor);

    // Ball
    this.ball = this.add.circle(0, 0, 12, 0xffa500);
    this.physics.add.existing(this.ball);
    this.ball.body.setCircle(12);
    this.ball.body.setBounce(0.6);
    this.ball.body.setDrag(0, 0); // Drag applied dynamically — only on LOOSE balls
    this.ball.body.setCollideWorldBounds(true);
    this.ball.body.setAllowGravity(false);

    this.physics.add.collider(this.ball, this.floor);

    // === RIGHT HOOP WITH PHYSICS ===

    // Backboard - physics body, ball bounces off
    this.backboard = this.add.rectangle(1300, 300, 10, 80, 0x8b4513);
    this.physics.add.existing(this.backboard, true);
    this.physics.add.collider(this.ball, this.backboard);

    // Rim visual (center bar)
    this.rim = this.add.rectangle(1270, 340, 50, 8, 0xff6600);

    // Rim edges - 50px opening
    this.rimLeft = this.add.rectangle(1245, 340, 8, 8, 0xff6600);
    this.rimRight = this.add.rectangle(1295, 340, 8, 8, 0xff6600);
    this.physics.add.existing(this.rimLeft, true);
    this.physics.add.existing(this.rimRight, true);
    this.physics.add.collider(this.ball, this.rimLeft);
    this.physics.add.collider(this.ball, this.rimRight);

    // Net (right hoop) - white mesh below rim
    this.rightNet = this.add.graphics();
    this.rightNet.lineStyle(2, 0xffffff, 0.8);
    // Trapezoid outline
    this.rightNet.beginPath();
    this.rightNet.moveTo(1245, 344);  // Top left
    this.rightNet.lineTo(1255, 384);  // Bottom left
    this.rightNet.lineTo(1285, 384);  // Bottom right
    this.rightNet.lineTo(1295, 344);  // Top right
    this.rightNet.strokePath();
    // Vertical net lines
    for (let i = 1; i <= 4; i++) {
      const topX = 1245 + i * 10;
      const bottomX = 1255 + i * 6;
      this.rightNet.lineBetween(topX, 344, bottomX, 384);
    }
    // Horizontal net lines
    this.rightNet.lineBetween(1248, 358, 1292, 358);
    this.rightNet.lineBetween(1252, 372, 1288, 372);

    // === RIGHT HOOP (player scores here) ===
    // Two-zone scoring system - 40px zones (invisible)
    // Entry zone: above the rim (ball enters from above)
    this.scoreEntry = this.add.rectangle(1270, 325, 40, 20, 0x90ee90, 0);
    this.physics.add.existing(this.scoreEntry, true);

    // Exit zone: below the rim (ball exits downward)
    this.scoreExit = this.add.rectangle(1270, 360, 40, 20, 0x90ee90, 0);
    this.physics.add.existing(this.scoreExit, true);

    // Entry zone overlap - mark that ball entered from above
    this.physics.add.overlap(this.ball, this.scoreEntry, () => {
      if (this.ball.body.velocity.y > 0 && this.ballState !== 'CARRIED' && !this.isDunking) {
        this.ballEnteredHoop = true;
      }
    });

    // Exit zone overlap - score if ball came through entry first
    this.physics.add.overlap(this.ball, this.scoreExit, () => {
      if (this.ballEnteredHoop && this.ball.body.velocity.y > 0) {
        this.onScore();
        this.ballEnteredHoop = false;
      }
    });

    // === LEFT HOOP (opponent scores here) ===
    // Backboard - physics body, ball bounces off
    this.leftBackboard = this.add.rectangle(180, 300, 10, 80, 0x8b4513);
    this.physics.add.existing(this.leftBackboard, true);
    this.physics.add.collider(this.ball, this.leftBackboard);

    // Rim visual (center bar)
    this.leftRim = this.add.rectangle(210, 340, 50, 8, 0xff6600);

    // Rim edges - 50px opening
    this.leftRimLeft = this.add.rectangle(185, 340, 8, 8, 0xff6600);
    this.leftRimRight = this.add.rectangle(235, 340, 8, 8, 0xff6600);
    this.physics.add.existing(this.leftRimLeft, true);
    this.physics.add.existing(this.leftRimRight, true);
    this.physics.add.collider(this.ball, this.leftRimLeft);
    this.physics.add.collider(this.ball, this.leftRimRight);

    // Net (left hoop) - white mesh below rim
    this.leftNet = this.add.graphics();
    this.leftNet.lineStyle(2, 0xffffff, 0.8);
    // Trapezoid outline
    this.leftNet.beginPath();
    this.leftNet.moveTo(185, 344);   // Top left
    this.leftNet.lineTo(195, 384);   // Bottom left
    this.leftNet.lineTo(225, 384);   // Bottom right
    this.leftNet.lineTo(235, 344);   // Top right
    this.leftNet.strokePath();
    // Vertical net lines
    for (let i = 1; i <= 4; i++) {
      const topX = 185 + i * 10;
      const bottomX = 195 + i * 6;
      this.leftNet.lineBetween(topX, 344, bottomX, 384);
    }
    // Horizontal net lines
    this.leftNet.lineBetween(188, 358, 232, 358);
    this.leftNet.lineBetween(192, 372, 228, 372);

    // Two-zone scoring system for left hoop (invisible)
    this.leftScoreEntry = this.add.rectangle(210, 325, 40, 20, 0xee90ee, 0);
    this.physics.add.existing(this.leftScoreEntry, true);

    this.leftScoreExit = this.add.rectangle(210, 360, 40, 20, 0xee90ee, 0);
    this.physics.add.existing(this.leftScoreExit, true);

    // Entry zone overlap for left hoop
    this.physics.add.overlap(this.ball, this.leftScoreEntry, () => {
      if (this.ball.body.velocity.y > 0 && this.ballState !== 'CARRIED' && !this.isDunking) {
        this.ballEnteredLeftHoop = true;
      }
    });

    // Exit zone overlap for left hoop - opponent scores
    this.physics.add.overlap(this.ball, this.leftScoreExit, () => {
      if (this.ballEnteredLeftHoop && this.ball.body.velocity.y > 0) {
        this.onOpponentScore();
        this.ballEnteredLeftHoop = false;
      }
    });

    // Ball pickup - all entities use unified pickupBall()
    this.physics.add.overlap(this.player, this.ball, () => this.pickupBall(this.player), null, this);
    this.physics.add.overlap(this.teammate, this.ball, () => this.pickupBall(this.teammate), null, this);
    this.physics.add.overlap(this.opponent, this.ball, () => this.pickupBall(this.opponent), null, this);
    this.physics.add.overlap(this.opponent2, this.ball, () => this.pickupBall(this.opponent2), null, this);

    // Score (fixed to screen)
    this.score = 0;
    this.opponentScore = 0;
    this.scoreText = this.add.text(20, 20, 'RED: 0', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 4
    }).setScrollFactor(0);

    this.opponentScoreText = this.add.text(1260, 20, 'PURPLE: 0', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#cc66ff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(1, 0).setScrollFactor(0);

    // Controls hint (fixed to screen, centered between scores at top)
    this.add.text(640, 28, 'WASD = Move | SPACE = Jump/Shoot | SHIFT = Turbo | TAB = Switch | E = Pass | DOWN = Steal', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0);

    // Debug (hidden by default, toggle with backtick key)
    this.debugMode = false;
    this.debugText = this.add.text(20, 60, '', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#aaaaaa'
    });
    this.debugText.setVisible(false);
    this.debugText.setScrollFactor(0); // Keep debug text fixed on screen

    // === CAMERA FOLLOW SETUP ===
    // Start following the active player with smooth lerp
    this.cameraTarget = this.players[this.activePlayerIndex];
    this.cameras.main.startFollow(this.cameraTarget, true, 0.08, 0.08);
  }

  // Unified ball pickup — works for any entity (player or opponent)
  pickupBall(entity) {
    if (this.ballState === 'CARRIED' || this.isDunking || this.ballPickupCooldown > 0) {
      return;
    }
    // Per-entity checks: stunned or on cooldown
    if (entity.stunTimer > 0 || entity.pickupCooldown > 0) {
      return;
    }
    this.ballState = 'CARRIED';
    this.ballOwner = entity;
    this.ball.body.setVelocity(0, 0);
    this.ball.body.setAllowGravity(false);
    this.ball.body.setDrag(0, 0); // Clear drag when carried
    this.ballEnteredHoop = false;
    this.ballEnteredLeftHoop = false;
  }

  onScore() {
    // Prevent double-scoring (called from exit zone overlap)
    if (this.ballState === 'CARRIED' || this.isDunking) return;

    this.score += 2;
    this.scoreText.setText('RED: ' + this.score);

    const scorePopup = this.add.text(640, 300, 'SCORE!', {
      fontSize: '72px',
      fontFamily: 'Arial',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0);

    this.tweens.add({
      targets: scorePopup,
      alpha: 0,
      y: 250,
      duration: 1000,
      onComplete: () => scorePopup.destroy()
    });

    // Reset ball entry state
    this.ballEnteredHoop = false;

    // Let ball fall through net for 0.5s, then give possession
    this.ball.body.setAllowGravity(true);
    this.ballPickupCooldown = 60;
    this.scoringInProgress = true;

    this.time.delayedCall(500, () => {
      // Opponent takes ball out behind the basket where they were scored on (right side)
      this.opponent.x = 1380;
      this.ballState = 'CARRIED';
      this.ballOwner = this.opponent;
      this.ball.body.setVelocity(0, 0);
      this.ball.body.setAllowGravity(false);
      this.scoringInProgress = false;
    });
  }

  onOpponentScore() {
    // Prevent double-scoring
    if (this.ballState === 'CARRIED' || this.isDunking) return;

    this.opponentScore += 2;
    this.opponentScoreText.setText('PURPLE: ' + this.opponentScore);

    const scorePopup = this.add.text(640, 300, 'OPPONENT SCORES!', {
      fontSize: '56px',
      fontFamily: 'Arial',
      color: '#cc66ff',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0);

    this.tweens.add({
      targets: scorePopup,
      alpha: 0,
      y: 250,
      duration: 1000,
      onComplete: () => scorePopup.destroy()
    });

    // Reset ball entry state
    this.ballEnteredLeftHoop = false;

    // Let ball fall through net for 0.5s, then give possession
    this.ball.body.setAllowGravity(true);
    this.ballPickupCooldown = 60;
    this.scoringInProgress = true;

    this.time.delayedCall(500, () => {
      const activePlayer = this.players[this.activePlayerIndex];
      activePlayer.x = 100;
      this.ballState = 'CARRIED';
      this.ballOwner = activePlayer;
      this.ball.body.setVelocity(0, 0);
      this.ball.body.setAllowGravity(false);
      this.scoringInProgress = false;
    });
  }

  update() {
    // Debug toggle (I key)
    if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
      this.debugMode = !this.debugMode;
      this.debugText.setVisible(this.debugMode);
      // Also show/hide scoring zones for debugging (both hoops)
      this.scoreEntry.setAlpha(this.debugMode ? 0.3 : 0);
      this.scoreExit.setAlpha(this.debugMode ? 0.3 : 0);
      this.leftScoreEntry.setAlpha(this.debugMode ? 0.3 : 0);
      this.leftScoreExit.setAlpha(this.debugMode ? 0.3 : 0);
    }

    // Tab key switches active player
    if (Phaser.Input.Keyboard.JustDown(this.tabKey)) {
      // Stop the current player before switching
      const currentPlayer = this.players[this.activePlayerIndex];
      if (currentPlayer.body.blocked.down) {
        currentPlayer.body.setVelocityX(0);
      }
      this.activePlayerIndex = (this.activePlayerIndex + 1) % 2;
    }

    // Get active player
    const activePlayer = this.players[this.activePlayerIndex];
    const onGround = activePlayer.body.blocked.down;
    const speed = activePlayer.turboActive ? 375 : 250;
    const isStunned = activePlayer.stunTimer > 0;

    // Check dunk range (can dunk from 200px before hoop to 50px past it)
    const distToHoop = 1270 - activePlayer.x;
    const inDunkRange = distToHoop > -50 && distToHoop < 200;

    // Helper: does this player have the ball?
    const activeHasBall = this.ballOwner === activePlayer;

    // Visual feedback for BOTH players
    for (const p of this.players) {
      const playerHasBall = this.ballOwner === p;
      const pDistToHoop = 1270 - p.x;
      const pInDunkRange = pDistToHoop > -50 && pDistToHoop < 200;
      const pOnGround = p.body.blocked.down;

      if (pInDunkRange && playerHasBall && pOnGround) {
        p.setFillStyle(0xffd700); // Gold = ready to dunk!
      } else if (playerHasBall) {
        p.setFillStyle(0xff0000); // Red = has ball
      } else {
        p.setFillStyle(0x880000); // Dark red = no ball
      }
    }

    // Draw yellow outline on active player
    this.activeOutline.clear();
    this.activeOutline.lineStyle(3, 0xffff00, 1);
    this.activeOutline.strokeRect(
      activePlayer.x - 22,
      activePlayer.y - 32,
      44,
      64
    );

    // === CAMERA TARGET: follow ball carrier, or active player if no one has ball ===
    let newTarget;
    if (this.ballState === 'CARRIED' && this.players.includes(this.ballOwner)) {
      newTarget = this.ballOwner;
    } else if (this.ballState !== 'CARRIED' && !this.scoringInProgress) {
      // Ball is loose/in-flight - follow the ball (but not during scoring animation)
      newTarget = this.ball;
    } else {
      newTarget = activePlayer;
    }

    if (newTarget !== this.cameraTarget) {
      this.cameraTarget = newTarget;
      this.cameras.main.startFollow(this.cameraTarget, true, 0.08, 0.08);
    }

    // === KEEP ENTITIES ON SCREEN ===
    const camera = this.cameras.main;
    const camLeft = camera.scrollX;
    const camRight = camera.scrollX + camera.width;
    const margin = 60; // Keep entities at least 60px from camera edge

    // Inactive teammate: stop if on screen, move if off screen
    const inactivePlayer = this.players[(this.activePlayerIndex + 1) % 2];
    const inactiveOnGround = inactivePlayer.body.blocked.down;
    if (inactiveOnGround && (!this.isDunking || this.dunkingPlayer !== inactivePlayer)) {
      if (inactivePlayer.x < camLeft + margin) {
        inactivePlayer.body.setVelocityX(200);
      } else if (inactivePlayer.x > camRight - margin) {
        inactivePlayer.body.setVelocityX(-200);
      } else {
        inactivePlayer.body.setVelocityX(0);
      }
    }

    // Note: Opponents now controlled by AI in updateAI() - no clamping needed

    // === DEFENSE (steal and shove) ===
    // Check distance to opponent who has the ball
    const opponentHasBall = this.ballState === 'CARRIED' && this.opponents.includes(this.ballOwner);
    const ballCarrierOpp = opponentHasBall ? this.ballOwner : null;
    const distToOpponent = ballCarrierOpp ? Math.abs(activePlayer.x - ballCarrierOpp.x) : 999;
    const closeToOpponent = distToOpponent < 70;

    // Decrement cooldowns
    if (this.stealCooldown > 0) this.stealCooldown--;
    if (this.shoveCooldown > 0) this.shoveCooldown--;

    // Steal/Shove key: Down Arrow (only trigger once per press)
    const stealKeyDown = this.cursors.down.isDown;
    if (stealKeyDown && !this.stealKeyPressed && !isStunned) {
      this.stealKeyPressed = true;

      if (closeToOpponent && opponentHasBall) {
        if (activePlayer.turboActive && this.shoveCooldown <= 0) {
          // SHOVE: Turbo+Down - always works, knocks opponent back
          this.performShove();
        } else if (!activePlayer.turboActive && this.stealCooldown <= 0) {
          // STEAL: Down alone (no turbo) - 30% chance
          this.performSteal();
        }
      }
    }

    // Reset steal key flag when released
    if (!stealKeyDown) {
      this.stealKeyPressed = false;
    }

    // Debug display - show all relevant state
    let ballStatus;
    if (this.ballState === 'CARRIED') {
      if (this.ballOwner === this.player) ballStatus = 'P1';
      else if (this.ballOwner === this.teammate) ballStatus = 'P2';
      else ballStatus = 'O';
    } else {
      ballStatus = this.ballState === 'IN_FLIGHT' ? 'F' : 'L';
    }
    const ai1 = this.opponent.aiState ? this.opponent.aiState[0] : '?'; // First letter
    const ai2 = this.opponent2.aiState ? this.opponent2.aiState[0] : '?';
    const stunP = activePlayer.stunTimer > 0 ? ` STUN:${activePlayer.stunTimer}` : '';
    const cdP = activePlayer.pickupCooldown > 0 ? ` CD:${activePlayer.pickupCooldown}` : '';
    this.debugText.setText(
      `Ball: ${ballStatus} | AI: ${ai1}/${ai2} | ` +
      `DistOpp: ${Math.round(distToOpponent)} | StealCD: ${this.stealCooldown} | ShoveCD: ${this.shoveCooldown}${stunP}${cdP}`
    );

    // === PASS (E key) ===
    if (Phaser.Input.Keyboard.JustDown(this.passKey) && activeHasBall && !isStunned) {
      this.passBall(activePlayer);
    }

    // === JUMP (only when on ground, only once per press) ===
    if (this.spaceKey.isDown && onGround && !this.jumpedThisPress && !isStunned) {
      this.jumpedThisPress = true; // Prevent multiple jumps
      const isTurbo = activePlayer.turboActive;
      if (inDunkRange && activeHasBall && isTurbo) {
        // DUNK - requires turbo! Boosted jump toward hoop
        activePlayer.body.setVelocityY(-700);
        this.performDunk(activePlayer);
      } else {
        // Normal or turbo jump (turbo = higher)
        activePlayer.body.setVelocityY(isTurbo ? -700 : -550);
        this.isDunking = false;
      }
    }

    // Reset jump flag when space is released
    if (!this.spaceKey.isDown) {
      this.jumpedThisPress = false;
    }

    // === SHOOT (release in air, not dunking) ===
    if (Phaser.Input.Keyboard.JustUp(this.spaceKey) && !onGround && activeHasBall && !this.isDunking && !isStunned) {
      this.shootBall(activePlayer);
    }

    // === MOVEMENT (skip if stunned — stun tick handles stopping) ===
    if (isStunned) {
      // No movement while stunned
    } else if (this.isDunking && this.dunkingPlayer === activePlayer) {
      // During dunk: allow slight adjustments but don't fully override
      const currentVelX = activePlayer.body.velocity.x;
      if (this.cursors.left.isDown || this.wasd.left.isDown) {
        activePlayer.body.setVelocityX(currentVelX - 5); // Slight left adjustment
      } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
        activePlayer.body.setVelocityX(currentVelX + 5); // Slight right adjustment
      }
    } else if (!this.isDunking || this.dunkingPlayer !== activePlayer) {
      // Normal movement (only if active player is not dunking)
      if (this.cursors.left.isDown || this.wasd.left.isDown) {
        activePlayer.body.setVelocityX(-speed);
      } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
        activePlayer.body.setVelocityX(speed);
      } else if (onGround) {
        // Only stop when on ground (preserve air momentum)
        activePlayer.body.setVelocityX(0);
      }
    }

    // Ball follows AI dunker during dunk
    if (this.aiDunkingOpponent) {
      this.ball.x = this.aiDunkingOpponent.x;
      this.ball.y = this.aiDunkingOpponent.y - 20;
      this.ball.body.setVelocity(0, 0);
      this.ball.body.setAllowGravity(false);
    }

    // Ball follows carrier with dribble animation (unified for all entities)
    if (this.ballState === 'CARRIED' && this.ballOwner && !this.aiDunkingOpponent) {
      const carrier = this.ballOwner;
      const carrierOnGround = carrier.body.blocked.down;
      const isMoving = Math.abs(carrier.body.velocity.x) > 10;

      if (isMoving) {
        this.lastBallSide = carrier.body.velocity.x > 0 ? 25 : -25;
      }
      const targetX = carrier.x + this.lastBallSide;

      const isPlayerDunking = this.isDunking && this.players.includes(carrier);
      if (carrierOnGround && isMoving && !isPlayerDunking) {
        // Dribbling: ball bounces to floor and back (1 bounce/sec at 60fps)
        this.dribbleTime += 0.105;
        const dribbleBounce = Math.abs(Math.sin(this.dribbleTime)) * 40;
        this.ball.x = this.ball.x + (targetX - this.ball.x) * 0.8;
        this.ball.y = carrier.y - 5 + dribbleBounce;
      } else {
        // Not dribbling: ball follows carrier directly
        this.ball.x = this.ball.x + (targetX - this.ball.x) * 0.3;
        this.ball.y = carrier.y - 20;
        this.dribbleTime = 0;
      }
    }

    // Decrement per-entity stun timers and pickup cooldowns
    const allEntities = [...this.players, ...this.opponents];
    for (const entity of allEntities) {
      if (entity.stunTimer > 0) {
        entity.stunTimer--;
        // Stun visual: flash entity visibility every 4 frames
        entity.setAlpha(Math.floor(entity.stunTimer / 4) % 2 === 0 ? 0.3 : 1.0);
        // Stunned entities can't move
        if (entity.body.blocked.down) {
          entity.body.setVelocityX(0);
        }
      } else {
        entity.setAlpha(1.0);
      }
      if (entity.pickupCooldown > 0) entity.pickupCooldown--;
    }

    // === TURBO SYSTEM ===
    // Player turbo: hold Shift to activate
    const turboHeld = this.shiftKey.isDown;
    for (const p of this.players) {
      if (p === activePlayer && turboHeld && p.turboMeter > 0 && !isStunned) {
        p.turboActive = true;
        p.turboMeter = Math.max(0, p.turboMeter - 0.5);
      } else {
        p.turboActive = false;
        p.turboMeter = Math.min(100, p.turboMeter + 0.3);
      }
    }

    // AI turbo: burst when attacking/chasing, save on defense
    for (const opp of this.opponents) {
      if (opp.stunTimer > 0) { opp.turboActive = false; continue; }
      const shouldTurbo = (opp.aiState === 'ATTACK' || opp.aiState === 'CHASE_BALL') && opp.turboMeter > 30;
      if (shouldTurbo) {
        opp.turboActive = true;
        opp.turboMeter = Math.max(0, opp.turboMeter - 0.5);
      } else {
        opp.turboActive = false;
        opp.turboMeter = Math.min(100, opp.turboMeter + 0.3);
      }
    }

    // Draw turbo meter bars under each entity
    this.turboGraphics.clear();
    for (const entity of allEntities) {
      const barWidth = 30;
      const barHeight = 4;
      const x = entity.x - barWidth / 2;
      const y = entity.y + 35; // Below the entity
      // Background
      this.turboGraphics.fillStyle(0x333333, 0.8);
      this.turboGraphics.fillRect(x, y, barWidth, barHeight);
      // Fill (yellow when active, white when charging)
      const fillColor = entity.turboActive ? 0xffff00 : 0xaaaaaa;
      this.turboGraphics.fillStyle(fillColor, 1);
      this.turboGraphics.fillRect(x, y, barWidth * (entity.turboMeter / 100), barHeight);
    }

    // === BLOCK DETECTION ===
    // Any entity in the air near an IN_FLIGHT ball can block it
    if (this.ballState === 'IN_FLIGHT' && !this.isDunking) {
      this.checkForBlocks();
    }

    // Decrement global ball pickup cooldown (for scoring animations)
    if (this.ballPickupCooldown > 0) {
      this.ballPickupCooldown--;
    }

    // Check if dunking player reached the hoop during a dunk
    if (this.isDunking && this.dunkingPlayer) {
      if (this.aiDunkingOpponent === this.dunkingPlayer) {
        // AI dunk — target left hoop (rim at x=210)
        const distFromRim = Math.abs(this.dunkingPlayer.x - 230);
        const nearRimX = distFromRim < 50;
        const atRimHeight = this.dunkingPlayer.y < 400;
        if (nearRimX && atRimHeight) {
          this.completeAIDunk();
        }
      } else if (this.ballOwner && this.players.includes(this.ballOwner)) {
        // Player dunk — target right hoop (rim at x=1270)
        const distFromRim = Math.abs(this.dunkingPlayer.x - 1250);
        const nearRimX = distFromRim < 50;
        const atRimHeight = this.dunkingPlayer.y < 400;
        if (nearRimX && atRimHeight) {
          this.completeDunk();
        }
      }
    }

    // Track if dunking player has been in the air (only during a dunk)
    if (this.isDunking && this.dunkingPlayer) {
      const dunkingOnGround = this.dunkingPlayer.body.blocked.down;
      if (!dunkingOnGround && !this.wasInAir) {
        this.wasInAir = true;
      }

      // Reset dunking flag when landing (only if player was actually in the air during THIS dunk)
      if (dunkingOnGround && this.wasInAir) {
        // If AI dunk missed the hoop, make ball loose
        if (this.aiDunkingOpponent) {
          this.ball.x = this.aiDunkingOpponent.x;
          this.ball.y = this.aiDunkingOpponent.y - 30;
          this.makeBallLoose(this.aiDunkingOpponent);
          this.aiDunkingOpponent = null;
        }
        this.isDunking = false;
        this.wasInAir = false;
        this.dunkingPlayer = null;
      }
    }

    // Update AI for all opponents
    this.updateAI();
  }

  updateAI() {
    // Determine if ball is not carried (loose or in-flight)
    const ballIsLoose = this.ballState !== 'CARRIED';

    const leftHoopX = 210;
    const shootRange = 400;
    const dunkRange = 180;
    const guardDistance = 80;

    // Decide which opponent chases a loose ball (closest one only)
    let chaserOpp = null;
    if (ballIsLoose) {
      let closestDist = Infinity;
      for (const opp of this.opponents) {
        const d = Math.abs(opp.x - this.ball.x);
        if (d < closestDist) {
          closestDist = d;
          chaserOpp = opp;
        }
      }
    }

    for (const opp of this.opponents) {
      // Decrement per-opponent steal cooldown
      if (opp.aiStealCooldown > 0) opp.aiStealCooldown--;

      // Stunned opponents skip all AI behavior
      if (opp.stunTimer > 0) continue;

      const aiSpeed = opp.turboActive ? 300 : 200;

      // State transitions
      if (this.ballOwner === opp) {
        opp.aiState = 'ATTACK';
      } else if (ballIsLoose && opp === chaserOpp) {
        opp.aiState = 'CHASE_BALL';
      } else if (this.ballOwner && this.players.includes(this.ballOwner)) {
        // Red team has ball — defend
        opp.aiState = 'DEFEND';
      } else if (this.ballOwner && this.opponents.includes(this.ballOwner) && this.ballOwner !== opp) {
        // Other opponent has ball — support (stay open for pass)
        opp.aiState = 'SUPPORT';
      } else {
        opp.aiState = 'DEFEND';
      }

      const oppOnGround = opp.body.blocked.down;

      // Execute behavior based on state
      if (opp.aiState === 'CHASE_BALL') {
        const distToBall = this.ball.x - opp.x;
        const ballAbove = this.ball.y < opp.y - 60;

        if (oppOnGround) {
          // Jump for rebounds if ball is above
          if (ballAbove && Math.abs(distToBall) < 80) {
            opp.body.setVelocityY(-450);
          }
          if (Math.abs(distToBall) > 20) {
            opp.body.setVelocityX(distToBall > 0 ? aiSpeed : -aiSpeed);
          } else {
            opp.body.setVelocityX(0);
          }
        }
      } else if (opp.aiState === 'ATTACK') {
        if (!oppOnGround) continue;

        // Drive toward left hoop
        const distToHoop = leftHoopX - opp.x;

        // If behind or too close to the backboard, drive away first
        if (opp.x < 280) {
          opp.body.setVelocityX(aiSpeed); // Drive right to get proper angle
        } else {
          const inDunkZone = distToHoop > -50 && distToHoop < dunkRange;
          const inShootZone = Math.abs(distToHoop) < shootRange;

          if (inDunkZone) {
            // AI dunk — requires turbo meter
            opp.body.setVelocityX(0);
            if (!this.aiPaused && Math.random() < 0.03 && opp.turboMeter > 20) {
              opp.turboActive = true; // Burn turbo for dunk
              this.aiDunk(opp);
            }
          } else if (inShootZone) {
            opp.body.setVelocityX(0);
            if (!this.aiPaused && Math.random() < 0.03) {
              opp.body.setVelocityY(-450);
              this.time.delayedCall(300, () => {
                if (this.ballOwner === opp) {
                  this.aiShoot(opp);
                }
              });
            }
          } else {
            opp.body.setVelocityX(distToHoop < 0 ? -aiSpeed : aiSpeed);
          }
        }
      } else if (opp.aiState === 'DEFEND' || opp.aiState === 'SUPPORT') {
        // Each opponent guards their assigned player
        const target = opp.defendTarget;

        // AI BLOCK ATTEMPT: if ball is IN_FLIGHT and nearby, jump to block
        if (this.ballState === 'IN_FLIGHT' && oppOnGround && !this.aiPaused) {
          const distToBall = Math.sqrt(
            Math.pow(opp.x - this.ball.x, 2) + Math.pow(opp.y - this.ball.y, 2)
          );
          // Jump to block if ball is close and still rising or at peak
          if (distToBall < 120 && this.ball.body.velocity.y < 100) {
            const jumpVel = opp.turboActive ? -700 : -550;
            opp.body.setVelocityY(jumpVel);
            // Move toward ball
            const dx = this.ball.x - opp.x;
            if (Math.abs(dx) > 10) {
              opp.body.setVelocityX(dx > 0 ? aiSpeed : -aiSpeed);
            }
            continue; // Skip other defend logic this frame
          }
        }

        if (!oppOnGround) continue;

        // If our assigned target has the ball, try to steal
        if (this.ballOwner === target && this.players.includes(target)) {
          const distToCarrier = Math.abs(opp.x - target.x);
          // Move toward ball carrier
          const dx = target.x - opp.x;
          if (distToCarrier > 40) {
            opp.body.setVelocityX(dx > 0 ? aiSpeed : -aiSpeed);
          } else {
            opp.body.setVelocityX(0);
            // Attempt steal when close
            if (opp.aiStealCooldown <= 0 && !this.aiPaused) {
              this.aiAttemptSteal(opp);
              opp.aiStealCooldown = 90; // Cooldown between attempts
            }
          }
        } else {
          // Shadow assigned player, sway side to side near them
          opp.aiSwayTimer += 0.04;
          const swayOffset = Math.sin(opp.aiSwayTimer) * 60; // ±60px sway
          const targetX = target.x + guardDistance + swayOffset;
          const distToTarget = targetX - opp.x;
          if (Math.abs(distToTarget) > 10) {
            opp.body.setVelocityX(distToTarget > 0 ? aiSpeed : -aiSpeed);
          } else {
            opp.body.setVelocityX(0);
          }
        }
      }
    }
  }

  aiAttemptSteal(opponent) {
    if (!this.ballOwner || !this.players.includes(this.ballOwner)) return;
    const target = this.ballOwner;
    const dist = Math.abs(opponent.x - target.x);
    if (dist > 70) return;

    // 25% chance for AI steal (lower than player's 30%)
    if (Math.random() < 0.25) {
      this.ball.x = target.x;
      this.ball.y = target.y - 30;
      target.stunTimer = 15;          // Brief stumble
      target.pickupCooldown = 45;     // Can't re-grab quickly
      const toOpp = opponent.x - this.ball.x;
      this.ballState = 'LOOSE';
      this.ballOwner = null;
      this.ball.body.setAllowGravity(true);
      this.ball.body.setDrag(50, 0);
      this.ball.body.setVelocity(toOpp > 0 ? 150 : -150, -100);
      this.showFeedback('STOLEN!', '#cc66ff');
    }
  }

  aiDunk(opponent) {
    if (this.isDunking) return;
    if (this.ballOwner !== opponent) return;

    // Mark dunking state (ball stays CARRIED by opponent during dunk)
    this.isDunking = true;
    this.dunkingPlayer = opponent;
    this.aiDunkingOpponent = opponent; // Track that this is an AI dunk

    // Jump toward left hoop rim
    const targetX = 230; // Just right of left rim center
    const distToRim = targetX - opponent.x;

    opponent.body.setVelocityY(-700);
    if (Math.abs(distToRim) < 30) {
      opponent.body.setVelocityX(0);
    } else {
      const timeToApex = 0.7;
      let vx = distToRim / timeToApex;
      const sign = vx >= 0 ? 1 : -1;
      vx = sign * Math.max(100, Math.min(400, Math.abs(vx)));
      opponent.body.setVelocityX(vx);
    }
  }

  performDunk(player) {
    this.isDunking = true;
    this.dunkingPlayer = player;
    // Ball stays with player - don't release yet!
    // Player will carry ball to the hoop

    // Calculate velocity to reach the rim from current position
    const targetX = 1250; // Center of rim area
    const distToRim = targetX - player.x;

    if (Math.abs(distToRim) < 30) {
      // Already at the rim - just jump straight up
      player.body.setVelocityX(0);
    } else {
      // Calculate time to reach apex: velocityY / gravity = 700 / 800 ≈ 0.875 seconds
      const timeToApex = 0.7; // Slightly less to arrive before apex

      // Calculate required velocity (positive = right, negative = left)
      let velocityX = distToRim / timeToApex;

      // Cap the velocity to reasonable bounds (min 100 for a nice arc)
      const sign = velocityX >= 0 ? 1 : -1;
      velocityX = sign * Math.max(100, Math.min(400, Math.abs(velocityX)));

      player.body.setVelocityX(velocityX);
    }
  }

  // Called when player reaches the rim during a dunk
  completeDunk() {
    // Ball drops through hoop
    this.ballState = 'IN_FLIGHT';
    this.ballOwner = null;
    this.ball.x = 1270;
    this.ball.y = 355;
    this.ball.body.setVelocity(0, 300);
    this.ball.body.setAllowGravity(true);
    this.ballPickupCooldown = 60;
    this.scoringInProgress = true;

    // Score NOW when ball is slammed through
    this.score += 2;
    this.scoreText.setText('RED: ' + this.score);

    // Delay 0.5s to show ball through net, then give possession
    this.time.delayedCall(500, () => {
      this.opponent.x = 1380;
      this.ballState = 'CARRIED';
      this.ballOwner = this.opponent;
      this.ball.body.setVelocity(0, 0);
      this.ball.body.setAllowGravity(false);
      this.scoringInProgress = false;
    });

    // SLAM DUNK text - triggered at the rim!
    const slamText = this.add.text(640, 280, 'SLAM DUNK!', {
      fontSize: '80px',
      fontFamily: 'Arial Black',
      color: '#ff4500',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5).setScrollFactor(0);

    this.tweens.add({
      targets: slamText,
      alpha: 0,
      y: 200,
      scale: 1.3,
      duration: 1200,
      onComplete: () => slamText.destroy()
    });
  }

  // Called when AI opponent reaches the left rim during a dunk
  completeAIDunk() {
    this.aiDunkingOpponent = null;

    // Ball drops through left hoop
    this.ballState = 'IN_FLIGHT';
    this.ballOwner = null;
    this.ball.x = 210;
    this.ball.y = 355;
    this.ball.body.setVelocity(0, 300);
    this.ball.body.setAllowGravity(true);
    this.ballPickupCooldown = 60;
    this.scoringInProgress = true;

    // Score for purple team
    this.opponentScore += 2;
    this.opponentScoreText.setText('PURPLE: ' + this.opponentScore);

    // Delay 0.5s, then give possession to red team
    this.time.delayedCall(500, () => {
      const activePlayer = this.players[this.activePlayerIndex];
      activePlayer.x = 100;
      this.ballState = 'CARRIED';
      this.ballOwner = activePlayer;
      this.ball.body.setVelocity(0, 0);
      this.ball.body.setAllowGravity(false);
      this.scoringInProgress = false;
    });

    // SLAM DUNK text in purple
    const slamText = this.add.text(640, 280, 'SLAM DUNK!', {
      fontSize: '80px',
      fontFamily: 'Arial Black',
      color: '#cc66ff',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5).setScrollFactor(0);

    this.tweens.add({
      targets: slamText,
      alpha: 0,
      y: 200,
      scale: 1.3,
      duration: 1200,
      onComplete: () => slamText.destroy()
    });
  }

  shootBall(player, targetHoopX = 1270) {
    this.ballState = 'IN_FLIGHT';
    this.lastThrower = player;
    this.ballOwner = null;
    player.pickupCooldown = 30; // Shooter can't re-grab their own shot
    this.ball.body.setAllowGravity(true);

    const hoopX = targetHoopX;
    const hoopY = 325; // Target entry zone, ball arcs down through it
    const distX = hoopX - this.ball.x;
    const distance = Math.abs(distX);

    // Accuracy based on apex timing
    const velocityY = Math.abs(player.body.velocity.y);
    const isLongRange = distance >= 400;

    let jumpAccuracy, feedbackText, feedbackColor;
    const perfectThreshold = isLongRange ? 20 : 40;
    const goodThreshold = isLongRange ? 60 : 100;

    if (velocityY < perfectThreshold) {
      jumpAccuracy = 1.0;
      feedbackText = 'PERFECT!';
      feedbackColor = '#ffd700';
    } else if (velocityY < goodThreshold) {
      jumpAccuracy = 0.75;
      feedbackText = 'GOOD!';
      feedbackColor = '#00ff00';
    } else {
      jumpAccuracy = 0.4;
      feedbackText = 'OK';
      feedbackColor = '#ffff00';
    }

    // Show feedback
    const shotLabel = isLongRange ? `LONG ${feedbackText}` : feedbackText;
    this.showFeedback(shotLabel, feedbackColor);

    // Calculate trajectory
    const distY = hoopY - this.ball.y;
    const timeToHoop = Math.max(0.6, distance / 500);
    let vx = distX / timeToHoop;
    const gravity = 800;
    let vy = (distY - 0.5 * gravity * timeToHoop * timeToHoop) / timeToHoop;

    // Turbo accuracy bonus (+15%)
    if (player.turboActive) jumpAccuracy = Math.min(1.0, jumpAccuracy + 0.15);

    // Defensive pressure: nearby defenders reduce accuracy
    const defenderDist = this.getClosestDefenderDistance(player);
    if (defenderDist < 60) {
      jumpAccuracy *= 0.6; // Heavily contested
      this.showCenterFeedback('CONTESTED!', '#ff6666');
    } else if (defenderDist < 120) {
      jumpAccuracy *= 0.85; // Lightly contested
    }

    // Add randomness based on accuracy
    const randomness = (1 - jumpAccuracy) * 0.35;
    vx *= (1 + (Math.random() - 0.5) * randomness);
    vy *= (1 + (Math.random() - 0.5) * randomness);

    this.ball.body.setVelocity(vx, vy);
  }

  // AI shooting - opponent jumps and shoots toward left hoop
  aiShoot(opponent) {
    this.ballState = 'IN_FLIGHT';
    this.lastThrower = opponent;
    this.ballOwner = null;
    opponent.pickupCooldown = 30; // Shooter can't re-grab
    this.ball.body.setAllowGravity(true);

    const hoopX = 210; // Left hoop
    const hoopY = 325;
    const distX = hoopX - this.ball.x;
    const distance = Math.abs(distX);

    // Base 70% accuracy for AI
    let aiAccuracy = 0.7;

    // Defensive pressure: nearby defenders reduce accuracy
    const defenderDist = this.getClosestDefenderDistance(opponent);
    if (defenderDist < 60) {
      aiAccuracy *= 0.6; // Heavily contested
      this.showCenterFeedback('CONTESTED!', '#ff4444');
    } else if (defenderDist < 120) {
      aiAccuracy *= 0.85; // Lightly contested
    }

    // Calculate trajectory
    const distY = hoopY - this.ball.y;
    const timeToHoop = Math.max(0.6, distance / 500);
    let vx = distX / timeToHoop;
    const gravity = 800;
    let vy = (distY - 0.5 * gravity * timeToHoop * timeToHoop) / timeToHoop;

    // Add randomness based on accuracy
    const randomness = (1 - aiAccuracy) * 0.35;
    vx *= (1 + (Math.random() - 0.5) * randomness);
    vy *= (1 + (Math.random() - 0.5) * randomness);

    this.ball.body.setVelocity(vx, vy);
  }

  passBall(fromPlayer) {
    // Find the teammate (the other player)
    const teammate = this.players.find(p => p !== fromPlayer);
    if (!teammate) return;

    this.ballState = 'IN_FLIGHT';
    this.lastThrower = fromPlayer;
    this.ballOwner = null;
    this.ball.body.setAllowGravity(true);

    // Calculate pass trajectory to teammate
    const distX = teammate.x - this.ball.x;
    const distY = (teammate.y - 20) - this.ball.y; // Aim at chest height

    // Fast, direct pass with slight arc
    const passTime = 0.4; // Quick pass
    const vx = distX / passTime;
    const gravity = 800;
    const vy = (distY - 0.5 * gravity * passTime * passTime) / passTime;

    this.ball.body.setVelocity(vx, vy);

    // Short cooldown so teammate can catch
    this.ballPickupCooldown = 5;
  }

  performSteal() {
    // 30% chance of success
    if (Math.random() < 0.3) {
      // Success: ball becomes loose — knock it toward the player
      const target = this.ballOwner;
      const activePlayer = this.players[this.activePlayerIndex];
      if (target) {
        this.ball.x = target.x;
        this.ball.y = target.y - 30;
        target.stunTimer = 15;        // Brief stumble
        target.pickupCooldown = 45;   // Can't re-grab quickly
      }
      this.ballState = 'LOOSE';
      this.ballOwner = null;
      this.ball.body.setAllowGravity(true);
      this.ball.body.setDrag(50, 0);
      const toPlayer = activePlayer.x - this.ball.x;
      this.ball.body.setVelocity(toPlayer > 0 ? 150 : -150, -100);

      // Show STEAL! text
      const stealText = this.add.text(640, 280, 'STEAL!', {
        fontSize: '64px',
        fontFamily: 'Arial Black',
        color: '#00ff00',
        stroke: '#000000',
        strokeThickness: 6
      }).setOrigin(0.5).setScrollFactor(0);

      this.tweens.add({
        targets: stealText,
        alpha: 0,
        y: 220,
        scale: 1.2,
        duration: 800,
        onComplete: () => stealText.destroy()
      });
    } else {
      // Fail: cooldown before retry
      this.stealCooldown = 80;
      this.showFeedback('MISS!', '#ff6666');
    }
  }

  performShove() {
    // Always works: knock opponent back and ball drops
    const target = this.ballOwner;
    if (!target || !this.opponents.includes(target)) return;

    this.ballState = 'LOOSE';
    this.ballOwner = null;
    this.ball.body.setDrag(50, 0);
    this.shoveCooldown = 60;

    // Stun the shoved opponent
    target.stunTimer = 60;          // 1 second stun
    target.pickupCooldown = 60;     // Can't grab during stun

    // Drop ball at opponent's CURRENT position before pushing them away
    this.ball.x = target.x;
    this.ball.y = target.y - 30;

    // Knock opponent back 100px (away from active player)
    const activePlayer = this.players[this.activePlayerIndex];
    const pushDirection = activePlayer.x < target.x ? 1 : -1;
    const newOpponentX = Phaser.Math.Clamp(
      target.x + (pushDirection * 100),
      40,
      1430
    );
    target.x = newOpponentX;

    // Ball pops toward the player who shoved
    this.ball.body.setAllowGravity(true);
    this.ball.body.setVelocity(-pushDirection * 150, -100);

    // Show SHOVE! text
    const shoveText = this.add.text(640, 280, 'SHOVE!', {
      fontSize: '64px',
      fontFamily: 'Arial Black',
      color: '#ff8800',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0);

    this.tweens.add({
      targets: shoveText,
      alpha: 0,
      y: 220,
      scale: 1.2,
      duration: 800,
      onComplete: () => shoveText.destroy()
    });
  }

  // Check if any airborne entity can block the ball
  checkForBlocks() {
    const blockRange = 50; // Distance from ball to count as a block
    const allEntities = [...this.players, ...this.opponents];

    for (const entity of allEntities) {
      // Must be in the air, not stunned, and not the one who threw it
      if (entity.body.blocked.down) continue;
      if (entity.stunTimer > 0) continue;
      if (entity === this.lastThrower) continue;

      // Check distance from entity's top (hand) to ball
      const entityTopY = entity.y - 30; // Top of sprite
      const dx = Math.abs(entity.x - this.ball.x);
      const dy = Math.abs(entityTopY - this.ball.y);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > blockRange) continue;

      // Check for goaltending: ball on downward arc near either hoop
      const ballDescending = this.ball.body.velocity.y > 0;
      const nearRightHoop = Math.abs(this.ball.x - 1270) < 60 && this.ball.y < 360;
      const nearLeftHoop = Math.abs(this.ball.x - 210) < 60 && this.ball.y < 360;

      if (ballDescending && (nearRightHoop || nearLeftHoop)) {
        // GOALTENDING — basket counts for the shooter's team
        if (nearRightHoop && this.lastThrower && this.players.includes(this.lastThrower)) {
          // Player shot goaltended — score for red
          this.score += 2;
          this.scoreText.setText('RED: ' + this.score);
          this.showCenterFeedback('GOALTEND!', '#ff4444');
        } else if (nearLeftHoop && this.lastThrower && this.opponents.includes(this.lastThrower)) {
          // AI shot goaltended — score for purple
          this.opponentScore += 2;
          this.opponentScoreText.setText('PURPLE: ' + this.opponentScore);
          this.showCenterFeedback('GOALTEND!', '#cc66ff');
        }
        // Reset ball after goaltend (give possession to team that scored)
        this.ballPickupCooldown = 60;
        this.scoringInProgress = true;
        this.ball.body.setVelocity(0, 300);
        this.ball.body.setAllowGravity(true);

        this.time.delayedCall(500, () => {
          if (nearRightHoop) {
            // Red scored via goaltend — purple gets ball
            this.opponent.x = 1380;
            this.ballState = 'CARRIED';
            this.ballOwner = this.opponent;
          } else {
            // Purple scored via goaltend — red gets ball
            const activePlayer = this.players[this.activePlayerIndex];
            activePlayer.x = 100;
            this.ballState = 'CARRIED';
            this.ballOwner = activePlayer;
          }
          this.ball.body.setVelocity(0, 0);
          this.ball.body.setAllowGravity(false);
          this.scoringInProgress = false;
        });
        return; // Only one block event per frame
      }

      // LEGAL BLOCK — swat the ball away
      const awayFromBlocker = entity.x < this.ball.x ? 300 : -300;
      this.ballState = 'LOOSE';
      this.ballOwner = null;
      this.lastThrower = null;
      this.ball.body.setAllowGravity(true);
      this.ball.body.setDrag(50, 0);
      this.ball.body.setVelocity(awayFromBlocker, -200);
      this.ballPickupCooldown = 15;

      // "REJECTED!" popup
      this.showCenterFeedback('REJECTED!', '#ff0000');
      return; // Only one block per frame
    }
  }

  // Get the closest defender distance for shot contest calculation
  getClosestDefenderDistance(shooter) {
    let closestDist = Infinity;
    const defenders = this.players.includes(shooter) ? this.opponents : this.players;
    for (const def of defenders) {
      const dist = Math.abs(def.x - shooter.x);
      if (dist < closestDist) closestDist = dist;
    }
    return closestDist;
  }

  // Center-screen feedback text (for blocks, goaltends, contested shots)
  showCenterFeedback(text, color) {
    const popup = this.add.text(640, 280, text, {
      fontSize: '64px',
      fontFamily: 'Arial Black',
      color: color,
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0);

    this.tweens.add({
      targets: popup,
      alpha: 0,
      y: 220,
      scale: 1.2,
      duration: 800,
      onComplete: () => popup.destroy()
    });
  }

  makeBallLoose(fromEntity = null) {
    this.ballState = 'LOOSE';
    this.ballOwner = null;
    this.ball.body.setAllowGravity(true);
    this.ball.body.setDrag(50, 0); // Drag only on loose balls
    const randomVelX = (Math.random() - 0.5) * 100;
    this.ball.body.setVelocity(randomVelX, -50);
    this.ballPickupCooldown = 10;
  }

  showFeedback(text, color) {
    const activePlayer = this.players[this.activePlayerIndex];
    const popup = this.add.text(activePlayer.x, activePlayer.y - 60, text, {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: color,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: popup,
      y: popup.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => popup.destroy()
    });
  }
}
