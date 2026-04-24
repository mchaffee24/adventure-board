# Adventure Board

> A session-based planner for filtering adventure ideas and building a simple itinerary.

## Author

Mitchell Chaffee - [GitHub profile](https://github.com/YOUR-GITHUB-USERNAME)

## User Story

- *As a(n)* student planning a small local outing
- *I want* to filter adventure ideas and save a custom itinerary
- *So that* I can compare options and leave with a practical plan

## Narrative

Adventure Board is a front-end web app for turning a short list of adventure ideas into a saved day plan. The app loads starter ideas from JSON, filters them by category, difficulty, budget, and search text, then lets the user save or customize itinerary stops.

I chose this project because it keeps the scope clear while still demonstrating the main skills from the semester: semantic HTML, structured CSS, Bootstrap, JavaScript modules, DOM updates, fetch, event handling, forms, and session storage.

The main build challenge was keeping the app complete without making it noisy. The finished interface focuses on three jobs: find an idea, sign in to a demo session, and package a saved stop as JSON.

## Attribution

- Bootstrap 5.3.3: https://getbootstrap.com/
- Bootstrap Icons 1.11.3: https://icons.getbootstrap.com/
- Normalize.css 8.0.1: https://necolas.github.io/normalize.css/
- Banner image: generated with OpenAI image tools for this project
- AI usage: OpenAI Codex helped scaffold the static app, organize modules, and draft documentation

## Project Structure

```text
.
├── README.md
├── assets
│   ├── favicon.svg
│   └── images
├── data
│   └── adventures.json
├── docs
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
```

This function matters because it turns user input into structured JSON, saves it in `sessionStorage`, updates the visible itinerary, and prints the packaged object to the console. It uses `FormData` so the JavaScript stays connected to the form's semantic field names instead of manually reading each value from scattered selectors.

## Validation

- Nu Validator: https://validator.w3.org/nu/?doc=https%3A%2F%2FYOUR-GITHUB-USERNAME.github.io%2Fadventure-board%2F
- WAVE accessibility report: https://wave.webaim.org/report#/https://YOUR-GITHUB-USERNAME.github.io/adventure-board/

Replace `YOUR-GITHUB-USERNAME` after GitHub Pages is enabled.

## Future Improvements

Sprint 99 milestone: https://github.com/YOUR-GITHUB-USERNAME/adventure-board/milestone/1

Planned issues for Sprint 99:

- Add export to downloadable JSON
- Add drag-and-drop itinerary ordering
- Add saved theme preference
- Improve empty states for validation failures
- Add unit tests for storage helpers

Each issue should be assigned to Mitchell Chaffee and include a short description, acceptance criteria, and either `feature`, `improvement`, or `bug` labels.

## Deployment Notes

- GitHub Pages app: https://YOUR-GITHUB-USERNAME.github.io/adventure-board/
- GCP external IP app: http://YOUR-GCP-EXTERNAL-IP/

Add both links to the repository About section, along with the project topics.

## Demo Login

Open the browser console for the credential hint.
