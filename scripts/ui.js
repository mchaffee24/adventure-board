const categoryIcons = {
  campus: "bi-mortarboard",
  creative: "bi-palette",
  food: "bi-cup-hot",
  outdoors: "bi-tree"
};

export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!hours) {
    return `${remainingMinutes}m`;
  }

  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function createAdventureCard(adventure, onSave) {
  const card = document.createElement("article");
  card.className = "adventure-card";
  card.dataset.category = adventure.category;

  const icon = document.createElement("span");
  icon.className = "adventure-icon";
  icon.innerHTML = `<i class="bi ${categoryIcons[adventure.category] || "bi-map"}" aria-hidden="true"></i>`;

  const title = document.createElement("h3");
  title.textContent = adventure.title;

  const location = document.createElement("p");
  location.textContent = adventure.location;

  const summary = document.createElement("p");
  summary.textContent = adventure.summary;

  const meta = document.createElement("div");
  meta.className = "card-meta";
  meta.append(
    createMetaPill(adventure.difficulty),
    createMetaPill(formatDuration(adventure.duration)),
    createMetaPill(`$${adventure.budget}`)
  );

  const tags = document.createElement("div");
  tags.className = "tag-list";
  adventure.tags.forEach((tag) => tags.append(createTagPill(tag)));

  const button = document.createElement("button");
  button.className = "btn btn-primary card-action";
  button.type = "button";
  button.innerHTML = '<i class="bi bi-bookmark-plus" aria-hidden="true"></i> Save idea';
  button.addEventListener("click", () => onSave(adventure));

  card.append(icon, title, location, summary, meta, tags, button);
  return card;
}

export function createSavedItem(item, handlers) {
  const wrapper = document.createElement("article");
  wrapper.className = item.complete ? "saved-item is-complete" : "saved-item";

  const titleRow = document.createElement("div");
  titleRow.className = "saved-title-row";

  const titleBlock = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = item.title;
  const location = document.createElement("p");
  location.textContent = item.location;
  titleBlock.append(title, location);

  const check = document.createElement("input");
  check.className = "form-check-input";
  check.type = "checkbox";
  check.checked = Boolean(item.complete);
  check.title = "Mark complete";
  check.setAttribute("aria-label", `Mark ${item.title} complete`);
  check.addEventListener("change", () => handlers.onToggle(item.id));
  titleRow.append(titleBlock, check);

  const meta = document.createElement("div");
  meta.className = "card-meta";
  meta.append(
    createMetaPill(item.category),
    createMetaPill(formatDuration(Number(item.duration))),
    createMetaPill(`$${Number(item.budget)}`)
  );

  if (item.date) {
    meta.append(createMetaPill(item.date));
  }

  const notes = document.createElement("p");
  notes.textContent = item.notes || "No notes added.";

  const actions = document.createElement("div");
  actions.className = "saved-actions";
  actions.append(
    createActionButton("Edit", "bi-pencil-square", () => handlers.onEdit(item)),
    createActionButton("Remove", "bi-trash", () => handlers.onRemove(item.id))
  );

  wrapper.append(titleRow, meta, notes, actions);
  return wrapper;
}

export function createEmptyState(message) {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = message;
  return empty;
}

export function createMetaPill(text) {
  const pill = document.createElement("span");
  pill.className = "meta-pill";
  pill.textContent = text;
  return pill;
}

function createTagPill(text) {
  const pill = document.createElement("span");
  pill.className = "tag-pill";
  pill.textContent = text;
  return pill;
}

function createActionButton(label, iconName, onClick) {
  const button = document.createElement("button");
  button.className = "btn btn-outline-secondary btn-sm";
  button.type = "button";
  button.innerHTML = `<i class="bi ${iconName}" aria-hidden="true"></i> ${label}`;
  button.addEventListener("click", onClick);
  return button;
}
