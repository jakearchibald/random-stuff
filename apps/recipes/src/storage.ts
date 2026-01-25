import type { StoredAppState } from './types';
import { createInitialStoredState } from './types';

const STORAGE_KEY = 'recipes-app-state';

export const loadAppState = (): StoredAppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        selectedRecipes: new Map(parsed.selectedRecipes || []),
      };
    }
  } catch (error) {
    console.error('Failed to load app state:', error);
  }
  return createInitialStoredState();
};

export const saveAppState = (state: StoredAppState): void => {
  try {
    const toStore = {
      selectedRecipes: Array.from(state.selectedRecipes),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (error) {
    console.error('Failed to save app state:', error);
  }
};

export const clearAppState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear app state:', error);
  }
};
