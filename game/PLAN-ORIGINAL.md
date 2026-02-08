# Holy Hoops - Family Game Dev Plan 🏀

## Philosophy

**Build in big chunks. Play together. Have fun.**

- 3 builds, 3 family play sessions
- Parallel agents = faster building
- Kids test and give feedback
- Fun > perfection

---

## Team Roles

| Person | Role |
|--------|------|
| Dad | Producer - runs Claude, makes calls |
| 12yo | Lead Tester - "Is it fun? Too easy/hard?" |
| 6yo | Creative Director - picks names, colors, celebrates |
| Claude | Engineer - builds fast, fixes bugs |

---

# THE THREE BUILDS

```
BUILD 1: "One Player Scores"     → Family plays solo basketball
    ↓
BUILD 2: "Full 2v2 Game"         → Family plays vs AI team
    ↓
BUILD 3: "Polish & iPad"         → Complete game on tablet
```

---

# BUILD 1: ONE PLAYER SCORES
## ⏱️ ~20 min build, then PLAY!

### What You'll Have
- One player (red rectangle) that moves and jumps
- Ball that follows you
- Hoop on the right
- Shoot and score
- "SCORE!" text when you make it

### Parallel Agents

**Agent 1A: Player + Court**
```
OVERWRITE /game/src/scenes/GameScene.js completely. Create fresh:
- Brown rectangle floor (court)
- Red rectangle player (40x60)
- WASD/Arrow movement (left/right)
- Space to jump
- Gravity pulls player down
- Player lands on floor

Use Phaser arcade physics. Keep it under 80 lines.
```

**Agent 1B: Ball + Hoop + Scoring**
```
Add to GameScene.js:
- Orange circle (ball, radius 12) follows player
- Hoop on right side (x=1100): brown backboard + orange rim
- Space when holding ball = shoot toward hoop
- Ball arcs up then down (gravity)
- When ball overlaps hoop rim area:
  - Show "SCORE!" text (big, green)
  - Reset ball to player
- Track score, show at top: "SCORE: 0"

Integrate with Agent 1A's player. Keep code simple.
```

### Testing Agent
```
After both agents complete:
1. npm run dev
2. Check for console errors
3. Test: WASD moves player
4. Test: Space jumps
5. Test: Ball follows player
6. Test: Space shoots ball
7. Test: Ball arcs toward hoop
8. Score 3 baskets to verify scoring works
Report PASS/FAIL for each test
```

### 🎮 FAMILY PLAYTEST 1
**Challenge**: First to score 10 baskets!
- Take turns at the keyboard
- **6yo question**: "What sound should scoring make?"
- **12yo question**: "Is shooting too easy or too hard?"
- **Everyone**: Is the jumping fun?

### If Something's Wrong
- Movement broken → Check keyboard input setup
- Ball not following → Check update loop
- Scoring not working → Make hoop hitbox bigger
- **Just tell me what's broken, I'll fix it**

### Say "NEXT" when ready for Build 2

---

# BUILD 2: FULL 2v2 GAME
## ⏱️ ~30 min build, then PLAY!

### What You'll Have
- Your teammate (second player, same team)
- Two opponents (purple team with AI)
- Passing between teammates
- Opponents try to score on YOUR hoop
- Scoreboard: "RED 0 - 0 PURPLE"
- 2-minute timer
- Game over screen with winner

### Parallel Agents

**Agent 2A: Teammate + Controls**
```
Add to GameScene.js:
- Second red player positioned nearby
- Tab switches which player you control
- Yellow outline shows active player
- E key passes ball to teammate
- Teammate stands still for now (AI comes later)
```

**Agent 2B: Opponents + AI**
```
Add to GameScene.js:
- Two purple rectangle opponents
- Second hoop on LEFT side (opponents score here)
- Simple AI behavior:
  - Ball loose? Chase it
  - Have ball? Run toward left hoop
  - Near left hoop? Shoot
  - No ball, opponent has it? Run toward them
- AI shoots with 60% accuracy
```

**Agent 2C: Scoreboard + Timer + Game Over**
```
Add to GameScene.js:
- Top of screen: "RED 0 - 0 PURPLE"
- Update score when either team scores
- Timer: starts at 2:00, counts down every second
- At 0:00:
  - Stop gameplay
  - Show "GAME OVER"
  - Show "RED WINS!" or "PURPLE WINS!"
  - "PRESS SPACE TO PLAY AGAIN" - restarts game
```

### Testing Agent
```
After all agents complete:
1. npm run dev
2. Verify: 4 players on court (2 red, 2 purple)
3. Verify: Tab switches between red players
4. Verify: E passes to teammate
5. Verify: Purple team chases ball
6. Verify: Purple team can score on left hoop
7. Verify: Score updates for both teams
8. Verify: Timer counts down
9. Let timer run out, verify game over works
10. Verify Play Again works
Report PASS/FAIL
```

### 🎮 FAMILY PLAYTEST 2
**Play a full game together!**
- 2-minute game, try to beat the AI
- **6yo job**: Shout the countdown for last 10 seconds!
- **12yo verdict**: Is the AI too easy, too hard, or just right?
- **Discussion**: What should we call the teams? (Jordan/Moses vs LeBron/David?)

### Tuning Options
Tell me if you need:
- AI slower/faster
- AI smarter/dumber
- More/less time on clock
- Bigger/smaller hoops

### Say "NEXT" when ready for Build 3

---

# BUILD 3: POLISH & iPAD
## ⏱️ ~25 min build, then PLAY ON iPAD!

