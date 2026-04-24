import { applyBudgetConfig, categoryDetails, fetchBudgetConfig } from "./data.js";
import {
  clearCurrentUser,
  getCurrentUser,
  getSavedTransactions,
  getSettings,
  removeTransaction,
  saveSettings,
  saveTransactions,
  setCurrentUser,
  upsertTransaction
} from "./storage.js";
import {
  createCategoryOptions,
  createEmptyState,
  drawBarChart,
  drawTrendChart,
  formatCurrency,
  formatPercent,
  getCategoryLabel,
  renderAlert,
  renderCategoryCard,
  renderTransactionRow
} from "./ui.js";

const credentials = {
  username: "budget",
  password: "signal123"
};

const state = {
  transactions: [],
  filters: {
    search: "",
    category: "all",
    type: "all"
  },
  settings: {
    startingBalance: 0,
    weeklyIncome: 0,
    weeklyGoal: 0
  }
};

const elements = {
  balanceInput: document.querySelector("#starting-balance"),
  barChart: document.querySelector("#category-chart"),
  cancelEdit: document.querySelector("#cancel-edit"),
  categoryBreakdown: document.querySelector("#category-breakdown"),
  categoryFilter: document.querySelector("#category-filter"),
  editingId: document.querySelector("#editing-id"),
  filterForm: document.querySelector("#filter-form"),
  formCategory: document.querySelector("#transaction-category"),
  formType: document.querySelector("#transaction-type"),
  incomeInput: document.querySelector("#weekly-income"),
  insightList: document.querySelector("#insight-list"),
  jsonOutput: document.querySelector("#json-output"),
  loginForm: document.querySelector("#login-form"),
  logoutButton: document.querySelector("#logout-button"),
  monthlyIncome: document.querySelector("#monthly-income"),
  monthlyNet: document.querySelector("#monthly-net"),
  monthlySpending: document.querySelector("#monthly-spending"),
  runway: document.querySelector("#runway"),
  saveButton: document.querySelector("#save-transaction"),
  savingsGoalInput: document.querySelector("#weekly-goal"),
  searchInput: document.querySelector("#search-input"),
  sessionStatus: document.querySelector("#session-status"),
  settingsForm: document.querySelector("#settings-form"),
  transactionBody: document.querySelector("#transaction-body"),
  transactionCount: document.querySelector("#transaction-count"),
  transactionForm: document.querySelector("#transaction-form"),
  trendChart: document.querySelector("#trend-chart"),
  typeFilter: document.querySelector("#type-filter"),
  warningSummary: document.querySelector("#warning-summary")
};

console.info(`Demo login: ${credentials.username} / ${credentials.password}`);

init();

async function init() {
  bindEvents();
  updateSessionUi();

  try {
    const config = await fetchBudgetConfig();
    applyBudgetConfig(config);
    populateCategoryControls();
    state.settings = getSettings(config.defaultSettings);
    const savedTransactions = getSavedTransactions();
    state.transactions = savedTransactions.filter((transaction) => !String(transaction.id).startsWith("seed-"));

    // Drop legacy class-demo records from the previous version without removing user-entered data.
    if (state.transactions.length !== savedTransactions.length) {
      saveTransactions(state.transactions);
    }

    applySettingsToForm();
    renderDashboard();
  } catch (error) {
    elements.transactionBody.replaceChildren();
    elements.insightList.replaceChildren(createEmptyState("Transaction data could not be loaded."));
    console.error(error);
  }
}

function populateCategoryControls() {
  elements.formCategory.replaceChildren(...createCategoryOptions());

  Object.entries(categoryDetails)
    .filter(([category]) => category !== "income")
    .forEach(([category, detail]) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = detail.label;
      elements.categoryFilter.append(option);
    });
}

function bindEvents() {
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.logoutButton.addEventListener("click", handleLogout);
  elements.filterForm.addEventListener("input", handleFilters);
  elements.filterForm.addEventListener("change", handleFilters);
  elements.settingsForm.addEventListener("input", handleSettings);
  elements.transactionForm.addEventListener("submit", handleTransactionSubmit);
  elements.formType.addEventListener("change", handleTypeChange);
  elements.cancelEdit.addEventListener("click", resetTransactionForm);
  document.querySelector("#reset-filters").addEventListener("click", resetFilters);
  window.addEventListener("resize", () => renderCharts(buildAnalysis()));
}

