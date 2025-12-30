import type { FunctionalComponent } from 'preact';
import type { Player } from '../../types';
import './styles.css';

interface EndScreenProps {
  winner: Player | null;
  onNewGame: () => void;
  onSamePlayers: () => void;
}

const EndScreen: FunctionalComponent<EndScreenProps> = ({
  winner,
  onNewGame,
  onSamePlayers,
}) => {
  return (
    <div class="end-screen">
      <div class="winner-announcement">
        {winner ? (
          <>
            <h1 class="winner-title">Winner!</h1>
            <div class="winner-name">{winner.name}</div>
            <p class="winner-subtitle">Congratulations!</p>
          </>
        ) : (
          <>
            <h1 class="game-ended-title">Game Ended</h1>
            <p class="game-ended-subtitle">No winner</p>
          </>
        )}
      </div>

      <div class="end-actions">
        <button onClick={onSamePlayers} class="btn-same-players">
          Play Again (Same Players)
        </button>
        <button onClick={onNewGame} class="btn-new-game">
          New Game
        </button>
      </div>
    </div>
  );
};

export default EndScreen;
