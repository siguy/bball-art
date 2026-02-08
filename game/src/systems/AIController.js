/**
 * AIController - Controls opponent team in 2v2 basketball
 *
 * Manages two AI players with three behavior states:
 * - CHASE_BALL: Pursue loose balls
 * - ATTACK: Move toward hoop, pass, or shoot when possessing ball
 * - DEFEND: Guard opponents when they have the ball
 */

// Behavior states
const State = {
  CHASE_BALL: 'CHASE_BALL',
  ATTACK: 'ATTACK',
  DEFEND: 'DEFEND'
};

// Difficulty tuning constants
const REACTION_DELAY = 200; // ms before responding to state changes
const SHOOTING_RANGE_MIN = 150;
const SHOOTING_RANGE_MAX = 300;
const PASS_PROBABILITY = 0.2; // 20% chance to pass vs drive
const DEFENSIVE_SLOP = 30; // pixels of imperfection in defensive positioning
const DECISION_INTERVAL = 500; // ms between major decisions

export default class AIController {
  /**
   * @param {Phaser.Scene} scene - The game scene
   * @param {Player[]} team - Array of Player entities the AI controls
   * @param {Player[]} opposingTeam - Array of Player entities to defend against
   * @param {Ball} ball - Ball entity
   * @param {Hoop} targetHoop - Hoop entity to score on
   */
  constructor(scene, team, opposingTeam, ball, targetHoop) {
    this.scene = scene;
    this.team = team;
    this.opposingTeam = opposingTeam;
    this.ball = ball;
    this.targetHoop = targetHoop;

    this.state = State.CHASE_BALL;
    this.activePlayerIndex = 0;

    // Timing for reaction delays and decisions
    this.lastStateChange = 0;
    this.stateChangeQueued = null;
    this.lastDecisionTime = 0;
    this.shouldPass = false;
  }

  /**
   * Returns which AI player is currently prioritized
   * @returns {Player}
   */
  getActivePlayer() {
    return this.team[this.activePlayerIndex];
  }

  /**
   * Get the non-active teammate
   * @returns {Player}
   */
  getTeammate() {
    return this.team[this.activePlayerIndex === 0 ? 1 : 0];
  }

  /**
   * Check if the AI team has possession of the ball
   * @returns {boolean}
   */
  teamHasBall() {
    return this.team.some(player => player.hasBall);
  }

  /**
   * Check if the opposing team has possession
   * @returns {boolean}
   */
  opponentHasBall() {
    return this.opposingTeam.some(player => player.hasBall);
  }

  /**
   * Get the player currently holding the ball (from either team)
   * @returns {Player|null}
   */
  getBallCarrier() {
    for (const player of [...this.team, ...this.opposingTeam]) {
      if (player.hasBall) return player;
    }
    return null;
  }

  /**
   * Get distance between two game objects
   * @param {Object} a - Object with x, y properties
   * @param {Object} b - Object with x, y properties
   * @returns {number}
   */
  getDistance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Queue a state change with reaction delay
   * @param {string} newState
   */
  queueStateChange(newState) {
    if (this.state !== newState && this.stateChangeQueued !== newState) {
      this.stateChangeQueued = newState;
      this.lastStateChange = Date.now();
    }
  }

  /**
   * Process queued state changes after reaction delay
   */
  processStateChange() {
    if (this.stateChangeQueued && Date.now() - this.lastStateChange >= REACTION_DELAY) {
      this.state = this.stateChangeQueued;
      this.stateChangeQueued = null;
    }
  }

  /**
   * Determine what state the AI should be in
   */
  determineState() {
    if (this.teamHasBall()) {
      this.queueStateChange(State.ATTACK);
    } else if (this.opponentHasBall()) {
      this.queueStateChange(State.DEFEND);
    } else {
      this.queueStateChange(State.CHASE_BALL);
    }
  }

  /**
   * Move a player toward a target position
   * @param {Player} player
   * @param {number} targetX
   * @param {number} targetY
   * @param {number} speed - Movement speed multiplier (0-1)
   */
  moveToward(player, targetX, targetY, speed = 1) {
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) {
      player.setVelocity(0, 0);
      return;
    }

    const baseSpeed = player.speed || 200;
    const vx = (dx / distance) * baseSpeed * speed;
    const vy = (dy / distance) * baseSpeed * speed;

