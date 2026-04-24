import { fetchAdventures } from "./data.js";
import {
  clearCurrentUser,
  getCurrentUser,
  getItinerary,
  removeItineraryItem,
  setCurrentUser,
  toggleItineraryItem,
  upsertItineraryItem
} from "./storage.js";
import {
  createAdventureCard,
  createEmptyState,
  createSavedItem,
  formatDuration
} from "./ui.js";

const credentials = {
  username: "adventurer",
  password: "trail123"
};

const state = {
  adventures: [],
  filters: {
    search: "",
    category: "all",
    difficulty: "all",
    budget: 75
  }
};

const elements = {
  adventureList: document.querySelector("#adventure-list"),
  budgetFilter: document.querySelector("#budget-filter"),
  budgetReadout: document.querySelector("#budget-readout"),
  cancelEdit: document.querySelector("#cancel-edit"),
  categoryFilter: document.querySelector("#category-filter"),
  difficultyFilter: document.querySelector("#difficulty-filter"),
  editingId: document.querySelector("#editing-id"),
  filterForm: document.querySelector("#filter-form"),
  itineraryList: document.querySelector("#itinerary-list"),
  jsonOutput: document.querySelector("#json-output"),
  loginForm: document.querySelector("#login-form"),
  logoutButton: document.querySelector("#logout-button"),
  planForm: document.querySelector("#plan-form"),
  resultCount: document.querySelector("#result-count"),
  savedBudget: document.querySelector("#saved-budget"),
  savedCount: document.querySelector("#saved-count"),
  savedHours: document.querySelector("#saved-hours"),
  savePlan: document.querySelector("#save-plan"),
  searchInput: document.querySelector("#search-input"),
  sessionStatus: document.querySelector("#session-status")
};

console.info(`Demo login: ${credentials.username} / ${credentials.password}`);

init();

async function init() {
  bindEvents();
  updateSessionUi();
  renderItinerary();

  try {
    state.adventures = await fetchAdventures();
    renderAdventures();
  } catch (error) {
    elements.adventureList.replaceChildren(createEmptyState("Adventure data could not be loaded."));
    console.error(error);
  }
}