function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(elements.loginForm);
  const username = String(formData.get("username")).trim();
  const password = String(formData.get("password")).trim();

  if (username === credentials.username && password === credentials.password) {
    setCurrentUser(username);
    elements.loginForm.reset();
    updateSessionUi();
    return;
  }

  elements.sessionStatus.textContent = "Use the console hint";
}

function handleLogout() {
  clearCurrentUser();
  updateSessionUi();
}

function updateSessionUi() {
  const user = getCurrentUser();
  elements.sessionStatus.textContent = user ? `Signed in as ${user}` : "Guest session";
  elements.logoutButton.hidden = !user;
}

function handleSettings() {
  state.settings = {
    startingBalance: Number(elements.balanceInput.value),
    weeklyIncome: Number(elements.incomeInput.value),
    weeklyGoal: Number(elements.savingsGoalInput.value)
  };
  saveSettings(state.settings);
  renderDashboard();
}

function applySettingsToForm() {
  elements.balanceInput.value = state.settings.startingBalance;
  elements.incomeInput.value = state.settings.weeklyIncome;
  elements.savingsGoalInput.value = state.settings.weeklyGoal;
}

function handleFilters() {
  const nextFilters = {
    search: elements.searchInput.value.trim().toLowerCase(),
    category: elements.categoryFilter.value,
    type: elements.typeFilter.value
  };
  const hasChanged = Object.keys(nextFilters).some((key) => nextFilters[key] !== state.filters[key]);
  state.filters = nextFilters;

  // Search fields fire a change event on blur; skip redraws when values are unchanged.
  if (hasChanged) {
    renderTransactions();
  }
}

function resetFilters() {
  elements.filterForm.reset();
  state.filters = {
    search: "",
    category: "all",
    type: "all"
  };
  renderTransactions();
}

function handleTypeChange() {
  const isIncome = elements.formType.value === "income";
  elements.formCategory.disabled = isIncome;
  elements.formCategory.value = isIncome ? "food" : elements.formCategory.value;
}

function handleTransactionSubmit(event) {
  event.preventDefault();
  const formData = new FormData(elements.transactionForm);
  const type = String(formData.get("type"));
  const editingId = String(formData.get("editingId"));
  const transaction = {
    id: editingId || `custom-${Date.now()}`,
    date: String(formData.get("date")),
    merchant: String(formData.get("merchant")).trim(),
    category: type === "income" ? "income" : String(formData.get("category")),
    amount: Number(formData.get("amount")),
    type,
    note: String(formData.get("note")).trim()
  };

  state.transactions = upsertTransaction(transaction);
  updatePackagedJson(transaction);
  resetTransactionForm();
  renderDashboard();
}

function updatePackagedJson(transaction) {
  const formatted = JSON.stringify(transaction, null, 2);
  elements.jsonOutput.textContent = formatted;
  console.log("Packaged transaction JSON:", transaction);
}

function renderDashboard() {
  const analysis = buildAnalysis();
  renderSummary(analysis);
  renderInsights(analysis);
  renderCategoryBreakdown(analysis);
  renderTransactions();
  renderCharts(analysis);
}

function buildAnalysis() {
  const expenses = state.transactions.filter((transaction) => transaction.type === "expense");
  const income = state.transactions.filter((transaction) => transaction.type === "income");
  const expenseTotal = sumTransactions(expenses);
  const incomeTotal = sumTransactions(income);
  const net = incomeTotal - expenseTotal;
  const categoryTotals = buildCategoryTotals(expenses);
  const weeklyTotals = buildWeeklyTotals(state.transactions);
  const currentWeek = weeklyTotals.at(-1);
  const previousWeek = weeklyTotals.at(-2);
  const runway = predictRunway(expenseTotal);
  const hasTransactions = state.transactions.length > 0;
  const alerts = buildAlerts(categoryTotals, currentWeek, previousWeek, runway, hasTransactions);

  return {
    alerts,
    categoryTotals,
    expenseTotal,
    hasTransactions,
    incomeTotal,
    net,
    runway,
    weeklyTotals
  };
}

function renderSummary(analysis) {
  elements.monthlySpending.textContent = formatCurrency(analysis.expenseTotal);
  elements.monthlyIncome.textContent = formatCurrency(analysis.incomeTotal);
  elements.monthlyNet.textContent = formatCurrency(analysis.net);
  elements.runway.textContent = formatRunway(analysis);
  elements.warningSummary.textContent = analysis.alerts[0]?.message || "Add your first transaction to unlock spending signals.";
}

