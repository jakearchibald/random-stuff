# Recipes

Build a web app that allows filtering and selecting recipes from a list, and creating a combined shopping list.

## User experience

Display a text area, and a list of recipes below it. The recipes are in `src/recipes.ts`.

If text is entered, filter the list of recipes to only those that match the text. Matching should be case-insensitive, and match if the text appears anywhere in the recipe name.

If text is not entered, show all recipes.

A following section shows the selected recipes. These also have checkboxes to allow unselecting them.

Below that, show a shopping list that combines the ingredients from all selected recipes. If the ingredient value is a number, sum the numbers for that ingredient across all selected recipes. If it's a boolean, just show it once.

Include a reset button at the bottom to clear all state and start again. Prompt the user to confirm before clearing state.

## Technology

See `killer-scoreboard` for the structure of the app - follow the same patterns.

It's Preact. But use signals rather than `useState` hooks.

Store the state in `localStorage` so that a page reload doesn't lose the state.
