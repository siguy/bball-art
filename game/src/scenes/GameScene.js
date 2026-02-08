import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Court floor
    this.floor = this.add.rectangle(640, 670, 1280, 100, 0x8B4513);
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

    // Opponent (purple, stationary for now)
    this.opponent = this.add.rectangle(700, 590, 40, 60, 0x800080);
    this.physics.add.existing(this.opponent);
    this.opponent.body.setCollideWorldBounds(true);
    this.opponent.body.setImmovable(true);
    this.opponent.body.setAllowGravity(false); // Stationary, no gravity

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
    this.ballEnteredHoop = false; // Track two-zone scoring

    // Defense state
    this.opponentHasBall = true; // Opponent starts with ball
    this.stealCooldown = 0; // Frames before steal can be attempted again
    this.shoveCooldown = 0; // Frames before shove can be used again
    this.stealKeyPressed = false; // Track steal key state to prevent repeat triggers

    // Dribbling state
    this.dribbleTime = 0; // Counter for dribble animation
    this.lastBallSide = 25; // Track which side ball was on (25 = right, -25 = left)

    // Collisions
    this.physics.add.collider(this.player, this.floor);
    this.physics.add.collider(this.teammate, this.floor);
    this.physics.add.collider(this.opponent, this.floor);

    // Ball
    this.ball = this.add.circle(0, 0, 12, 0xffa500);
    this.physics.add.existing(this.ball);
    this.ball.body.setCircle(12);
    this.ball.body.setBounce(0.6);
    this.ball.body.setCollideWorldBounds(true);
    this.ball.body.setAllowGravity(false);
    this.ballCarrier = null; // Which player has the ball (null = no one on red team)

    this.physics.add.collider(this.ball, this.floor);

    // === HOOP WITH PHYSICS ===

    // Backboard - physics body, ball bounces off
    this.backboard = this.add.rectangle(1100, 300, 10, 80, 0x8b4513);
    this.physics.add.existing(this.backboard, true);
    this.physics.add.collider(this.ball, this.backboard);

    // Rim visual (center bar)
    this.rim = this.add.rectangle(1070, 340, 50, 8, 0xff6600);

    // Rim edges - 50px opening
    this.rimLeft = this.add.rectangle(1045, 340, 8, 8, 0xff6600);
    this.rimRight = this.add.rectangle(1095, 340, 8, 8, 0xff6600);
    this.physics.add.existing(this.rimLeft, true);
    this.physics.add.existing(this.rimRight, true);
    this.physics.add.collider(this.ball, this.rimLeft);
    this.physics.add.collider(this.ball, this.rimRight);

    // Two-zone scoring system - 40px zones (invisible)
    // Entry zone: above the rim (ball enters from above)
    this.scoreEntry = this.add.rectangle(1070, 325, 40, 20, 0x90ee90, 0);
    this.physics.add.existing(this.scoreEntry, true);

    // Exit zone: below the rim (ball exits downward)
    this.scoreExit = this.add.rectangle(1070, 360, 40, 20, 0x90ee90, 0);
    this.physics.add.existing(this.scoreExit, true);

    // Entry zone overlap - mark that ball entered from above
    this.physics.add.overlap(this.ball, this.scoreEntry, () => {
      if (this.ball.body.velocity.y > 0 && !this.hasBall && !this.isDunking) {
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

    // Ball pickup - player 1
    this.physics.add.overlap(this.player, this.ball, () => this.onBallPickup(this.player), null, this);

    // Ball pickup - teammate (player 2)
    this.physics.add.overlap(this.teammate, this.ball, () => this.onBallPickup(this.teammate), null, this);

    // Ball pickup - opponent
    this.physics.add.overlap(this.opponent, this.ball, this.onOpponentBallPickup, null, this);

    // Score
    this.score = 0;
    this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    });

    // Controls hint
    this.add.text(640, 600, 'WASD = Move | SPACE = Jump/Shoot | TAB = Switch | E = Pass | DOWN = Steal', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Debug (hidden by default, toggle with backtick key)
    this.debugMode = false;
    this.debugText = this.add.text(20, 60, '', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#aaaaaa'
    });
    this.debugText.setVisible(false);
  }

  onBallPickup(player) {
    // Don't pick up if: someone already has ball, opponent has ball, dunking, or cooldown active
    if (this.ballCarrier || this.opponentHasBall || this.isDunking || this.ballPickupCooldown > 0) {
      return;
    }
    this.ballCarrier = player;
    this.ball.body.setVelocity(0, 0);
    this.ball.body.setAllowGravity(false);
    this.ballEnteredHoop = false; // Reset scoring state
  }

  onOpponentBallPickup() {
    // Don't pick up if: a red team player has ball, opponent already has ball, or cooldown active
    if (this.ballCarrier || this.opponentHasBall || this.ballPickupCooldown > 0) {
      return;
    }
    this.opponentHasBall = true;
    this.ball.body.setVelocity(0, 0);
    this.ball.body.setAllowGravity(false);
  }

  onScore() {
    // Prevent double-scoring (called from exit zone overlap)
    if (this.ballCarrier || this.isDunking) return;

    this.score += 2;
    this.scoreText.setText('SCORE: ' + this.score);

    const scorePopup = this.add.text(640, 300, 'SCORE!', {
      fontSize: '72px',
      fontFamily: 'Arial',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.tweens.add({
      targets: scorePopup,
      alpha: 0,
      y: 250,
      duration: 1000,
      onComplete: () => scorePopup.destroy()
    });

    // Reset ball entry state
    this.ballEnteredHoop = false;

    // Ball returns to active player
    this.ballCarrier = this.players[this.activePlayerIndex];
    this.ball.body.setVelocity(0, 0);
    this.ball.body.setAllowGravity(false);
  }

  update() {
    // Debug toggle (I key)
    if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
      this.debugMode = !this.debugMode;
      this.debugText.setVisible(this.debugMode);
      // Also show/hide scoring zones for debugging
      this.scoreEntry.setAlpha(this.debugMode ? 0.3 : 0);
      this.scoreExit.setAlpha(this.debugMode ? 0.3 : 0);
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
    const speed = 250;

    // Check dunk range (can dunk from 200px before hoop to 50px past it)
    const distToHoop = 1070 - activePlayer.x;
    const inDunkRange = distToHoop > -50 && distToHoop < 200;

    // Helper: does this player have the ball?
    const activeHasBall = this.ballCarrier === activePlayer;

    // Visual feedback for BOTH players
    for (const p of this.players) {
      const playerHasBall = this.ballCarrier === p;
      const pDistToHoop = 1070 - p.x;
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

    // === DEFENSE (steal and shove) ===
    const distToOpponent = Math.abs(activePlayer.x - this.opponent.x);
    const closeToOpponent = distToOpponent < 70;

    // Decrement cooldowns
    if (this.stealCooldown > 0) this.stealCooldown--;
    if (this.shoveCooldown > 0) this.shoveCooldown--;

    // Steal/Shove key: Down Arrow (only trigger once per press)
    const stealKeyDown = this.cursors.down.isDown;
    if (stealKeyDown && !this.stealKeyPressed) {
      this.stealKeyPressed = true;

      if (closeToOpponent && this.opponentHasBall) {
        if (this.shiftKey.isDown && this.shoveCooldown <= 0) {
          // SHOVE: Shift+Down - always works, knocks opponent back
          this.performShove();
        } else if (!this.shiftKey.isDown && this.stealCooldown <= 0) {
          // STEAL: Down alone - 30% chance
          this.performSteal();
        }
      }
    }

    // Reset steal key flag when released
    if (!stealKeyDown) {
      this.stealKeyPressed = false;
    }

    // Debug display - show all relevant state
    const ballStatus = this.ballCarrier ? (this.ballCarrier === this.player ? 'P1' : 'P2') : (this.opponentHasBall ? 'O' : 'L');
    this.debugText.setText(
      `Ground: ${onGround} | Ball: ${ballStatus} | Active: P${this.activePlayerIndex + 1} | ` +
      `DistOpp: ${Math.round(distToOpponent)} | StealCD: ${this.stealCooldown} | ShoveCD: ${this.shoveCooldown}`
    );

    // === PASS (E key) ===
    if (Phaser.Input.Keyboard.JustDown(this.passKey) && activeHasBall) {
      this.passBall(activePlayer);
    }

    // === JUMP (only when on ground, only once per press) ===
    if (this.spaceKey.isDown && onGround && !this.jumpedThisPress) {
      this.jumpedThisPress = true; // Prevent multiple jumps
      if (inDunkRange && activeHasBall) {
        // DUNK - boosted jump toward hoop
        activePlayer.body.setVelocityY(-700);
        this.performDunk(activePlayer);
      } else {
        // Normal jump
        activePlayer.body.setVelocityY(-550);
        this.isDunking = false;
      }
    }

    // Reset jump flag when space is released
    if (!this.spaceKey.isDown) {
      this.jumpedThisPress = false;
    }

    // === SHOOT (release in air, not dunking) ===
    if (Phaser.Input.Keyboard.JustUp(this.spaceKey) && !onGround && activeHasBall && !this.isDunking) {
      this.shootBall(activePlayer);
    }

    // === MOVEMENT ===
    if (this.isDunking && this.dunkingPlayer === activePlayer) {
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

    // Ball follows opponent
    if (this.opponentHasBall) {
      this.ball.x = this.opponent.x - 25; // Ball on left side of opponent
      this.ball.y = this.opponent.y - 20;
    }

    // Ball follows the carrier with dribble animation
    if (this.ballCarrier) {
      const carrier = this.ballCarrier;
      const carrierOnGround = carrier.body.blocked.down;
      const isMoving = Math.abs(carrier.body.velocity.x) > 10;
      // Ball on the side player is moving toward (only update when moving)
      if (isMoving) {
        this.lastBallSide = carrier.body.velocity.x > 0 ? 25 : -25;
      }
      const targetX = carrier.x + this.lastBallSide;

      if (carrierOnGround && isMoving && !this.isDunking) {
        // Dribbling: ball bounces to floor and back (1 bounce/sec at 60fps)
        this.dribbleTime += 0.105; // 1 cycle per second
        const dribbleBounce = Math.abs(Math.sin(this.dribbleTime)) * 40; // 0-40px amplitude
        this.ball.x = this.ball.x + (targetX - this.ball.x) * 0.8; // Slight trail effect
        this.ball.y = carrier.y - 5 + dribbleBounce; // Start lower (-5), bounce to floor (+35)
      } else {
        // Not dribbling: ball follows player directly (jumping, stationary, or dunking)
        this.ball.x = this.ball.x + (targetX - this.ball.x) * 0.3; // Smooth transition when stopping
        this.ball.y = carrier.y - 20;
        // Reset dribble time when not dribbling so bounce starts from consistent position
        this.dribbleTime = 0;
      }
    }

    // Decrement ball pickup cooldown
    if (this.ballPickupCooldown > 0) {
      this.ballPickupCooldown--;
    }

    // Check if dunking player reached the hoop during a dunk
    if (this.isDunking && this.ballCarrier && this.dunkingPlayer) {
      // Dunking player is near the rim horizontally (within 50px) and at/above rim height
      const distFromRim = Math.abs(this.dunkingPlayer.x - 1050);
      const nearRimX = distFromRim < 50;
      const atRimHeight = this.dunkingPlayer.y < 400;

      if (nearRimX && atRimHeight) {
        this.completeDunk();
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
        this.isDunking = false;
        this.wasInAir = false;
        this.dunkingPlayer = null;
      }
    }
  }

  performDunk(player) {
    this.isDunking = true;
    this.dunkingPlayer = player;
    // Ball stays with player - don't release yet!
    // Player will carry ball to the hoop

    // Calculate velocity to reach the rim from current position
    const targetX = 1050; // Center of rim area
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
    this.ballCarrier = null;
    this.ballPickupCooldown = 60;

    // Ball drops through hoop
    this.ball.x = 1070;
    this.ball.y = 355;
    this.ball.body.setVelocity(0, 250);
    this.ball.body.setAllowGravity(true);

    // Score NOW when ball is slammed through
    this.score += 2;
    this.scoreText.setText('SCORE: ' + this.score);

    // SLAM DUNK text - triggered at the rim!
    const slamText = this.add.text(640, 280, 'SLAM DUNK!', {
      fontSize: '80px',
      fontFamily: 'Arial Black',
      color: '#ff4500',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);

    this.tweens.add({
      targets: slamText,
      alpha: 0,
      y: 200,
      scale: 1.3,
      duration: 1200,
      onComplete: () => slamText.destroy()
    });
  }

  shootBall(player) {
    this.ballCarrier = null;
    this.ballPickupCooldown = 30; // Prevent immediate pickup after shot
    this.ball.body.setAllowGravity(true);

    const hoopX = 1070;
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

    // Add randomness based on accuracy
    const randomness = (1 - jumpAccuracy) * 0.35;
    vx *= (1 + (Math.random() - 0.5) * randomness);
    vy *= (1 + (Math.random() - 0.5) * randomness);

    this.ball.body.setVelocity(vx, vy);
  }

  passBall(fromPlayer) {
    // Find the teammate (the other player)
    const teammate = this.players.find(p => p !== fromPlayer);
    if (!teammate) return;

    this.ballCarrier = null;
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
    // 40% chance of success
    if (Math.random() < 0.3) {
      // Success: ball becomes loose
      this.opponentHasBall = false;
      this.makeBallLoose();

      // Show STEAL! text
      const stealText = this.add.text(640, 280, 'STEAL!', {
        fontSize: '64px',
        fontFamily: 'Arial Black',
        color: '#00ff00',
        stroke: '#000000',
        strokeThickness: 6
      }).setOrigin(0.5);

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
    this.opponentHasBall = false;
    this.shoveCooldown = 60;

    // Knock opponent back 100px (away from player)
    const pushDirection = this.player.x < this.opponent.x ? 1 : -1;
    const newOpponentX = Phaser.Math.Clamp(
      this.opponent.x + (pushDirection * 100),
      40, // Left bound (half opponent width)
      1240 // Right bound
    );
    this.opponent.x = newOpponentX;

    // Ball becomes loose
    this.makeBallLoose();

    // Show SHOVE! text
    const shoveText = this.add.text(640, 280, 'SHOVE!', {
      fontSize: '64px',
      fontFamily: 'Arial Black',
      color: '#ff8800',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.tweens.add({
      targets: shoveText,
      alpha: 0,
      y: 220,
      scale: 1.2,
      duration: 800,
      onComplete: () => shoveText.destroy()
    });
  }

  makeBallLoose() {
    // Ball drops with gravity, can be picked up by first to touch
    this.ball.body.setAllowGravity(true);
    // Give it a slight random velocity
    const randomVelX = (Math.random() - 0.5) * 100;
    this.ball.body.setVelocity(randomVelX, -50);
    this.ballPickupCooldown = 10; // Short cooldown so it's a race
  }

  showFeedback(text, color) {
    const popup = this.add.text(this.player.x, this.player.y - 60, text, {
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