function renderInsights(analysis) {
  if (!analysis.alerts.length) {
    elements.insightList.replaceChildren(createEmptyState("No warnings yet. Add transactions to sharpen the forecast."));
    return;
  }

  elements.insightList.replaceChildren(...analysis.alerts.map(renderAlert));
}

function renderCategoryBreakdown(analysis) {
  const sourceEntries = analysis.hasTransactions
    ? Object.entries(analysis.categoryTotals).filter(([, spent]) => spent > 0)
    : Object.keys(categoryDetails)
      .filter((category) => category !== "income")
      .map((category) => [category, 0]);

  const cards = sourceEntries
    .sort((a, b) => b[1] - a[1])
    .map(([category, spent]) => renderCategoryCard(category, spent, categoryDetails[category]?.budget || 100));

  elements.categoryBreakdown.replaceChildren(...cards);
}

function renderTransactions() {
  const transactions = getFilteredTransactions();
  elements.transactionCount.textContent = `${transactions.length} ${transactions.length === 1 ? "transaction" : "transactions"}`;

  if (!transactions.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    const message = state.transactions.length
      ? "No transactions match the current filters."
      : "No transactions yet. Add your first income or expense to start the analysis.";
    cell.append(createEmptyState(message));
    row.append(cell);
    elements.transactionBody.replaceChildren(row);
    return;
  }

  const rows = transactions
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((transaction) => renderTransactionRow(transaction, {
      onDelete: deleteTransaction,
      onEdit: startEditingTransaction
    }));

  elements.transactionBody.replaceChildren(...rows);
}

function renderCharts(analysis) {
  drawBarChart(elements.barChart, analysis.categoryTotals);
  drawTrendChart(elements.trendChart, analysis.weeklyTotals);
}

function getFilteredTransactions() {
  return state.transactions.filter((transaction) => {
    const searchTarget = `${transaction.merchant} ${transaction.category} ${transaction.note}`.toLowerCase();
    const matchesSearch = !state.filters.search || searchTarget.includes(state.filters.search);
    const matchesCategory = state.filters.category === "all" || transaction.category === state.filters.category;
    const matchesType = state.filters.type === "all" || transaction.type === state.filters.type;

    return matchesSearch && matchesCategory && matchesType;
  });
}

