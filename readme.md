# Daily Devotional App

Lightweight SPA that renders a daily devotional, keeps plans in `localStorage`, and pulls every Scripture passage directly from the Berean Standard Bible (BSB) via https://bible.helloao.org.

## Scripture API (BSB)

1. Every reading entry that includes a `reference` string now hits `https://bible.helloao.org/api/BSB/{BOOK}/{CHAPTER}.json` to retrieve the canonical text for that book/chapter.
2. The app parses the reference (book name, chapter, verse range) and only renders the requested verses in the “BSB passage” panel; results are cached in-memory to limit repeat network calls.
3. Since the API is the single source of truth for the BSB text, any Scripture passages that exist inside your CSV or JSON plan bodies are ignored (the parser strips them when it detects the reference text, leaving `body` available for reflections or devotionals).

## Plans & editing

- **Sample plan**: A seven-day plan is bundled in `app.js`; you can reset it using the “Reset to sample plan” menu action when needed.
- **CSV import**: Drop a CSV (see the provided samples) onto the “Select CSV” button. The parser maps recognized columns (`day`, `date`, `title`, `reference`, `body`, `questions`, `prayer`, etc.) into plan entries, but the textual Scripture text in the CSV is discarded because the app fetches the BSB text online. Use the `body` column for reflections instead.
- **JSON editor**: Use the “Edit active plan (JSON)” modal to tweak your plan; once saved, it overwrites the active plan in `localStorage` and the UI refreshes.
- **Plan hook**: The `<select id="planSelect">` element keeps a `data-active-plan-id` attribute and dispatches a `planchange` `CustomEvent` whenever a new plan becomes active so other scripts can react.

## Local resources

- The `api/` folder (and `bible.eng.db`) are retained for reference, but the running app no longer loads them—instead it always goes through the online BSB endpoint detailed above.
