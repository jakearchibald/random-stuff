import type { FunctionalComponent } from 'preact';
import type { Player } from '../../types';
import './styles.css';

interface GameScreenProps {
  players: Player[];
  currentPlayerId: string;
  onAddLife: () => void;
  onRemoveLife: () => void;
  onEndTurn: () => void;
  onEndGame: () => void;
}

const GameScreen: FunctionalComponent<GameScreenProps> = ({
  players,
  currentPlayerId,
  onAddLife,
  onRemoveLife,
  onEndTurn,
  onEndGame,
}) => {
  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const activePlayers = players.filter((p) => p.lives > 0);
  const eliminatedPlayers = players.filter((p) => p.lives === 0);

  const handleEndGame = () => {
    if (confirm('Are you sure you want to end the game early?')) {
      onEndGame();
    }
  };

  return (
    <div class="game-screen">
      <div class="current-turn">
        <h2>Current Turn</h2>
        <div class="current-player">
          <div class="current-player-name">{currentPlayer?.name}</div>
          <div class="current-player-lives">
            {currentPlayer?.lives}{' '}
            {currentPlayer?.lives === 1 ? 'life' : 'lives'}
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
              <span class="player-lives">
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
                  <span class="eliminated-badge">Eliminated</span>
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
