# Pairing Creation Assistant

AI-powered tool for creating new Court & Covenant pairings.

## Overview

Located on the **Pairings page** (`/pairings.html`), this tool helps users:
- Create new player + biblical figure pairings
- Discover matching characters based on archetypes
- Find opposing pairs for hero-villain dynamics
- Auto-generate all required JSON files

## Five Input Modes

| Mode | User Provides | AI Returns |
|------|---------------|------------|
| **Full Pairing** | Player + Figure (connection optional) | Connection narrative + hero/villain typing |
| **Find a Figure** | Just the player | 3-5 matching biblical figures with reasons |
| **Find a Player** | Just the figure | 3-5 matching NBA players with reasons |
| **Discover Heroes** | Nothing | New hero pairings based on unused characters |
| **Discover Opposites** | Nothing | Hero-villain opposing pairings |

---

## Mode Details

### Mode 1: Full Pairing

User provides player and figure. Connection is optional - AI will suggest if not provided.

**Input:**
```
Player: Patrick Beverley
Figure: Shimei
Connection: [blank]
```

**AI Output:**
```
SUGGESTED CONNECTIONS

1. "Both were relentless agitators who got under everyone's skin.
    Shimei cursed David. Beverley gets in every star's head."
   Type: VILLAIN

2. "Pests with purpose. Neither backing down from anyone
    regardless of status."
   Type: VILLAIN

[SELECT] or [REGENERATE]
```

AI also suggests whether it's a **hero** or **villain** pairing based on the narrative.

### Mode 2: Find a Figure

User provides only the player. AI suggests matching biblical figures.

**Input:**
```
Player: Allen Iverson
```

**AI Output:**
```
SUGGESTED FIGURES

1. Gideon
   "300 warriors defeated armies. 6'0" defeated giants.
    Both used unconventional warfare."
   Type: HERO

2. David (young)                    ⚠️ ALREADY PAIRED
   "Smallest on the field, biggest heart"
   Currently paired with: LeBron James

3. Ehud
   "Left-handed assassin, unexpected moves"
   Type: HERO
```

### Mode 3: Find a Player

User provides only the figure. AI suggests matching NBA players.

**Input:**
```
Figure: Ruth
```

**AI Output:**
```
SUGGESTED PLAYERS

1. Giannis Antetokounmpo
   "Immigrant who became champion through loyalty and work"
   Type: HERO

2. Hakeem Olajuwon                  ⚠️ ALREADY PAIRED
   "Called from another land, became dynasty founder"
   Currently paired with: Abraham

3. Dirk Nowitzki                    ⚠️ ALREADY PAIRED
   "Foreigner who won it all in adopted home"
   Currently paired with: Judah Maccabee
```

### Mode 4: Discover Heroes

AI analyzes unused characters and gaps in the roster to suggest new hero pairings.

**AI Output:**
```
SUGGESTED HERO PAIRINGS

1. Iverson + Gideon
   "Both were undersized warriors who defeated overwhelming
    odds through unconventional tactics"

2. Wembanyama + Enoch
   "Transcendent beings who exist on a different plane"

3. Barkley + Caleb
   "Undersized believers who saw victory where others saw defeat"
```

### Mode 5: Discover Opposites

AI finds natural hero-villain tensions, especially pairs that oppose existing pairings.

**AI Output:**
```
OPPOSING PAIRINGS

1. James Harden + Delilah
   "Both extracted secrets and left destruction. Delilah
    betrayed Samson. Harden forces his way out."
   Type: VILLAIN
   ⚠️ Creates rivalry with: Wilt/Samson

2. Pat Riley + Laban
   "Masterminds who made stars work for years. Laban
    tricked Jacob. Riley's contracts are legendary."
   Type: VILLAIN
   ⚠️ Creates rivalry with: Bird/Jacob

3. Kyrie Irving + Korah
   "Challengers of authority. Korah rebelled against Moses.
    Kyrie questions everything."
   Type: VILLAIN
   ⚠️ Creates rivalry with: Jordan/Moses
```

