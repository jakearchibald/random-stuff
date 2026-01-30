import type { FunctionalComponent } from 'preact';
import { useSignal, useComputed } from '@preact/signals';
import { useEffect, useMemo } from 'preact/hooks';
import { recipes } from './recipes';
import { loadAppState, saveAppState, clearAppState } from './storage';
import type { StoredAppState } from './types';

const App: FunctionalComponent = () => {
  const initialState = useMemo(() => loadAppState(), []);
  const filterText = useSignal<string>('');
  const selectedRecipes = useSignal<Map<string, number>>(initialState.selectedRecipes);

  // Save to localStorage whenever selectedRecipes changes
  useEffect(() => {
    const state: StoredAppState = {
      selectedRecipes: selectedRecipes.value,
    };
    saveAppState(state);
  }, [selectedRecipes.value]);

  // Compute filtered recipes
  const filteredRecipes = useComputed(() => {
    const filter = filterText.value.toLowerCase();
    if (!filter) {
      return Object.keys(recipes);
    }
    return Object.keys(recipes).filter((name) =>
      name.toLowerCase().includes(filter)
    );
  });

  // Compute shopping list
  const shoppingList = useComputed(() => {
    const ingredients: Record<string, number | boolean> = {};

    for (const [recipeName, count] of selectedRecipes.value) {
      const recipe = recipes[recipeName];
      if (!recipe) continue;

      Object.entries(recipe).forEach(([ingredient, value]) => {
        if (typeof value === 'number') {
          const currentValue = ingredients[ingredient];
          if (typeof currentValue === 'number') {
            ingredients[ingredient] = currentValue + value * count;
          } else {
            ingredients[ingredient] = value * count;
          }
        } else if (typeof value === 'boolean' && value) {
          ingredients[ingredient] = true;
        }
      });
    }

    return Object.entries(ingredients).sort(([a], [b]) => a.localeCompare(b));
  });

  const handleFilterChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    filterText.value = target.value;
  };

  const handleAddRecipe = (recipeName: string) => {
    const newSelected = new Map(selectedRecipes.value);
    const currentCount = newSelected.get(recipeName) || 0;
    newSelected.set(recipeName, currentCount + 1);
    selectedRecipes.value = newSelected;
  };

  const handleRemoveRecipe = (recipeName: string) => {
    const newSelected = new Map(selectedRecipes.value);
    const currentCount = newSelected.get(recipeName) || 0;
    if (currentCount > 1) {
      newSelected.set(recipeName, currentCount - 1);
    } else {
      newSelected.delete(recipeName);
    }
    selectedRecipes.value = newSelected;
  };

  const handleReset = () => {
    if (
      confirm(
        'Are you sure you want to clear all selected recipes and start again?'
      )
    ) {
      clearAppState();
      filterText.value = '';
      selectedRecipes.value = new Map();
    }
  };

  const formatShoppingList = () => {
    const items = shoppingList.value.map(([ingredient, amount]) => {
      if (typeof amount === 'number') {
        return `${ingredient} × ${amount}`;
      }
      return ingredient;
    });
    return items.join('\n');
  };

  const handleAddToTodoist = () => {
    const content = encodeURIComponent(formatShoppingList());
    location.href = `todoist://addtask?content=${content}`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatShoppingList());
  };

  return (
    <div class="app">
      <h1>Recipe Shopping List</h1>

      <div class="filter-section">
        <input
          type="text"
          class="filter-input"
          placeholder="Filter recipes…"
          value={filterText.value}
          onInput={handleFilterChange}
        />
      </div>

      <h2>Available Recipes</h2>
      <div class="recipe-status">
        <span>
          {selectedRecipes.value.size} recipe{selectedRecipes.value.size !== 1 ? 's' : ''} selected
        </span>
        {selectedRecipes.value.size > 0 && (
          <button class="action-button reset-button" onClick={handleReset}>
            Reset All
          </button>
        )}
      </div>
      {filteredRecipes.value.length > 0 ? (
        <div class="recipe-list">
          {filteredRecipes.value.map((recipeName) => {
            const count = selectedRecipes.value.get(recipeName) || 0;
            return (
              <div key={recipeName} class="recipe-item">
                <span class="recipe-name">{recipeName}</span>
                <div class="recipe-controls">
                  {count > 0 && (
                    <>
                      <button
                        class="btn-minus"
                        onClick={() => handleRemoveRecipe(recipeName)}
                      >
                        −
                      </button>
                      <span class="recipe-count">{count}</span>
                    </>
                  )}
                  <button
                    class="btn-plus"
                    onClick={() => handleAddRecipe(recipeName)}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div class="empty-state">No recipes match your filter</div>
      )}

      {selectedRecipes.value.size > 0 && (
        <>
          <h2>Selected Recipes</h2>
          <div class="selected-recipes">
            <div class="selected-list">
              {Array.from(selectedRecipes.value).map(([recipeName, count]) => (
                <div key={recipeName} class="selected-item">
                  <span class="recipe-name">{recipeName}</span>
                  <div class="recipe-controls">
                    <button
                      class="btn-minus"
                      onClick={() => handleRemoveRecipe(recipeName)}
                    >
                      −
                    </button>
                    <span class="recipe-count">{count}</span>
                    <button
                      class="btn-plus"
                      onClick={() => handleAddRecipe(recipeName)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <h2>Shopping List</h2>
          <div class="shopping-list">
            <div class="ingredient-list">
              {shoppingList.value.map(([ingredient, amount]) => (
                <div key={ingredient} class="ingredient-item">
                  <span class="ingredient-name">{ingredient}</span>
                  {typeof amount === 'number' && (
                    <span class="ingredient-amount">× {amount}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {selectedRecipes.value.size > 0 && (
        <div class="action-buttons">
          <button class="action-button copy-button" onClick={handleCopy}>
            Copy
          </button>
          <button class="action-button todoist-button" onClick={handleAddToTodoist}>
            Add to Todoist
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
