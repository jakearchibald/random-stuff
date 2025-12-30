import type { FunctionalComponent } from 'preact';
import { useSignal } from '@preact/signals';
import { useEffect, useMemo } from 'preact/hooks';
import type { GameMode, GameState, Player } from '../types';
import { createInitialState } from '../types';
import { loadGameState, saveGameState, clearGameState } from '../storage';
import {
  generateTurnOrder,
  getNextPlayerTurn,
  checkForWinner,
} from '../game-logic';
import SetupScreen from './SetupScreen';
import GameScreen from './GameScreen';
import EndScreen from './EndScreen';
import './styles.css';

const App: FunctionalComponent = () => {
  const initialGameState = useMemo(() => loadGameState(), []);
  const gameState = useSignal<GameState>(initialGameState);

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveGameState(gameState.value);
  }, [gameState.value]);

  const handleStartGame = (
    players: Player[],
    startingLives: number,
    gameMode: GameMode
  ) => {
    const turnOrder = generateTurnOrder(players, gameMode);

    document.startViewTransition({
      types: ['regular'],
      update: async () => {
        gameState.value = {
          screen: 'active',
          players,
          startingLives,
          gameMode,
          currentPlayerIndex: 0,
          turnOrder,
          turnOrderIndex: 0,
          winner: null,
        };

        await 0;
      },
    });
  };

  const handleAddLife = () => {
    const state = gameState.value;
    const currentPlayerId = state.turnOrder[state.turnOrderIndex];
    const updatedPlayers = state.players.map((p) =>
      p.id === currentPlayerId ? { ...p, lives: p.lives + 1 } : p
    );

    gameState.value = {
      ...state,
      players: updatedPlayers,
    };
  };

  const handleRemoveLife = () => {
    const state = gameState.value;
    const currentPlayerId = state.turnOrder[state.turnOrderIndex];
    const updatedPlayers = state.players.map((p) =>
      p.id === currentPlayerId && p.lives > 0 ? { ...p, lives: p.lives - 1 } : p
    );

    gameState.value = {
      ...state,
      players: updatedPlayers,
    };
  };

  const handleEndTurn = () => {
    const state = gameState.value;
    const nextTurn = getNextPlayerTurn(
      state.players,
      state.turnOrder,
      state.turnOrderIndex,
      state.gameMode
    );

    if (!nextTurn) {
      // Game over - find winner
      const winner = checkForWinner(state.players);
      document.startViewTransition({
        types: ['regular'],
        update: async () => {
          gameState.value = {
            ...state,
            screen: 'ended',
            winner,
          };

          await 0;
        },
      });

      return;
    }

    document.startViewTransition({
      types: ['player-switch'],
      update: async () => {
        gameState.value = {
          ...state,
          turnOrder: nextTurn.newTurnOrder,
          turnOrderIndex: nextTurn.newIndex,
        };

        await 0;
      },
    });
  };

  const handleEndGame = () => {
    const state = gameState.value;
    const winner = checkForWinner(state.players);
    document.startViewTransition({
      types: ['regular'],
      update: async () => {
        gameState.value = {
          ...state,
          screen: 'ended',
          winner,
        };

        await 0;
      },
    });
  };

  const handleNewGame = () => {
    document.startViewTransition({
      types: ['regular'],
      update: async () => {
        clearGameState();
        gameState.value = createInitialState();
        await 0;
      },
    });
  };

  const handleSamePlayers = () => {
    const state = gameState.value;
    const resetPlayers = state.players.map((p) => ({
      ...p,
      lives: state.startingLives,
    }));
    const turnOrder = generateTurnOrder(resetPlayers, state.gameMode);

    document.startViewTransition({
      types: ['regular'],
      update: async () => {
        gameState.value = {
          ...state,
          screen: 'active',
          players: resetPlayers,
          turnOrder,
          turnOrderIndex: 0,
          winner: null,
        };

        await 0;
      },
    });
  };

  const getCurrentPlayerId = (): string => {
    const state = gameState.value;
    return state.turnOrder[state.turnOrderIndex] || '';
  };

  const getWinnerPlayer = (): Player | null => {
    const state = gameState.value;
    if (!state.winner) return null;
    return state.players.find((p) => p.id === state.winner) || null;
  };

  return (
    <div class="app">
      {gameState.value.screen === 'setup' && (
        <SetupScreen onStartGame={handleStartGame} />
      )}
      {gameState.value.screen === 'active' && (
        <GameScreen
          players={gameState.value.players}
          currentPlayerId={getCurrentPlayerId()}
          onAddLife={handleAddLife}
          onRemoveLife={handleRemoveLife}
          onEndTurn={handleEndTurn}
          onEndGame={handleEndGame}
        />
      )}
      {gameState.value.screen === 'ended' && (
        <EndScreen
          winner={getWinnerPlayer()}
          onNewGame={handleNewGame}
          onSamePlayers={handleSamePlayers}
        />
      )}
    </div>
  );
};

export default App;
