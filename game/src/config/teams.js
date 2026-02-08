// Team configurations pulled from existing Court & Covenant pairings
export const TEAMS = {
  team1: {
    name: 'Jordan & Moses',
    color: 0xe63946, // Red
    colorHex: '#e63946',
    players: [
      {
        id: 'jordan',
        name: 'JORDAN',
        speed: 280,
        shootAccuracy: 0.85,
        signature: 'fadeaway'
      },
      {
        id: 'moses',
        name: 'MOSES',
        speed: 240,
        shootAccuracy: 0.75,
        signature: 'staff'
      }
    ]
  },
  team2: {
    name: 'LeBron & David',
    color: 0x7b2cbf, // Purple
    colorHex: '#7b2cbf',
    players: [
      {
        id: 'lebron',
        name: 'LEBRON',
        speed: 270,
        shootAccuracy: 0.80,
        signature: 'chasedown'
      },
      {
        id: 'david',
        name: 'DAVID',
        speed: 260,
        shootAccuracy: 0.78,
        signature: 'sling'
      }
    ]
  }
};

export const GAME_CONFIG = {
  quarterLength: 120, // 2 minutes in seconds
  pointsPerBasket: 2,
  courtWidth: 1100,
  courtHeight: 600,
  playerSize: 40,
  ballSize: 20
};