    player.setVelocity(vx, vy);
  }

  /**
   * Execute CHASE_BALL behavior
   * Both players move toward the ball, closest one prioritized
   */
  executeChaseBall() {
    const ballPos = { x: this.ball.x, y: this.ball.y };

    // Determine which player is closer to the ball
    const distances = this.team.map(player => this.getDistance(player, ballPos));
    this.activePlayerIndex = distances[0] <= distances[1] ? 0 : 1;

    // Active player chases ball directly
    const active = this.getActivePlayer();
    this.moveToward(active, ballPos.x, ballPos.y, 1);

    // Teammate moves toward ball but from a different angle
    const teammate = this.getTeammate();
    const offsetX = teammate.x < ballPos.x ? -50 : 50;
    this.moveToward(teammate, ballPos.x + offsetX, ballPos.y, 0.8);
  }

  /**
   * Execute ATTACK behavior
   * Ball carrier moves to hoop, teammate gets open
   */
  executeAttack() {
    const ballCarrier = this.team.find(p => p.hasBall);

    if (!ballCarrier) {
      // Ball was just released, chase it
      this.executeChaseBall();
      return;
    }

    // Set active player to ball carrier
    this.activePlayerIndex = this.team.indexOf(ballCarrier);
    const teammate = this.getTeammate();

    const distanceToHoop = this.getDistance(ballCarrier, this.targetHoop);

    // Make decisions periodically
    const now = Date.now();
    if (now - this.lastDecisionTime > DECISION_INTERVAL) {
      this.lastDecisionTime = now;
      this.shouldPass = Math.random() < PASS_PROBABILITY;
    }

    // Shooting decision
    if (distanceToHoop < SHOOTING_RANGE_MIN) {
      // Close enough - shoot!
      if (ballCarrier.shoot) {
        ballCarrier.shoot(this.targetHoop);
      }
      ballCarrier.setVelocity(0, 0);
    } else if (distanceToHoop < SHOOTING_RANGE_MAX && Math.random() < 0.02) {
      // In range - occasionally take the shot
      if (ballCarrier.shoot) {
        ballCarrier.shoot(this.targetHoop);
      }
    } else if (this.shouldPass && distanceToHoop > SHOOTING_RANGE_MIN) {
      // Pass to teammate
      if (ballCarrier.pass) {
        ballCarrier.pass(teammate);
        this.shouldPass = false;
      }
    } else {
      // Drive toward hoop
      this.moveToward(ballCarrier, this.targetHoop.x, this.targetHoop.y, 0.9);
    }

    // Teammate tries to get open
    this.moveToOpenSpace(teammate, ballCarrier);
  }

  /**
   * Move teammate to an open position for receiving passes
   * @param {Player} player
   * @param {Player} ballCarrier
   */
  moveToOpenSpace(player, ballCarrier) {
    // Find position that's:
    // - Not too close to ball carrier
    // - Closer to hoop than current position
    // - Away from defenders

    const targetX = this.targetHoop.x + (Math.random() - 0.5) * 200;
    const targetY = this.targetHoop.y + (Math.random() - 0.5) * 150 + 100;

    // Add some offset from the ball carrier
    const offsetFromCarrier = ballCarrier.x < this.targetHoop.x ? 80 : -80;

    this.moveToward(player, targetX + offsetFromCarrier, targetY, 0.7);
  }

  /**
   * Execute DEFEND behavior
   * One guards ball carrier, other protects the hoop
   */
  executeDefend() {
    const ballCarrier = this.opposingTeam.find(p => p.hasBall);

    if (!ballCarrier) {
      this.executeChaseBall();
      return;
    }

    // Determine which defender is closer to ball carrier
    const distances = this.team.map(player => this.getDistance(player, ballCarrier));
    const primaryDefenderIndex = distances[0] <= distances[1] ? 0 : 1;
    const secondaryDefenderIndex = primaryDefenderIndex === 0 ? 1 : 0;

    const primaryDefender = this.team[primaryDefenderIndex];
    const secondaryDefender = this.team[secondaryDefenderIndex];

    // Primary defender guards ball carrier (with some slop)
    const slopX = (Math.random() - 0.5) * DEFENSIVE_SLOP;
    const slopY = (Math.random() - 0.5) * DEFENSIVE_SLOP;

    // Position between ball carrier and our hoop (the one they're attacking)
    const defenseX = ballCarrier.x + (this.targetHoop.x - ballCarrier.x) * 0.3 + slopX;
    const defenseY = ballCarrier.y + slopY;

    this.moveToward(primaryDefender, defenseX, defenseY, 0.95);

    // Secondary defender positions between ball and hoop
    // Find the other opponent (not the ball carrier)
    const otherOpponent = this.opposingTeam.find(p => !p.hasBall);

    if (otherOpponent) {
      // Guard the other player loosely
      const secondaryX = (otherOpponent.x + this.targetHoop.x) / 2 + slopX;
      const secondaryY = (otherOpponent.y + this.targetHoop.y) / 2 + slopY;
      this.moveToward(secondaryDefender, secondaryX, secondaryY, 0.8);
    } else {
      // No other opponent visible, protect the paint
      const paintX = this.targetHoop.x;
      const paintY = this.targetHoop.y + 80;
      this.moveToward(secondaryDefender, paintX + slopX, paintY + slopY, 0.7);
    }

    this.activePlayerIndex = primaryDefenderIndex;
  }

  /**
   * Main update loop - called each frame
   * @param {number} delta - Time since last frame in ms
   */
  update(delta) {
    // Process any queued state changes
    this.processStateChange();

    // Determine what state we should be in
    this.determineState();

    // Execute behavior for current state
    switch (this.state) {
      case State.CHASE_BALL:
        this.executeChaseBall();
        break;
      case State.ATTACK:
        this.executeAttack();
        break;
      case State.DEFEND:
        this.executeDefend();
        break;
    }
  }
}
