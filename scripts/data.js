export const categoryDetails = {};

export async function fetchBudgetConfig() {
  const response = await fetch("./data/budget-config.json");

  if (!response.ok) {
    throw new Error(`Budget configuration failed to load: ${response.status}`);
  }

  return response.json();
}

export function applyBudgetConfig(config) {
  Object.assign(categoryDetails, config.categories);
}
