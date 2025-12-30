import type { Player, GameMode } from './types';

/**
 * Shuffles an array in place using Fisher-Yates algorithm
 */
const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Generates the turn order array based on game mode
 */
export const generateTurnOrder = (
  players: Player[],
  gameMode: GameMode
): string[] => {
  const activePlayers = players.filter((p) => p.lives > 0);

  if (gameMode === 'classic') {
    // Classic mode: simple randomized player list
    return shuffleArray(activePlayers.map((p) => p.id));
  } else {
    // Cards killer mode: each player appears as many times as they have lives
    const turnOrder = activePlayers
      .map((player) => Array(player.lives).fill(player.id))
      .flat();

    return shuffleArray(turnOrder);
  }
};

/**
 * Gets the next player ID in the turn order, skipping eliminated players
 */
export const getNextPlayerTurn = (
  players: Player[],
  turnOrder: string[],
  currentIndex: number,
  gameMode: GameMode
): { playerId: string; newIndex: number; newTurnOrder: string[] } | null => {
  const activePlayers = players.filter((p) => p.lives > 0);

  // Game over if only one or no players remain
  if (activePlayers.length <= 1) {
    return null;
  }

  let newTurnOrder = turnOrder;
  let newIndex = currentIndex + 1;

  // Check if we've reached the end of the turn order
  if (newIndex >= turnOrder.length) {
    // Order is re-shuffed in cards-killer mode
    if (gameMode === 'cards-killer') {
      newTurnOrder = generateTurnOrder(players, gameMode);
    }
    newIndex = 0;
  }

  const nextPlayerId = newTurnOrder[newIndex];
  const nextPlayer = players.find((p) => p.id === nextPlayerId);

  // Skip eliminated players
  if (!nextPlayer || nextPlayer.lives <= 0) {
    return getNextPlayerTurn(players, newTurnOrder, newIndex, gameMode);
  }

  return {
    playerId: nextPlayerId,
    newIndex,
    newTurnOrder,
  };
};

/**
 * Checks if the game has a winner (only one player with lives remaining)
 */
export const checkForWinner = (players: Player[]): string | null => {
  const activePlayers = players.filter((p) => p.lives > 0);

  if (activePlayers.length === 1) {
    return activePlayers[0].id;
  }

  return null;
};
