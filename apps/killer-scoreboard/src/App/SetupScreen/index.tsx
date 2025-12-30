import type { FunctionalComponent } from 'preact';
import { useSignal } from '@preact/signals';
import type { GameMode, Player } from '../../types';
import './styles.css';

interface SetupScreenProps {
  initialPlayers?: Player[];
  initialStartingLives?: number;
  initialGameMode?: GameMode;
  onStartGame: (
    players: Player[],
    startingLives: number,
    gameMode: GameMode
  ) => void;
}

const SetupScreen: FunctionalComponent<SetupScreenProps> = ({
  initialPlayers = [],
  initialStartingLives = 3,
  initialGameMode = 'cards-killer',
  onStartGame,
}) => {
  const playerName = useSignal('');
  const players = useSignal<Player[]>(initialPlayers);
  const startingLives = useSignal(initialStartingLives);
  const gameMode = useSignal<GameMode>(initialGameMode);

  const addPlayer = () => {
    const name = playerName.value.trim();
    if (!name) return;

    const newPlayer: Player = {
      id: `player-${Date.now()}`,
      name,
      // The lives will be set when the game starts
      lives: 0,
    };

    players.value = [...players.value, newPlayer];
    playerName.value = '';
  };

  const removePlayer = (id: string) => {
    players.value = players.value.filter((p) => p.id !== id);
  };

  const handleStartGame = () => {
    if (players.value.length < 2) {
      alert('You need at least 2 players to start the game');
      return;
    }
    onStartGame(
      players.value.map((p) => ({ ...p, lives: startingLives.value })),
      startingLives.value,
      gameMode.value
    );
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPlayer();
    }
  };

  return (
    <div class="setup-screen">
      <h1>Killer Pool Scoreboard</h1>

      <div class="setup-section">
        <h2>Game Settings</h2>

        <div class="setting">
          <label htmlFor="starting-lives">Starting Lives:</label>
          <input
            id="starting-lives"
            type="number"
            min="1"
            max="10"
            value={startingLives}
            onInput={(e) => {
              const value = parseInt((e.target as HTMLInputElement).value);
              if (value >= 1 && value <= 10) {
                startingLives.value = value;
              }
            }}
          />
        </div>

        <div class="setting">
          <label htmlFor="game-mode">Game Mode:</label>
          <select
            id="game-mode"
            value={gameMode}
            onChange={(e) => {
              gameMode.value = (e.target as HTMLSelectElement)
                .value as GameMode;
            }}
          >
            <option value="cards-killer">Cards Killer</option>
            <option value="classic">Classic</option>
          </select>
        </div>
      </div>

      <div class="setup-section">
        <h2>Players ({players.value.length})</h2>

        <div class="add-player">
          <input
            type="text"
            placeholder="Enter player name"
            value={playerName}
            onInput={(e) => {
              playerName.value = (e.target as HTMLInputElement).value;
            }}
            onKeyDown={handleKeyDown}
          />
          <button onClick={addPlayer} class="btn-add">
            Add Player
          </button>
        </div>

        {players.value.length > 0 && (
          <ul class="player-list">
            {players.value.map((player) => (
              <li key={player.id} class="player-item">
                <span class="player-name">{player.name}</span>
                <button
                  onClick={() => removePlayer(player.id)}
                  class="btn-remove"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={handleStartGame}
        class="btn-start"
        disabled={players.value.length < 2}
      >
        Start Game
      </button>
    </div>
  );
};

export default SetupScreen;
