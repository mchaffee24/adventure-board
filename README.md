# Spend Signal

> A student budget dashboard that tracks spending, warnings, charts, and cash runway.

## Author

Mitchell Chaffee - [GitHub profile](https://github.com/mchaffee24)

## User Story

- *As a(n)* student managing a limited budget
- *I want* to track spending by category and see warning signals
- *So that* I can adjust habits before I run out of money

## Narrative

Spend Signal is a front-end spending analyzer for tracking everyday transactions. It loads seed transactions from JSON, stores changes in `sessionStorage`, lets the user add/edit/delete transactions, filters the ledger, and displays category charts, budget warnings, and a runway forecast.

I chose this direction because a budget app feels practical while still giving the interface room to do meaningful work. The app does more than show static content: it calculates spending patterns, compares weeks, and packages new form data as JSON.

The development story focused on clarity over size. I built the app as a static deployment with separate JavaScript modules for data, storage, UI rendering, and app logic. The charts are drawn with canvas so the project demonstrates custom DOM and visual logic without needing a heavy chart library.

## Attribution

- Bootstrap 5.3.3: https://getbootstrap.com/
- Bootstrap Icons 1.11.3: https://icons.getbootstrap.com/
- Normalize.css 8.0.1: https://necolas.github.io/normalize.css/
- AI usage: OpenAI Codex helped redesign the app, organize modules, build the chart logic, and draft documentation

## Project Structure

```text
.
├── README.md
├── assets
│   └── favicon.svg
├── data
│   └── transactions.json
├── docs
│   ├── github-profile-readme.md
│   ├── repo-settings.md
│   └── submission-checklist.md
├── index.html
├── scripts
│   ├── data.js
│   ├── main.js
│   ├── storage.js
│   └── ui.js
└── styles
    └── main.css
```

## Code Highlight

```js
function predictRunway(expenseTotal) {
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
```

This function matters because it turns transaction history and user settings into a real forecast. It estimates daily spending, subtracts daily income, includes the savings target, and predicts how many days the current balance can last. If income covers spending and the savings target, it reports a stable runway instead of a countdown.

## Validation

- Nu Validator: https://validator.w3.org/nu/?doc=https%3A%2F%2Fmchaffee24.github.io%2Fadventure-board%2F
- WAVE accessibility report: https://wave.webaim.org/report#/https://mchaffee24.github.io/adventure-board/

## Future Improvements

Sprint 99 milestone: https://github.com/mchaffee24/adventure-board/milestone/1

Planned issues for Sprint 99:

- Add downloadable CSV and JSON export
- Add recurring transaction templates
- Add category budget editing controls
- Add month selector for older transaction sets
- Add automated tests for forecast and alert helpers

Each issue should be assigned to Mitchell Chaffee and include a short description, acceptance criteria, and either `feature`, `improvement`, or `bug` labels.

## Deployment Notes

- Repository: https://github.com/mchaffee24/adventure-board
- GitHub Pages app: https://mchaffee24.github.io/adventure-board/
- GCP external IP app: http://YOUR-GCP-EXTERNAL-IP/

Add both deployed links to the repository About section. The repo name can stay `adventure-board` for this submission or be renamed later.

## Demo Login

Open the browser console for the credential hint.