### What You'll Have
- Teammate AI (actually helps you!)
- BLESSED! mode (score 3 in a row = power up!)
- Help screen (press ? for controls)
- Touch controls for iPad
- Complete, polished game!

### Parallel Agents

**Agent 3A: Teammate AI**
```
Update teammate behavior in GameScene.js:
- When you have ball: teammate moves to open space
- When opponent has ball: teammate helps defend
- When ball is loose: teammate chases it
- Stay ~150px away from human player (don't crowd)
- Teammate should feel helpful, not annoying
```

**Agent 3B: BLESSED! Mode**
```
Add streak system to GameScene.js:
- Track consecutive baskets per team
- At 3 in a row:
  - Flash "BLESSED!" in big gold text
  - Add gold circle glow behind team's players
  - Speed boost: multiply speed by 1.3
  - Accuracy boost: add 20% to shot accuracy
- Opponent scores = streak resets, effects removed
```

**Agent 3C: Help + Touch Controls**
```
Add to GameScene.js:

Help overlay:
- Press ? = toggle help overlay
- Dark semi-transparent background
- Show: "WASD=Move, Space=Shoot, E=Pass, Tab=Switch"
- Press ? again to close

Touch controls (only on touch devices):
- Left side: virtual joystick (white circles)
- Right side: SHOOT button (red, big), PASS button (blue, smaller)
- Bottom right: ? button for help
- All controls fixed to screen (setScrollFactor 0)
```

### Testing Agent
```
After all agents complete:
1. npm run dev
2. Verify: Teammate moves on their own
3. Verify: Teammate chases loose balls
4. Score 3 baskets in a row
5. Verify: "BLESSED!" appears
6. Verify: Gold glow on players
7. Verify: Players feel faster
8. Let opponent score, verify BLESSED ends
9. Press ? - verify help shows
10. Press ? again - verify help hides
11. Test on iPad or Chrome mobile emulation
12. Verify: Touch joystick moves player
13. Verify: Touch buttons work
Report PASS/FAIL
```

### 🎮 FAMILY PLAYTEST 3: THE BIG ONE!

**Play on the iPad!**
- Everyone takes turns
- Try to get BLESSED! mode
- **6yo names the power-up**: "BLESSED!" or something else?
- **12yo rates**: 1-10, how fun is this game?

**Celebrate**: You built a game together! 🎉

---

# 🎉 MVP COMPLETE! 🎉

You now have:
- ✅ 2v2 basketball game
- ✅ Smart AI opponents
- ✅ Helpful teammate
- ✅ Scoreboard + timer
- ✅ BLESSED! power-up mode
- ✅ Touch controls for iPad
- ✅ Help screen

---

# BONUS ROUNDS (If You Want More!)

After MVP, family picks what's next:

| Feature | Fun Factor | Build Time |
|---------|-----------|------------|
| 🔊 Sound effects + "BOOMSHAKALAKA!" | ⭐⭐⭐⭐⭐ | 20 min |
| 🎨 Real character sprites | ⭐⭐⭐⭐ | 45 min |
| ⚡ Special moves (Jordan fadeaway, Moses staff slam) | ⭐⭐⭐⭐⭐ | 30 min |
| 👥 Team select screen | ⭐⭐⭐ | 25 min |
| 🏟️ Different courts | ⭐⭐⭐ | 20 min |

**Let the kids pick!**

---

# HOW TO RUN

## Existing Setup
The project already has:
- ✅ package.json, vite.config.js, index.html (keep these)
- ✅ src/main.js (keep - just update physics gravity)
- ⚠️ src/scenes/GameScene.js (OVERWRITE - old version is wrong perspective)
- ⚠️ src/entities/*.js (DELETE or ignore - we'll keep it simple in GameScene.js)
- ⚠️ src/systems/*.js (DELETE or ignore - we'll build fresh)

## Start
```bash
cd ~/bball-art/game && claude --dangerously-skip-permissions
```

## Paste This
```
Read /Users/simonbrief/bball-art/game/PLAN-COMPLETE.md

FIRST: Clean up the old (wrong) code:
1. Update src/main.js to add gravity: { y: 800 } in physics config
2. Delete or ignore files in src/entities/ and src/systems/ (we're starting fresh)
3. We'll rewrite GameScene.js from scratch

THEN: Execute BUILD 1 using parallel agents (1A and 1B simultaneously).
After both complete, run the Testing Agent checks.
Report results and wait for my feedback.

When I say "NEXT", proceed to BUILD 2.
When I say "NEXT" again, proceed to BUILD 3.

If anything breaks, tell me what's wrong and suggest a fix.
Keep the code simple - everything in GameScene.js for now.
```

---

# QUICK REFERENCE

## Controls
| Key | Action |
|-----|--------|
| WASD/Arrows | Move |
| Space | Jump / Shoot |
| E | Pass |
| Tab | Switch player |
| ? | Help |

## Difficulty Knobs
```javascript
player.speed = 250;        // Higher = faster
player.jumpPower = -400;   // More negative = higher jump
ai.speed = 200;            // Higher = harder AI
ai.accuracy = 0.6;         // Higher = AI scores more
hoopRadius = 20;           // Bigger = easier to score
```

---

# TOTAL TIME

| Build | Build Time | Play Time |
|-------|-----------|-----------|
| Build 1 | ~20 min | 10 min |
| Build 2 | ~30 min | 15 min |
| Build 3 | ~25 min | 15 min |
| **Total** | **~75 min** | **40 min** |

**That's a complete game in under 2 hours, with 40 minutes of family play time!**

---

🏀 Ready to build? Say the word! 🏀
