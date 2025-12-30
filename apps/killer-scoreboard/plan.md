# Killer scoreboard

Build a web app for tracking a game of Killer Pool (UK 'cards killer' and 'classic' rules).

## User experience

The app starts with players being selected. Two or more players are allowed. There's no upper limit. All a player needs is a name.

The game options include the number of lives each player starts with (default 3) and the game type (cards killer or classic).

Then, the game can be started.

The app shows a list of all the players, and their current lives. If they have zero lives, they are marked as 'eliminated' in some way.

At the top of the app, while the game is active, it display the current player's turn. There are a series of buttons:

- '+1 life' - gain a life
- '-1 life' - remove a life
- 'End turn' - end the current player's turn

Another button at the bottom of the app can end the game early. There should be a confirmation prompt before doing so.

Once a turn ends, and only one player has lives remaining, the game ends and that player is declared the winner.

## Deciding whose turn it is

### Classic mode

In 'classic' mode, the player list is randomised at the start of the game. Turns proceed through the list in order, looping back to the start when the end is reached.

Players with zero lives are skipped.

### Cards killer mode

In 'cards killer', an array is built up where each player appears as many times as they have lives remaining. For example, if there are three players (A, B, C) with 3, 2, and 1 lives respectively, the turn order array would be:

```
[A, A, A, B, B, C]
```

The array is then shuffled randomly, and turns proceed through the array in order.

When the end of the array is reached, a new turn order array is built based on the current lives, and shuffled again.

Players with zero lives are skipped.

## Technology

See `teleprompter` for the structure of the app - follow the same patterns.

It's Preact. But use signals rather than `useState` hooks.

Store the game state in `localStorage` so that a page reload doesn't lose the game.
