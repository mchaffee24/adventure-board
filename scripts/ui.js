import { categoryDetails } from "./data.js";

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

export function formatPercent(value) {
  return `${Math.round(value)}%`;
}

export function getCategoryLabel(category) {
  return categoryDetails[category]?.label || titleCase(category);
}

export function renderTransactionRow(transaction, handlers) {
  const row = document.createElement("tr");

  const date = document.createElement("td");
  date.textContent = transaction.date;

  const merchant = document.createElement("td");
  const merchantName = document.createElement("strong");
  merchantName.textContent = transaction.merchant;
  const note = document.createElement("span");
  note.className = "transaction-note";
  note.textContent = transaction.note || "No note";
  merchant.append(merchantName, note);

  const category = document.createElement("td");
  category.append(createCategoryPill(transaction.category));

  const amount = document.createElement("td");
  amount.className = transaction.type === "income" ? "amount-positive" : "amount-negative";
  amount.textContent = `${transaction.type === "income" ? "+" : "-"}${formatCurrency(Number(transaction.amount))}`;

  const actions = document.createElement("td");
  actions.className = "table-actions";
  actions.append(
    createIconButton("Edit transaction", "bi-pencil-square", () => handlers.onEdit(transaction)),
    createIconButton("Delete transaction", "bi-trash", () => handlers.onDelete(transaction.id))
  );

  row.append(date, merchant, category, amount, actions);
  return row;
}

export function renderAlert(alert) {
  const item = document.createElement("article");
  item.className = `insight insight-${alert.tone}`;

  const icon = document.createElement("span");
  icon.className = "insight-icon";
  icon.innerHTML = `<i class="bi ${alert.icon}" aria-hidden="true"></i>`;

  const body = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = alert.title;
  const text = document.createElement("p");
  text.textContent = alert.message;
  body.append(title, text);

  item.append(icon, body);
  return item;
}

export function renderCategoryCard(category, spent, budget) {
  const detail = categoryDetails[category] || {};
  const card = document.createElement("article");
  card.className = "category-card";

  const header = document.createElement("div");
  header.className = "category-card-header";
  const label = document.createElement("strong");
  label.textContent = getCategoryLabel(category);
  const amount = document.createElement("span");
  amount.textContent = formatCurrency(spent);
  header.append(label, amount);

  const bar = document.createElement("div");
  bar.className = "budget-track";
  const fill = document.createElement("span");
  fill.style.width = `${Math.min((spent / budget) * 100, 100)}%`;
  fill.style.background = detail.color || "#1f7a7a";
  bar.append(fill);

  const footer = document.createElement("p");
  const percent = budget ? Math.round((spent / budget) * 100) : 0;
  footer.textContent = `${percent}% of ${formatCurrency(budget)} monthly budget`;

  card.append(header, bar, footer);
  return card;
}

export function createEmptyState(message) {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = message;
  return empty;
}

export function createCategoryOptions(selected = "food") {
  return Object.entries(categoryDetails)
    .filter(([category]) => category !== "income")
    .map(([category, detail]) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = detail.label;
      option.selected = category === selected;
      return option;
    });
}

export function createCategoryPill(category) {
  const detail = categoryDetails[category] || {};
  const pill = document.createElement("span");
  pill.className = "category-pill";
  pill.style.setProperty("--pill-color", detail.color || "#1f7a7a");
  pill.innerHTML = `<i class="bi ${detail.icon || "bi-tag"}" aria-hidden="true"></i>${getCategoryLabel(category)}`;
  return pill;
}

export function drawBarChart(canvas, categoryTotals) {
  const context = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.scale(ratio, ratio);
  context.clearRect(0, 0, width, height);

  const entries = Object.entries(categoryTotals)
    .filter(([category, value]) => category !== "income" && value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  if (!entries.length) {
    drawChartMessage(context, width, height, "No expense data yet");
    return;
  }

  const max = Math.max(...entries.map(([, value]) => value));
  const gap = 10;
  const barHeight = Math.max(18, (height - gap * (entries.length + 1)) / entries.length);

  context.font = "700 12px system-ui";
  entries.forEach(([category, value], index) => {
    const y = gap + index * (barHeight + gap);
    const labelWidth = 92;
    const barWidth = width - labelWidth - 58;
    const fillWidth = Math.max((value / max) * barWidth, 4);
    const detail = categoryDetails[category] || {};

    context.fillStyle = "#33424e";
    context.fillText(getCategoryLabel(category), 0, y + barHeight * 0.68);
    context.fillStyle = "#edf2f2";
    roundRect(context, labelWidth, y, barWidth, barHeight, 6);
    context.fill();
    context.fillStyle = detail.color || "#1f7a7a";
    roundRect(context, labelWidth, y, fillWidth, barHeight, 6);
    context.fill();
    context.fillStyle = "#17212b";
    context.fillText(formatCurrency(value), labelWidth + barWidth + 8, y + barHeight * 0.68);
  });
}

export function drawTrendChart(canvas, weeklyTotals) {
  const context = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.scale(ratio, ratio);
  context.clearRect(0, 0, width, height);

  if (!weeklyTotals.length) {
    drawChartMessage(context, width, height, "No weekly trend yet");
    return;
  }

  const padding = 28;
  const max = Math.max(...weeklyTotals.map((week) => week.expenses), 1);
  const points = weeklyTotals.map((week, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(weeklyTotals.length - 1, 1);
    const y = height - padding - (week.expenses / max) * (height - padding * 2);
    return { ...week, x, y };
  });

  context.strokeStyle = "#d9e0e2";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(padding, height - padding);
  context.lineTo(width - padding, height - padding);
  context.stroke();

  context.strokeStyle = "#1f7a7a";
  context.lineWidth = 3;
  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  });
  context.stroke();

  context.font = "700 11px system-ui";
  points.forEach((point) => {
    context.fillStyle = "#ffffff";
    context.strokeStyle = "#1f7a7a";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(point.x, point.y, 5, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.fillStyle = "#5f6b76";
    context.fillText(point.label, point.x - 14, height - 8);
  });
}

function createIconButton(label, iconName, onClick) {
  const button = document.createElement("button");
  button.className = "btn btn-outline-secondary btn-sm icon-button";
  button.type = "button";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.innerHTML = `<i class="bi ${iconName}" aria-hidden="true"></i>`;
  button.addEventListener("click", onClick);
  return button;
}

function drawChartMessage(context, width, height, message) {
  context.fillStyle = "#5f6b76";
  context.font = "700 14px system-ui";
  context.textAlign = "center";
  context.fillText(message, width / 2, height / 2);
  context.textAlign = "left";
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function titleCase(value) {
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