The "Creates rivalry with" flag identifies when a new villain pairing naturally opposes an existing hero pairing.

---

## Alternate Pairings

Characters can appear in multiple pairings. When a character is already paired:

1. **Warning shown** - "⚠️ Already paired with [other character]"
2. **Creation allowed** - User can proceed anyway
3. **Marked in data** - `isAlternate: true` in the pairing JSON

### Example

```json
{
  "id": "lebron-david",
  "isAlternate": false,
  "type": "hero"
}

{
  "id": "lebron-joseph",
  "isAlternate": true,
  "alternateOf": "lebron-david",
  "type": "hero"
}
```

---

## Data Model

### Pairing JSON (Updated)

New fields for alternate and opposing pairings:

```json
{
  "id": "harden-delilah",
  "series": "court-covenant",
  "type": "villain",
  "isAlternate": false,
  "alternateOf": null,
  "opposingPairing": "wilt-samson",
  "player": { ... },
  "figure": { ... },
  "connection": { ... }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `isAlternate` | boolean | True if either character has a primary pairing elsewhere |
| `alternateOf` | string/null | ID of the primary pairing this relates to |
| `opposingPairing` | string/null | ID of a hero pairing this villain opposes |

### Character Index

New file tracking character usage: `data/character-index.json`

```json
{
  "players": {
    "lebron": {
      "pairings": ["lebron-david", "lebron-joseph"],
      "primaryPairing": "lebron-david"
    }
  },
  "figures": {
    "samson": {
      "pairings": ["wilt-samson"],
      "primaryPairing": "wilt-samson",
      "opposingFigures": ["delilah"]
    },
    "delilah": {
      "pairings": [],
      "opposingFigures": ["samson"]
    }
  }
}
```

---

## Auto-Generation

When user clicks "Create This Pairing":

1. **Check existing files**
   - Does player pose file exist?
   - Does figure pose file exist?
   - Does figure quotes file exist?

2. **Generate missing files**
   - AI creates poses based on player/figure archetype
   - AI creates quotes from biblical sources
   - Uses existing templates as structure

3. **Create pairing JSON**
   - All connection data
   - Proper `isAlternate` and `opposingPairing` flags

4. **Update character index**
   - Add to character's pairing list
   - Set primary if first pairing

5. **Success feedback**
   - Show created files
   - Link to Generator UI to create first card

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pairing-assistant/suggest` | Get AI suggestions based on mode |
| POST | `/api/pairing-assistant/create` | Auto-generate pairing files |
| GET | `/api/pairing-assistant/characters` | List all characters with pairing status |
| GET | `/api/pairing-assistant/unused` | List unused players and figures |

### POST /api/pairing-assistant/suggest

**Request:**
```json
{
  "mode": "full-pairing|find-figure|find-player|discover-heroes|discover-opposites",
  "player": "Allen Iverson",
  "figure": "Gideon",
  "connection": ""
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "player": "Allen Iverson",
      "figure": "Gideon",
      "connection": {
        "thematic": "Both were undersized warriors...",
        "narrative": "6'0\" against giants. 300 against thousands.",
        "relationship": "Unconventional warriors who rewrote the rules"
      },
      "type": "hero",
      "playerAlreadyPaired": false,
      "figureAlreadyPaired": false,
      "opposingPairing": null
    }
  ]
}
```

### POST /api/pairing-assistant/create

**Request:**
```json
{
  "player": "Allen Iverson",
  "figure": "Gideon",
  "connection": { ... },
  "type": "hero"
}
```

**Response:**
```json
{
  "success": true,
  "pairingId": "iverson-gideon",
  "filesCreated": [
    "data/poses/players/iverson.json",
    "data/poses/figures/gideon.json",
    "data/quotes/figures/gideon.json",
    "data/series/court-covenant/pairings/iverson-gideon.json"
  ],
  "generatorUrl": "/generator.html?pairing=iverson-gideon"
}
```

---

## UI Components

