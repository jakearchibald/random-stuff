import type { FunctionalComponent } from 'preact';
import type { GameMode, Player } from '../../types';
import './styles.css';

interface GameScreenProps {
  players: Player[];
  currentPlayerId: string;
  gameMode: GameMode;
  turnOrder: string[];
  turnOrderIndex: number;
  onAddLife: () => void;
  onRemoveLife: () => void;
  onEndTurn: () => void;
  onEndGame: () => void;
}

const GameScreen: FunctionalComponent<GameScreenProps> = ({
  players,
  currentPlayerId,
  gameMode,
  turnOrder,
  turnOrderIndex,
  onAddLife,
  onRemoveLife,
  onEndTurn,
  onEndGame,
}) => {
  const currentPlayer = players.find((p) => p.id === currentPlayerId)!;
  const activePlayers = players.filter(
    (p) => p.lives > 0 || p.id === currentPlayerId
  );
  const eliminatedPlayers = players.filter(
    (p) => p.lives === 0 && p.id !== currentPlayerId
  );

  // Calculate remaining cards for each player in cards-killer mode
  const getRemainingCards = (playerId: string): number => {
    if (gameMode !== 'cards-killer') return 0;

    // Count occurrences of this player in the remaining turn order (including current turn)
    const remainingTurns = turnOrder.slice(turnOrderIndex + 1);
    return remainingTurns.filter((id) => id === playerId).length;
  };

  const handleEndGame = () => {
    if (confirm('Are you sure you want to end the game early?')) {
      onEndGame();
    }
  };

  return (
    <div class="game-screen">
      <div class="current-turn">
        <div class="current-player">
          <div class="current-player-name">{currentPlayer.name}</div>
          <div
            class={`current-player-lives ${
              currentPlayer.lives <= 1 ? 'danger' : ''
            }`}
          >
            {currentPlayer.lives} {currentPlayer.lives === 1 ? 'life' : 'lives'}
          </div>
        </div>

        <div class="turn-controls">
          <button onClick={onAddLife} class="btn-life btn-add-life">
            +1 Life
          </button>
          <button onClick={onRemoveLife} class="btn-life btn-remove-life">
            -1 Life
          </button>
          <button onClick={onEndTurn} class="btn-end-turn">
            End Turn
          </button>
        </div>
      </div>

      <div class="players-section">
        <h3>Active Players</h3>
        <ul class="player-list">
          {activePlayers.map((player) => (
            <li
              key={player.id}
              class={`player-item ${
                player.id === currentPlayerId ? 'current' : ''
              }`}
              style={{ viewTransitionName: player.id }}
            >
              <span class="player-name">{player.name}</span>
              <span class="player-cards">
                {'♦️'.repeat(getRemainingCards(player.id))}
              </span>
              <span class={`player-lives ${player.lives <= 1 ? 'danger' : ''}`}>
                {player.lives} {player.lives === 1 ? 'life' : 'lives'}
              </span>
            </li>
          ))}
        </ul>

        {eliminatedPlayers.length > 0 && (
          <>
            <h3>Eliminated</h3>
            <ul class="player-list eliminated">
              {eliminatedPlayers.map((player) => (
                <li
                  key={player.id}
                  class="player-item"
                  style={{ viewTransitionName: player.id }}
                >
                  <span class="player-name">{player.name}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <button onClick={handleEndGame} class="btn-end-game">
        Abort game
      </button>
    </div>
  );
};

export default GameScreen;