function startEditingTransaction(transaction) {
  elements.editingId.value = transaction.id;
  elements.transactionForm.elements.date.value = transaction.date;
  elements.transactionForm.elements.merchant.value = transaction.merchant;
  elements.transactionForm.elements.type.value = transaction.type;
  elements.transactionForm.elements.category.value = transaction.category === "income" ? "food" : transaction.category;
  elements.transactionForm.elements.amount.value = transaction.amount;
  elements.transactionForm.elements.note.value = transaction.note;
  elements.saveButton.innerHTML = '<i class="bi bi-check2-circle" aria-hidden="true"></i> Update';
  elements.cancelEdit.hidden = false;
  handleTypeChange();
  elements.transactionForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteTransaction(transactionId) {
  state.transactions = removeTransaction(transactionId);
  renderDashboard();
}

function resetTransactionForm() {
  elements.transactionForm.reset();
  elements.editingId.value = "";
  elements.transactionForm.elements.date.value = "2026-04-24";
  elements.transactionForm.elements.type.value = "expense";
  elements.transactionForm.elements.category.value = "food";
  elements.transactionForm.elements.amount.value = "";
  elements.saveButton.innerHTML = '<i class="bi bi-plus-circle" aria-hidden="true"></i> Add';
  elements.cancelEdit.hidden = true;
  handleTypeChange();
}

function buildCategoryTotals(transactions) {
  return transactions.reduce((totals, transaction) => {
    totals[transaction.category] = (totals[transaction.category] || 0) + Number(transaction.amount);
    return totals;
  }, {});
}

function buildWeeklyTotals(transactions) {
  const buckets = new Map();

  transactions.forEach((transaction) => {
    const week = getWeekLabel(transaction.date);
    const existing = buckets.get(week) || {
      label: week,
      expenses: 0,
      income: 0
    };

    existing[transaction.type === "income" ? "income" : "expenses"] += Number(transaction.amount);
    buckets.set(week, existing);
  });

  return Array.from(buckets.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function buildAlerts(categoryTotals, currentWeek, previousWeek, runway, hasTransactions) {
  const alerts = [];

  if (!hasTransactions) {
    return [{
      icon: "bi-pencil-square",
      message: "Start with your current balance, weekly income, savings target, and first real transaction.",
      title: "Add your own spending data",
      tone: "success"
    }];
  }

  Object.entries(categoryTotals).forEach(([category, spent]) => {
    const budget = categoryDetails[category]?.budget || 0;

    if (budget && spent > budget) {
      alerts.push({
        icon: "bi-exclamation-triangle",
        message: `${getCategoryLabel(category)} is ${formatPercent(((spent - budget) / budget) * 100)} over its monthly budget.`,
        title: `${getCategoryLabel(category)} is over budget`,
        tone: "danger"
      });
    }
  });

  if (currentWeek && previousWeek && previousWeek.expenses > 0) {
    const difference = currentWeek.expenses - previousWeek.expenses;
    const percent = (difference / previousWeek.expenses) * 100;

    if (percent >= 25) {
      alerts.unshift({
        icon: "bi-graph-up-arrow",
        message: `You spent ${formatPercent(percent)} more this week than last week.`,
        title: "Weekly spending jumped",
        tone: "warning"
      });
    }
  }

  const foodChange = compareCategoryWeeks("food");
  if (foodChange >= 40) {
    alerts.unshift({
      icon: "bi-cup-hot",
      message: `You spent ${formatPercent(foodChange)} more on food this week.`,
      title: "Food spending is climbing",
      tone: "warning"
    });
  }

  if (runway.days !== Infinity && runway.days <= 14) {
    alerts.unshift({
      icon: "bi-hourglass-split",
      message: `At this pace, your starting balance could run out in about ${runway.days} days.`,
      title: "Low runway forecast",
      tone: "danger"
    });
  }

  if (!alerts.length) {
    alerts.push({
      icon: "bi-shield-check",
      message: "Your current spending pace is below your income and savings target.",
      title: "Budget is on track",
      tone: "success"
    });
  }

  return alerts.slice(0, 4);
}

function compareCategoryWeeks(category) {
  const sortedTransactions = [...state.transactions].sort((a, b) => a.date.localeCompare(b.date));
  const latestWeek = getWeekLabel(sortedTransactions.at(-1)?.date || "2026-04-24");
  const weekLabels = [...new Set(sortedTransactions.map((transaction) => getWeekLabel(transaction.date)))];
  const previousWeek = weekLabels.at(-2);

  if (!previousWeek) {
    return 0;
  }

  const currentTotal = sumTransactions(state.transactions.filter((transaction) => (
    transaction.type === "expense"
    && transaction.category === category
    && getWeekLabel(transaction.date) === latestWeek
  )));
  const previousTotal = sumTransactions(state.transactions.filter((transaction) => (
    transaction.type === "expense"
    && transaction.category === category
    && getWeekLabel(transaction.date) === previousWeek
  )));

  return previousTotal ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
}

function predictRunway(expenseTotal) {
  if (!state.transactions.length) {
    return {
      dailyBurn: 0,
      days: null
    };
  }

  const dayCount = Math.max(getActiveDayCount(), 1);
  const dailySpend = expenseTotal / dayCount;
  const dailyIncome = state.settings.weeklyIncome / 7;
  const dailyGoal = state.settings.weeklyGoal / 7;
  const dailyBurn = dailySpend + dailyGoal - dailyIncome;

  if (dailyBurn <= 0) {
    return {
      dailyBurn,
      days: Infinity
    };
  }

  return {
    dailyBurn,
    days: Math.max(Math.floor(state.settings.startingBalance / dailyBurn), 0)
  };
}

function formatRunway(analysis) {
  if (!analysis.hasTransactions) {
    return "Add data";
  }

  if (analysis.runway.days === Infinity) {
    return "Stable";
  }

  return `${analysis.runway.days} days`;
}

function getActiveDayCount() {
  const dates = state.transactions.map((transaction) => transaction.date).sort();

  if (!dates.length) {
    return 1;
  }

  const first = new Date(`${dates[0]}T00:00:00`);
  const last = new Date(`${dates.at(-1)}T00:00:00`);
  const difference = Math.round((last - first) / 86400000) + 1;
  return Math.max(difference, 1);
}

function getWeekLabel(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  const month = date.toLocaleString("en-US", { month: "short" });
  const week = Math.ceil(date.getDate() / 7);
  return `${month} ${week}`;
}

function sumTransactions(transactions) {
  return transactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
}
