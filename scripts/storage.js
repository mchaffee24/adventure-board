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
  return saved ? JSON.parse(saved) : null;
}

export function saveTransactions(transactions) {
  sessionStorage.setItem(TRANSACTION_KEY, JSON.stringify(transactions));
}

export function upsertTransaction(transaction) {
  const transactions = getSavedTransactions() || [];
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
  const transactions = (getSavedTransactions() || []).filter((item) => item.id !== transactionId);
  saveTransactions(transactions);
  return transactions;
}

export function getSettings() {
  const saved = sessionStorage.getItem(SETTINGS_KEY);

  return saved
    ? JSON.parse(saved)
    : {
        startingBalance: 725,
        weeklyIncome: 210,
        weeklyGoal: 125
      };
}

export function saveSettings(settings) {
  sessionStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
