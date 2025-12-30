export type GameMode = 'classic' | 'cards-killer';
export type GameScreen = 'setup' | 'active' | 'ended';

export interface Player {
  id: string;
  name: string;
  lives: number;
}

export interface GameState {
  screen: GameScreen;
  players: Player[];
  startingLives: number;
  gameMode: GameMode;
  currentPlayerIndex: number;
  turnOrder: string[]; // Array of player IDs
  turnOrderIndex: number;
  winner: string | null; // Player ID
}

export const createInitialState = (): GameState => ({
  screen: 'setup',
  players: [],
  startingLives: 3,
  gameMode: 'cards-killer',
  currentPlayerIndex: 0,
  turnOrder: [],
  turnOrderIndex: 0,
  winner: null,
});
