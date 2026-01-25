export interface StoredAppState {
  selectedRecipes: Map<string, number>;
}

export const createInitialStoredState = (): StoredAppState => ({
  selectedRecipes: new Map(),
});
