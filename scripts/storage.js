const USER_KEY = "spendSignalUser";
const TRANSACTION_KEY = "spendSignalTransactions";
const SETTINGS_KEY = "spendSignalSettings";

export function getCurrentUser() {
  return sessionStorage.getItem(USER_KEY);
}

export function setCurrentUser(username) {
  sessionStorage.setItem(USER_KEY, username);
}

export function clearCurrentUser() {
  sessionStorage.removeItem(USER_KEY);
}

export function getSavedTransactions() {
  const saved = sessionStorage.getItem(TRANSACTION_KEY);
  return saved ? JSON.parse(saved) : [];
}

export function saveTransactions(transactions) {
  sessionStorage.setItem(TRANSACTION_KEY, JSON.stringify(transactions));
}

export function upsertTransaction(transaction) {
  const transactions = getSavedTransactions();
  const index = transactions.findIndex((item) => item.id === transaction.id);

  if (index >= 0) {
    transactions.splice(index, 1, transaction);
  } else {
    transactions.push(transaction);
  }

  saveTransactions(transactions);
  return transactions;
}

export function removeTransaction(transactionId) {
  const transactions = getSavedTransactions().filter((item) => item.id !== transactionId);
  saveTransactions(transactions);
  return transactions;
}

export function getSettings(defaultSettings = {
  startingBalance: 0,
  incomeAmount: 0,
  incomeFrequency: "weekly",
  monthlySavingsGoal: 0,
  categoryPercents: {}
}) {
  const saved = sessionStorage.getItem(SETTINGS_KEY);

  if (!saved) {
    return defaultSettings;
  }

  const parsed = JSON.parse(saved);

  return {
    ...defaultSettings,
    ...parsed,
    incomeAmount: parsed.incomeAmount ?? parsed.weeklyIncome ?? defaultSettings.incomeAmount,
    incomeFrequency: parsed.incomeFrequency ?? "weekly",
    monthlySavingsGoal: parsed.monthlySavingsGoal ?? parsed.weeklyGoal ?? defaultSettings.monthlySavingsGoal,
    categoryPercents: {
      ...defaultSettings.categoryPercents,
      ...(parsed.categoryPercents || {})
    }
  };
}

export function saveSettings(settings) {
  sessionStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
