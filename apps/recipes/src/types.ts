export interface AppState {
  selectedRecipes: Map<string, number>;
}

export const createInitialState = (): AppState => ({
  selectedRecipes: new Map(),
});