function bindEvents() {
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.logoutButton.addEventListener("click", handleLogout);
  elements.filterForm.addEventListener("input", handleFilters);
  elements.filterForm.addEventListener("change", handleFilters);
  document.querySelector("#reset-filters").addEventListener("click", resetFilters);
  elements.planForm.addEventListener("submit", handlePlanSubmit);
  elements.cancelEdit.addEventListener("click", resetPlanForm);
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

  elements.sessionStatus.textContent = "Try the console hint";
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

function handleFilters() {
  const nextFilters = {
    search: elements.searchInput.value.trim().toLowerCase(),
    category: elements.categoryFilter.value,
    difficulty: elements.difficultyFilter.value,
    budget: Number(elements.budgetFilter.value)
  };
  const hasChanged = Object.keys(nextFilters).some((key) => nextFilters[key] !== state.filters[key]);

  state.filters = nextFilters;
  elements.budgetReadout.textContent = `$${state.filters.budget}`;

  // Search fields fire a change event on blur; skip redraws when values are unchanged.
  if (hasChanged) {
    renderAdventures();
  }
}

function resetFilters() {
  elements.filterForm.reset();
  state.filters = {
    search: "",
    category: "all",
    difficulty: "all",
    budget: 75
  };
  elements.budgetReadout.textContent = "$75";
  renderAdventures();
}

function renderAdventures() {
  const visibleAdventures = state.adventures.filter((adventure) => {
    const searchTarget = `${adventure.title} ${adventure.location} ${adventure.summary} ${adventure.tags.join(" ")}`.toLowerCase();
    const matchesSearch = !state.filters.search || searchTarget.includes(state.filters.search);
    const matchesCategory = state.filters.category === "all" || adventure.category === state.filters.category;
    const matchesDifficulty = state.filters.difficulty === "all" || adventure.difficulty === state.filters.difficulty;
    const matchesBudget = adventure.budget <= state.filters.budget;

    return matchesSearch && matchesCategory && matchesDifficulty && matchesBudget;
  });

  elements.resultCount.textContent = `${visibleAdventures.length} ${visibleAdventures.length === 1 ? "result" : "results"}`;

  if (!visibleAdventures.length) {
    elements.adventureList.replaceChildren(createEmptyState("No adventures match the current filters."));
    return;
  }

  const cards = visibleAdventures.map((adventure) => createAdventureCard(adventure, saveAdventureIdea));
  elements.adventureList.replaceChildren(...cards);
}

function saveAdventureIdea(adventure) {
  const packagedItem = {
    id: adventure.id,
    title: adventure.title,
    location: adventure.location,
    category: adventure.category,
    date: "",
    duration: adventure.duration,
    budget: adventure.budget,
    notes: adventure.summary,
    complete: false,
    source: "starter-data"
  };

  upsertItineraryItem(packagedItem);
  updatePackagedJson(packagedItem);
  renderItinerary();
}

function handlePlanSubmit(event) {
  event.preventDefault();
  const formData = new FormData(elements.planForm);
  const editingId = String(formData.get("editingId"));
  const packagedItem = {
    id: editingId || `custom-${Date.now()}`,
    title: String(formData.get("title")).trim(),
    location: String(formData.get("location")).trim(),
    category: String(formData.get("category")),
    date: String(formData.get("date")),
    duration: Number(formData.get("duration")),
    budget: Number(formData.get("budget")),
    notes: String(formData.get("notes")).trim(),
    complete: false,
    source: "custom-form"
  };

  upsertItineraryItem(packagedItem);
  updatePackagedJson(packagedItem);
  resetPlanForm();
  renderItinerary();
}

function updatePackagedJson(item) {
  const formatted = JSON.stringify(item, null, 2);
  elements.jsonOutput.textContent = formatted;
  console.log("Packaged itinerary JSON:", item);
}

function renderItinerary() {
  const items = getItinerary();
  const totalMinutes = items.reduce((sum, item) => sum + Number(item.duration), 0);
  const totalBudget = items.reduce((sum, item) => sum + Number(item.budget), 0);

  elements.savedCount.textContent = String(items.length);
  elements.savedHours.textContent = formatDuration(totalMinutes);
  elements.savedBudget.textContent = `$${totalBudget}`;

  if (!items.length) {
    elements.itineraryList.replaceChildren(createEmptyState("Saved stops will appear here."));
    return;
  }

  const savedNodes = items.map((item) => createSavedItem(item, {
    onEdit: startEditingItem,
    onRemove: removeSavedItem,
    onToggle: toggleSavedItem
  }));
  elements.itineraryList.replaceChildren(...savedNodes);
}

function startEditingItem(item) {
  elements.editingId.value = item.id;
  elements.planForm.elements.title.value = item.title;
  elements.planForm.elements.location.value = item.location;
  elements.planForm.elements.category.value = item.category;
  elements.planForm.elements.date.value = item.date;
  elements.planForm.elements.duration.value = item.duration;
  elements.planForm.elements.budget.value = item.budget;
  elements.planForm.elements.notes.value = item.notes;
  elements.savePlan.innerHTML = '<i class="bi bi-check2-circle" aria-hidden="true"></i> Update stop';
  elements.cancelEdit.hidden = false;
  elements.planForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function removeSavedItem(itemId) {
  removeItineraryItem(itemId);
  renderItinerary();
}

function toggleSavedItem(itemId) {
  toggleItineraryItem(itemId);
  renderItinerary();
}

function resetPlanForm() {
  elements.planForm.reset();
  elements.editingId.value = "";
  elements.planForm.elements.duration.value = 60;
  elements.planForm.elements.budget.value = 0;
  elements.savePlan.innerHTML = '<i class="bi bi-plus-circle" aria-hidden="true"></i> Add stop';
  elements.cancelEdit.hidden = true;
}