### Main Interface

```
┌─────────────────────────────────────────────────────┐
│  CREATE NEW PAIRING                            [?]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Mode:                                              │
│  ● Full Pairing    ○ Find Figure    ○ Find Player  │
│  ○ Discover Heroes    ○ Discover Opposites          │
│                                                     │
│  Player: [_________________________] ▼              │
│  Figure: [_________________________] ▼              │
│  Connection: [optional - AI will suggest]           │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [GENERATE SUGGESTIONS]                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Suggestion Card

```
┌─────────────────────────────────────────────────────┐
│  Allen Iverson + Gideon                      HERO   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  "Both were undersized warriors who defeated        │
│   overwhelming odds through unconventional          │
│   tactics. 6'0" against giants. 300 against         │
│   thousands."                                       │
│                                                     │
│  ⚠️ Iverson already paired with: [none]            │
│  ⚠️ Gideon already paired with: [none]             │
│                                                     │
│  [CREATE THIS PAIRING]    [TRY ANOTHER]            │
└─────────────────────────────────────────────────────┘
```

### Opposing Pairing Card

```
┌─────────────────────────────────────────────────────┐
│  James Harden + Delilah                   VILLAIN   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  "Both extracted secrets and left destruction.      │
│   Delilah betrayed Samson for silver. Harden        │
│   forces his way out of every situation."           │
│                                                     │
│  ⚔️ OPPOSES: Wilt Chamberlain + Samson             │
│                                                     │
│  [CREATE THIS PAIRING]    [TRY ANOTHER]            │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Backend
- [ ] AI suggestion endpoint using Gemini
- [ ] Character index generation
- [ ] Unused character listing

### Phase 2: Auto-Generation
- [ ] Pose file generation from AI
- [ ] Quote file generation from Sefaria + AI
- [ ] Pairing JSON creation
- [ ] Character index updates

### Phase 3: Frontend
- [ ] Add creation UI to pairings page
- [ ] Mode selector
- [ ] Player/figure search/dropdown
- [ ] Suggestion display cards
- [ ] Create button with loading state

### Phase 4: Polish
- [ ] Error handling
- [ ] Validation
- [ ] Success feedback with generator link
- [ ] Discovery mode refinements

---

## AI Prompt Templates

### Full Pairing Suggestion

```
You are helping create thematic pairings between NBA players and biblical figures.

Given this player and figure, suggest 2-3 thematic connections.

Player: {player_name}
- Era: {era}
- Position: {position}
- Archetype: {archetype}
- Known for: {signature_traits}

Biblical Figure: {figure_name}
- Story: {story_summary}
- Key traits: {traits}

For each suggestion provide:
1. A 2-3 sentence narrative connection
2. A tagline (under 15 words)
3. Whether this is a HERO or VILLAIN pairing
4. If relevant, which existing pairing this might oppose

Existing pairings for context: {existing_pairings}

Return as JSON array.
```

### Find Matching Figure

```
You are helping find biblical figures that match an NBA player's archetype.

Player: {player_name}
- Era: {era}
- Archetype: {archetype}
- Known for: {traits}

Available biblical figures (not yet paired):
{unused_figures}

Already paired figures (can still suggest, but note the conflict):
{paired_figures}

Suggest 3-5 matching figures with:
1. Figure name
2. Why they match (2-3 sentences)
3. Hero or villain pairing
4. If already paired, note the existing pairing

Return as JSON array, best matches first.
```

### Discover Opposites

```
You are finding hero-villain opposing pairings for a basketball card series.

Existing hero pairings:
{hero_pairings}

Available villain figures:
{villain_figures}

Available players who could be villains:
{potential_villain_players}

Find 3-5 villain pairings that would naturally OPPOSE existing hero pairings.
Focus on narrative tension (betrayer vs betrayed, mocker vs mocked, etc.)

For each suggestion:
1. Player + Figure
2. Connection narrative
3. Which hero pairing it opposes and why
4. The rivalry angle

Return as JSON array.
```
