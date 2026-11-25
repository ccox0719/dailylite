// ----- Data Model ----------------------------------------------------
/*
Plan shape:
{
  id: "sample",
  name: "Sample 7-Day Plan",
  startDate: "2025-01-01", // ISO string, used if entries use dayIndex
  entries: [
    {
      date: "2025-01-01",     // optional, ISO date
      dayIndex: 1,            // optional, 1-based day number
      title: "God is Near",
      reference: "Psalm 34:18",
      body: "Short reflection text...",
      questions: "Optional reflection questions...",
      prayer: "Optional written prayer..."
    }
  ]
}
*/

const STORAGE_KEY_PLANS = "devotional_plans_v1";
const STORAGE_KEY_ACTIVE = "devotional_active_plan_v1";
const THEME_STORAGE_KEY = "devotional_theme_mode_v1";
const DISPLAY_SETTINGS_KEY = "devotional_display_settings_v1";
const PROGRESS_STORAGE_KEY = "devotional_plan_progress_v1";
const DEFAULT_THEME_MODE = "light";
const FONT_SIZE_STEPS = [14, 16, 18];
const FONT_FAMILIES = [
  {
    id: "literata",
    label: "Literata",
    stack: '"Literata", Georgia, "Times New Roman", serif'
  },
  {
    id: "georgia",
    label: "Georgia",
    stack: 'Georgia, "Times New Roman", serif'
  },
  {
    id: "merriweather",
    label: "Merriweather",
    stack: '"Merriweather", Georgia, serif'
  },
  {
    id: "playfair",
    label: "Playfair",
    stack: '"Playfair Display", Georgia, serif'
  }
];
const LEGACY_DEFAULT_PLAN = {
  id: "default",
  name: "Default Devotional",
  startDate: "2025-01-01",
  entries: [
    {
      date: "2025-01-01",
      dayIndex: 1,
      title: "God Is Near",
      reference: "Psalm 34:18",
      body:
        "The LORD is near to the brokenhearted and saves the crushed in spirit.\n\n" +
        "Today, remember that God is not distant from your pain. He draws near to those who feel weak, discouraged, or overwhelmed.",
      questions:
        "• Where do you feel 'brokenhearted' or 'crushed in spirit' right now?\n" +
        "• What would it look like to invite God into that specific place today?",
      prayer:
        "Father, thank You that You are near to me in every season. " +
        "Meet me in the places where I feel broken, and remind me that I am not alone. Amen."
    },
    {
      dayIndex: 2,
      title: "New Every Morning",
      reference: "Lamentations 3:22–23",
      body:
        "God’s mercies are new every morning. Your failures from yesterday do not disqualify you from walking with Him today.",
      questions:
        "• What 'yesterday' are you still carrying?\n" +
        "• How might God's mercy invite you to start fresh today?",
      prayer:
        "Lord, thank You for fresh mercy today. Help me receive it instead of rehearsing yesterday’s failures."
    },
    {
      dayIndex: 3,
      title: "He Knows Your Name",
      reference: "Isaiah 43:1",
      body:
        "God calls you by name. You are not just one more person in the crowd – you are seen, known, and loved.",
      questions:
        "• Where do you feel unseen or overlooked?\n" +
        "• How does it change things to remember that God knows you personally?",
      prayer:
        "Jesus, thank You that You know my name. Help me to rest in being fully known and fully loved by You."
    },
    {
      dayIndex: 4,
      title: "Anxious Hearts",
      reference: "Philippians 4:6–7",
      body:
        "God invites you to bring your anxieties to Him in prayer, with thanksgiving. His peace is not the absence of problems, " +
        "but His presence guarding your heart and mind.",
      questions:
        "• What are you most anxious about today?\n" +
        "• What would it look like to turn that specific worry into a prayer?",
      prayer:
        "Lord, here is what I am anxious about today: ________. I give it to You. Surround my heart and mind with Your peace."
    },
    {
      dayIndex: 5,
      title: "Strength in Weakness",
      reference: "2 Corinthians 12:9",
      body:
        "God’s power is made perfect in weakness. You don’t have to pretend to be strong for Him to work mightily in you.",
      questions:
        "• Where do you feel weak, limited, or not enough?\n" +
        "• How could that place become a platform for God’s strength?",
      prayer:
        "Jesus, I offer You my weakness instead of hiding it. Show Your strength in the places I feel most inadequate."
    },
    {
      dayIndex: 6,
      title: "He Cares",
      reference: "1 Peter 5:7",
      body:
        "Casting your cares on God is not a one-time event but a posture of trust. You can keep bringing the same burden to Him.",
      questions:
        "• What burden do you keep picking back up after you lay it down?\n" +
        "• What helps you remember that God truly cares about that burden?",
      prayer:
        "Lord, I cast my cares on You again. Help me trust that Your hands are better than my grip."
    },
    {
      dayIndex: 7,
      title: "Rest for Your Soul",
      reference: "Matthew 11:28–30",
      body:
        "Jesus offers rest, not just for your body but for your soul. His yoke is easy, and His burden is light.",
      questions:
        "• Where are you carrying a burden you were never meant to carry alone?\n" +
        "• How can you come to Jesus practically today?",
      prayer:
        "Jesus, I come to You with my tiredness, worries, and striving. Teach my soul to rest in You."
    }
  ]
};

function getTodayIso() {
  const now = new Date();
  // keep it simple: local date
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftIsoDate(iso, deltaDays) {
  if (!iso) return iso;
  const [y, m, d] = String(iso).split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  if (Number.isNaN(date.getTime())) return iso;
  date.setDate(date.getDate() + deltaDays);
  return toIsoDate(date);
}

// Sample plan for first run / reset
const SAMPLE_PLAN = {
  id: "sample",
  name: "Sample 7-Day Plan",
  startDate: "2025-01-01",
  entries: [
    {
      date: "2025-01-01",
      dayIndex: 1,
      title: "God Is Near",
      reference: "Psalm 34:18",
      body:
        "The LORD is near to the brokenhearted and saves the crushed in spirit.\n\n" +
        "Today, remember that God is not distant from your pain. He draws near to those who feel weak, discouraged, or overwhelmed.",
      questions:
        "• Where do you feel 'brokenhearted' or 'crushed in spirit' right now?\n" +
        "• What would it look like to invite God into that specific place today?",
      prayer:
        "Father, thank You that You are near to me in every season. " +
        "Meet me in the places where I feel broken, and remind me that I am not alone. Amen."
    },
    {
      dayIndex: 2,
      title: "New Every Morning",
      reference: "Lamentations 3:22–23",
      body:
        "God’s mercies are new every morning. Your failures from yesterday do not disqualify you from walking with Him today.",
      questions:
        "• What 'yesterday' are you still carrying?\n" +
        "• How might God's mercy invite you to start fresh today?",
      prayer:
        "Lord, thank You for fresh mercy today. Help me receive it instead of rehearsing yesterday’s failures."
    },
    {
      dayIndex: 3,
      title: "He Knows Your Name",
      reference: "Isaiah 43:1",
      body:
        "God calls you by name. You are not just one more person in the crowd – you are seen, known, and loved.",
      questions:
        "• Where do you feel unseen or overlooked?\n" +
        "• How does it change things to remember that God knows you personally?",
      prayer:
        "Jesus, thank You that You know my name. Help me to rest in being fully known and fully loved by You."
    },
    {
      dayIndex: 4,
      title: "Anxious Hearts",
      reference: "Philippians 4:6–7",
      body:
        "God invites you to bring your anxieties to Him in prayer, with thanksgiving. His peace is not the absence of problems, " +
        "but His presence guarding your heart and mind.",
      questions:
        "• What are you most anxious about today?\n" +
        "• What would it look like to turn that specific worry into a prayer?",
      prayer:
        "Lord, here is what I am anxious about today: ________. I give it to You. Surround my heart and mind with Your peace."
    },
    {
      dayIndex: 5,
      title: "Strength in Weakness",
      reference: "2 Corinthians 12:9",
      body:
        "God’s power is made perfect in weakness. You don’t have to pretend to be strong for Him to work mightily in you.",
      questions:
        "• Where do you feel weak, limited, or not enough?\n" +
        "• How could that place become a platform for God’s strength?",
      prayer:
        "Jesus, I offer You my weakness instead of hiding it. Show Your strength in the places I feel most inadequate."
    },
    {
      dayIndex: 6,
      title: "He Cares",
      reference: "1 Peter 5:7",
      body:
        "Casting your cares on God is not a one-time event but a posture of trust. You can keep bringing the same burden to Him.",
      questions:
        "• What burden do you keep picking back up after you lay it down?\n" +
        "• What helps you remember that God truly cares about that burden?",
      prayer:
        "Lord, I cast my cares on You again. Help me trust that Your hands are better than my grip."
    },
    {
      dayIndex: 7,
      title: "Rest for Your Soul",
      reference: "Matthew 11:28–30",
      body:
        "Jesus offers rest, not just for your body but for your soul. His yoke is easy, and His burden is light.",
      questions:
        "• Where are you carrying a burden you were never meant to carry alone?\n" +
        "• How can you come to Jesus practically today?",
      prayer:
        "Jesus, I come to You with my tiredness, worries, and striving. Teach my soul to rest in You."
    }
  ]
};

const HELLOAO_BASE_URL = "https://bible.helloao.org/api";
const BSB_TRANSLATION_CODE = "BSB";

let bsbBookLookup = null;
let bookListPromise = null;
let bsbBookAliases = null;

function normalizeBookKey(value) {
  if (!value) return "";
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

function parseReference(reference) {
  if (!reference) return null;
  const cleaned = reference.replace(/–/g, "-").trim();
  const match = cleaned.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
  if (!match) return null;
  const bookName = match[1].trim();
  const chapter = Number(match[2]);
  const hasVerse = Boolean(match[3]);
  const startVerse = hasVerse ? Number(match[3]) : 1;
  const endVerse = match[4] ? Number(match[4]) : hasVerse ? startVerse : Infinity;
  if (!bookName || Number.isNaN(chapter)) return null;
  return {
    bookName,
    chapter,
    start: Math.max(1, startVerse),
    end: Math.max(startVerse, endVerse),
    hasVerse
  };
}

function loadBookLookup() {
  if (bsbBookLookup) return Promise.resolve(bsbBookLookup);
  if (bookListPromise) return bookListPromise;
  bookListPromise = fetch(`${HELLOAO_BASE_URL}/${BSB_TRANSLATION_CODE}/books.json`)
    .then(res => {
      if (!res.ok) throw new Error("BSB book list request failed");
      return res.json();
    })
    .then(data => {
      const books = data?.books || [];
      bsbBookLookup = new Map();
      bsbBookAliases = [];
      books.forEach(book => {
        const id = book?.id;
        if (!id) return;
        const candidates = [
          book.name,
          book.commonName,
          book.title,
          book.englishName,
          book.shortName
        ];
        candidates.forEach(name => {
          if (!name) return;
          const key = normalizeBookKey(name);
          if (!key) return;
          if (!bsbBookAliases) {
            bsbBookAliases = [];
          }
          const existing = bsbBookAliases.find(alias => alias.key === key && alias.id === id);
          if (!existing) {
            bsbBookAliases.push({ id, key });
          }
        });
        candidates.forEach(name => {
          if (!name) return;
          const key = normalizeBookKey(name);
          if (!key) return;
          bsbBookLookup.set(key, id);
        });
      });
      return bsbBookLookup;
    })
    .catch(err => {
      console.warn("Failed to load BSB book list", err);
      bookListPromise = null;
      return null;
    });
  return bookListPromise;
}

function findBookId(bookName) {
  if (!bookName) return Promise.resolve(null);
  return loadBookLookup().then(lookup => {
    if (!lookup) return null;
    const direct = lookup.get(normalizeBookKey(bookName));
    if (direct) return direct;
    const fallback = guessBookId(bookName);
    return fallback;
  });
}

function guessBookId(bookName) {
  if (!bookName || !bsbBookAliases) return null;
  const normalized = normalizeBookKey(bookName);
  if (!normalized) return null;
  for (const alias of bsbBookAliases) {
    if (alias.key === normalized) return alias.id;
    if (alias.key.startsWith(normalized) || normalized.startsWith(alias.key)) {
      if (Math.abs(alias.key.length - normalized.length) <= 2) {
        return alias.id;
      }
    }
  }
  return null;
}

function flattenVerseContent(tokens) {
  if (!Array.isArray(tokens)) return "";
  const pieces = [];
  tokens.forEach(token => {
    if (typeof token === "string") {
      pieces.push(token);
      return;
    }
    if (!token || typeof token !== "object") return;
    if (token.text) {
      pieces.push(token.text);
      return;
    }
    if (token.lineBreak) {
      pieces.push("\n");
      return;
    }
    // Keep a placeholder so removed notes/markers do not collapse spacing
    pieces.push("");
  });

  const joined = pieces.join(" ");
  return joined
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\s{2,}/g, " ")
    .replace(/ ([,;:.!?])/g, "$1")
    .replace(/([,;:.!?])(?=[A-Za-z0-9])/g, "$1 ")
    .replace(/([”’])(?=[A-Za-z0-9])/g, "$1 ")
    .trim();
}

function ensureVerseSpacing(text) {
  if (!text) return "";
  return text
    .replace(/([,;:.!?])(?=[A-Za-z])/g, "$1 ")
    // Defensive: when an all-caps divine name is glued to the next word (e.g., "LORDas")
    .replace(/\b(LORD|GOD)([A-Za-z])/g, "$1 $2")
    // Catch any remaining long all-caps run stuck to lowercase
    .replace(/([A-Z]{3,})([a-z]{2,})/g, "$1 $2");
}

function extractVersesFromChapter(chapter, start, end) {
  if (!chapter || !Array.isArray(chapter.content)) return null;
  let heading = null;
  let pendingParagraph = false;
  const verses = [];
  chapter.content.forEach(block => {
    if (!block) return;
    if (block.type === "heading" && !heading) {
      heading = flattenVerseContent(block.content);
      return;
    }
    if (block.type === "line_break") {
      pendingParagraph = true;
      return;
    }
    if (block.type !== "verse") return;
    const number = Number(block.number);
    if (Number.isNaN(number)) return;
    if (number < start || number > end) return;
    const text = ensureVerseSpacing(flattenVerseContent(block.content));
    if (text) {
      verses.push({ number, text, paragraphStart: pendingParagraph });
      pendingParagraph = false;
    }
  });
  if (!verses.length) return null;
  return { verses, heading };
}

function formatVersesHtml(chapterResult) {
  if (!chapterResult?.verses) return "";
  const headingHtml = chapterResult.heading
    ? `<div class="chapter-heading">${chapterResult.heading}</div>`
    : "";
  const paragraphs = [];
  let current = [];
  chapterResult.verses.forEach(verse => {
    if (verse.paragraphStart && current.length) {
      paragraphs.push(current);
      current = [];
    }
    current.push(verse);
  });
  if (current.length) paragraphs.push(current);

  const paragraphHtml = paragraphs
    .map(group => {
      const verseHtml = group
        .map(v => {
          const escaped = v.text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          return `<span class="verse"><sup>${v.number}</sup><span class="verse-text">${escaped}</span></span>`;
        })
        .join(" ");
      return `<div class="verse-paragraph">${verseHtml}</div>`;
    })
    .join("");

  return `${headingHtml}<div class="verse-list">${paragraphHtml}</div>`;
}

// ----- Storage helpers ----------------------------------------------

function clonePlan(plan) {
  return plan ? JSON.parse(JSON.stringify(plan)) : null;
}

function readStoredPlans() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLANS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [];
    }
    return parsed;
  } catch (e) {
    console.error("Failed to parse plans from storage", e);
    return [];
  }
}

function loadPlanProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.warn("Failed to parse plan progress from storage", e);
  }
  return {};
}

function savePlanProgress() {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(state.planProgress));
  } catch (e) {
    console.warn("Failed to save plan progress", e);
  }
}

const DWELLING_PLAN_ID = "csv-1770836983614";
let meditationWeeks = {};
let shownMeditationWeek = null;

async function loadBundledJson(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`Could not load ${path}`, error);
    return null;
  }
}

async function loadDefaultPlan() {
  try {
    const response = await fetch("./dwelling-with-god.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const plan = await response.json();
    if (!plan.id || !Array.isArray(plan.entries) || plan.entries.length === 0) {
      throw new Error("Invalid default study");
    }
    return { ...plan, startDate: getTodayIso() };
  } catch (error) {
    console.warn("Could not load the bundled study", error);
    return null;
  }
}

function loadPlans(defaultPlan) {
  const plans = readStoredPlans();
  if (defaultPlan && !plans.some(plan => plan.id === defaultPlan.id)) {
    plans.unshift(defaultPlan);
  }
  return plans.length ? plans : [clonePlan(LEGACY_DEFAULT_PLAN)];
}

function savePlans(plans) {
  localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(plans));
}

function loadActivePlanId(plans, defaultPlan) {
  const stored = localStorage.getItem(STORAGE_KEY_ACTIVE);
  const active = plans.find(plan => plan.id === stored);
  if (defaultPlan && JSON.stringify(active) === JSON.stringify(LEGACY_DEFAULT_PLAN)) {
    return defaultPlan.id;
  }
  return active?.id ?? defaultPlan?.id ?? plans[0]?.id;
}

function saveActivePlanId(planId) {
  localStorage.setItem(STORAGE_KEY_ACTIVE, planId);
}

function loadThemeMode() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return DEFAULT_THEME_MODE;
}

function saveThemeMode(mode) {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
}

function loadDisplaySettings() {
  const stored = localStorage.getItem(DISPLAY_SETTINGS_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    if (
      parsed &&
      typeof parsed.fontSizeIndex === "number" &&
      FONT_SIZE_STEPS[parsed.fontSizeIndex]
    ) {
      const familyIndex =
        typeof parsed.fontFamilyIndex === "number" &&
        parsed.fontFamilyIndex >= 0 &&
        parsed.fontFamilyIndex < FONT_FAMILIES.length
          ? parsed.fontFamilyIndex
          : 0;
      return {
        fontSizeIndex: parsed.fontSizeIndex,
        fontFamilyIndex: familyIndex
      };
    }
  } catch (e) {
    console.warn("Failed to parse display settings", e);
  }
  return null;
}

function saveDisplaySettings(settings) {
  localStorage.setItem(DISPLAY_SETTINGS_KEY, JSON.stringify(settings));
}

function stripJsonComments(text) {
  let inString = false;
  let escaped = false;
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inString) {
      result += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"' && !inString) {
      inString = true;
      result += char;
      continue;
    }

    if (char === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") {
        i++;
      }
      continue;
    }

    if (char === "/" && next === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) {
        i++;
      }
      i++;
      continue;
    }

    result += char;
  }
  return result;
}

function parseJsonLoose(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    // fallback: strip comments and trailing commas
    try {
      const withoutComments = stripJsonComments(text);
      const withoutTrailingCommas = withoutComments.replace(/,\s*([}\]])/g, "$1");
      return JSON.parse(withoutTrailingCommas);
    } catch (err) {
      throw err;
    }
  }
}

function applyDisplaySettings(settings) {
  const root = document.documentElement;
  const size = FONT_SIZE_STEPS[settings.fontSizeIndex] || FONT_SIZE_STEPS[1];
  root.style.setProperty("--devotional-font-size", `${size}px`);
  const fontOption = FONT_FAMILIES[settings.fontFamilyIndex] || FONT_FAMILIES[0];
  root.style.setProperty("--devotional-font-family", fontOption.stack);
  root.style.setProperty("--scripture-font-size", `${size + 2}px`);
  updateFontControlLabels();
}

function updateFontControlLabels() {
  const familyBtn = document.getElementById("fontFamilyToggle");
  if (familyBtn) {
    const fontOption =
      FONT_FAMILIES[state.displaySettings.fontFamilyIndex] || FONT_FAMILIES[0];
    familyBtn.textContent = fontOption.label;
  }
}

function getSavedEntryIndex(planId) {
  if (!planId || !state.planProgress) return null;
  const value = state.planProgress[planId];
  return typeof value === "number" ? value : null;
}

function getInitialEntryIndexForPlan(plan) {
  if (!plan) return -1;
  const entries = Array.isArray(plan.entries) ? plan.entries : [];
  if (entries.length === 0) return -1;

  const rawTodayIndex = findTodayEntryIndex(plan);
  const rawSavedIndex = getSavedEntryIndex(plan.id);

  const todayIndex =
    Number.isInteger(rawTodayIndex) && rawTodayIndex >= 0 ? rawTodayIndex : -1;
  const savedIndex =
    Number.isInteger(rawSavedIndex) &&
    rawSavedIndex >= 0 &&
    rawSavedIndex < entries.length
      ? rawSavedIndex
      : -1;

  if (todayIndex < 0 && savedIndex < 0) return -1;
  return Math.max(savedIndex, todayIndex);
}

function persistPlanProgress() {
  const plan = getCurrentPlan();
  if (!plan) return;
  if (!state.planProgress) {
    state.planProgress = {};
  }
  state.planProgress[plan.id] = state.currentEntryIndex;
  savePlanProgress();
}

function setFontSizeIndex(index) {
  const nextIndex = Math.min(
    FONT_SIZE_STEPS.length - 1,
    Math.max(0, index)
  );
  if (nextIndex === state.displaySettings.fontSizeIndex) return;
  state.displaySettings.fontSizeIndex = nextIndex;
  applyDisplaySettings(state.displaySettings);
  saveDisplaySettings(state.displaySettings);
}

function cycleFontFamily() {
  const nextIndex = (state.displaySettings.fontFamilyIndex + 1) % FONT_FAMILIES.length;
  state.displaySettings.fontFamilyIndex = nextIndex;
  applyDisplaySettings(state.displaySettings);
  saveDisplaySettings(state.displaySettings);
}

function applyTheme(mode) {
  const body = document.body;
  if (!body) return;
  if (mode === "dark") {
    body.classList.add("dark-mode");
  } else {
    body.classList.remove("dark-mode");
  }
  updateThemeToggleIcon(mode);
}

function updateThemeToggleIcon(mode) {
  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;
  const icon = toggle.querySelector("i");
  const isDark = mode === "dark";
  toggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  if (icon) {
    icon.className = isDark ? "bi bi-sun" : "bi bi-moon-stars";
  }
}

function toggleTheme() {
  const nextMode = state.themeMode === "dark" ? "light" : "dark";
  state.themeMode = nextMode;
  saveThemeMode(nextMode);
  applyTheme(nextMode);
}

// ----- Core selection logic -----------------------------------------

function findPlanById(plans, id) {
  return plans.find(p => p.id === id) || null;
}

// ----- Rendering -----------------------------------------------------

function callBsbApi(reference) {
  const parsed = parseReference(reference);
  if (!parsed) return Promise.resolve(null);

  const normalized = reference.trim();
  const cached = bsbCache.get(normalized);
  if (cached) return Promise.resolve(cached);

  lastBsbRequest = normalized;

  return findBookId(parsed.bookName)
    .then(bookId => {
      if (!bookId) return null;
      return fetch(`${HELLOAO_BASE_URL}/${BSB_TRANSLATION_CODE}/${bookId}/${parsed.chapter}.json`);
    })
    .then(res => {
      if (!res) return null;
      if (!res.ok) throw new Error("BSB chapter request failed");
      return res.json();
    })
    .then(data => {
      const chapterInfo = extractVersesFromChapter(data?.chapter, parsed.start, parsed.end);
      if (!chapterInfo) return null;
      const html = formatVersesHtml(chapterInfo);
      if (!html) return null;
      const chapterNumber = data?.chapter?.number || parsed.chapter;
      const payload = { html, heading: chapterInfo.heading, chapter: chapterNumber };
      bsbCache.set(normalized, payload);
      return payload;
    })
    .catch(err => {
      console.warn("BSB fetch error", err);
      return null;
    });
}

function hideBsbSection() {
  const section = document.getElementById("readingBsb");
  if (!section) return;
  section.textContent = "";
  section.classList.remove("show");
  section.hidden = true;
}

function showBsbText(payload) {
  const section = document.getElementById("readingBsb");
  if (!section) return;
  if (!payload?.html) {
    section.classList.remove("show");
    section.hidden = true;
    section.textContent = "";
    return;
  }
  section.innerHTML = payload.html;
  section.classList.add("show");
  section.hidden = false;
}

function renderBsbText(reference) {
  if (!reference) {
    hideBsbSection();
    return;
  }
  const normalized = reference.trim();
  if (normalized === lastBsbRequest && bsbCache.has(normalized)) {
    showBsbText(bsbCache.get(normalized));
    return;
  }

  const performRemote = () => {
    callBsbApi(normalized).then(text => {
      if (reference.trim() !== lastBsbRequest) return;
      showBsbText(text);
    });
  };
  performRemote();
}

function renderBodyText(rawText) {
  const container = document.getElementById("readingBody");
  if (!container) return;
  container.textContent = rawText || "";
}

function renderMeditation(plan, entry) {
  const panel = document.getElementById("meditation");
  const day = entry?.dayIndex;
  const start = Number.isInteger(day) && day >= 385
    ? day - (day - 385) % 7
    : null;
  const week = plan?.id === DWELLING_PLAN_ID ? meditationWeeks[start] : null;
  panel.hidden = !week;
  document.getElementById("readingTitleRow").hidden = Boolean(week);
  document.getElementById("readingBody").hidden = Boolean(week);
  const contextPanel = document.getElementById("meditationContextPanel");
  if (!week) {
    contextPanel.open = false;
    shownMeditationWeek = null;
    return;
  }

  if (shownMeditationWeek !== start) {
    shownMeditationWeek = start;
    contextPanel.open = false;
  }

  document.getElementById("meditationTitle").textContent = week.title;
  document.getElementById("meditationReference").textContent = `${week.reference} (CSB)`;
  document.getElementById("meditationConnection").textContent = week.studyConnection;
  document.getElementById("meditationContext").textContent = `Before your first walk, read ${week.context}.`;

  // Split the week evenly across the phrases: with two phrases, days 1–4 show
  // the first half of the verse and days 5–7 show the second half.
  const phraseCount = week.phrases.length;
  const dayOfWeek = Math.min(Math.max(day - start, 0), 6);
  const phraseIndex = Math.min(phraseCount - 1, Math.floor((dayOfWeek * phraseCount) / 7));
  const phrase = week.phrases[phraseIndex];

  const part = document.getElementById("meditationPart");
  part.textContent = `Part ${phraseIndex + 1} of ${phraseCount}`;
  part.hidden = phraseCount < 2;

  document.getElementById("meditationQuote").textContent = phrase.quote;
  document.getElementById("readingQuestions").textContent = phrase.question;
  document.getElementById("readingPrayer").textContent = phrase.prayer;
}

function renderCurrentEntry() {
  const readingTitle = document.getElementById("readingTitle");
  const readingRef = document.getElementById("readingRef");
  const readingBody = document.getElementById("readingBody");
  const readingQuestions = document.getElementById("readingQuestions");
  const readingPrayer = document.getElementById("readingPrayer");
  const readingFooter = document.getElementById("readingFooter");
  const readingDate = document.getElementById("readingDate");
  const planNameEl = document.getElementById("planName");

  const plan = getCurrentPlan();
  const todayIso = getTodayIso();

  planNameEl.textContent = formatPlanName(plan?.name) || "No Plan";

  if (!plan || !Array.isArray(plan.entries) || plan.entries.length === 0) {
    readingTitle.textContent = "No reading for today";
    readingRef.textContent = "";
    readingBody.textContent =
      "There is no entry for today in the active plan.\n\n" +
      "You can add one via the plan editor below.";
    readingQuestions.textContent = "";
    readingPrayer.textContent = "";
    readingFooter.textContent = "";
    readingDate.textContent = formatDisplayDate(todayIso);
    updateProgressDisplay(0, 0);
    updateNavigationButtons(0);
    hideBsbSection();
    renderMeditation(null, null);
    return;
  }

  const entries = plan.entries;
  const idx = ensureEntryIndexInRange(plan);
  const entry = entries[idx];

  readingTitle.textContent = entry?.title || "Untitled";
  readingRef.textContent = entry?.reference || "";
  renderBodyText(entry?.body || "");
  readingQuestions.textContent = entry?.questions || "";
  readingPrayer.textContent = entry?.prayer || "";

  const label = entry?.date
    ? formatDisplayDate(entry.date)
    : `Day ${entry?.dayIndex || idx + 1}`;
  const todayLabel = formatDisplayDate(todayIso);
  readingDate.textContent = todayLabel;
  readingFooter.textContent = `${label} · Entry ${idx + 1} of ${entries.length}`;

  updateProgressDisplay(idx, entries.length);
  updateNavigationButtons(entries.length);
  renderBsbText(entry.reference);
  renderMeditation(plan, entry);
}

function findTodayEntryIndex(plan) {
  if (!plan || !Array.isArray(plan.entries) || plan.entries.length === 0) {
    return -1;
  }

  const today = getTodayIso();
  const entries = plan.entries;

  const exactIndex = entries.findIndex(e => e.date === today);
  if (exactIndex >= 0) return exactIndex;

  if (plan.startDate) {
    const start = new Date(plan.startDate);
    const now = new Date(today);
    const diffMs = now - start;
    if (!Number.isNaN(diffMs)) {
      const dayIndex = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
      if (dayIndex > 0) {
        const byDayIndex = entries.findIndex(e => e.dayIndex === dayIndex);
        if (byDayIndex >= 0) return byDayIndex;
      }
    }
  }

  return 0;
}

function ensureEntryIndexInRange(plan) {
  if (!plan || !Array.isArray(plan.entries) || plan.entries.length === 0) {
    state.currentEntryIndex = -1;
    return -1;
  }

  const len = plan.entries.length;
  if (
    typeof state.currentEntryIndex !== "number" ||
    state.currentEntryIndex < 0 ||
    state.currentEntryIndex >= len
  ) {
    state.currentEntryIndex = findTodayEntryIndex(plan);
  }

  if (state.currentEntryIndex < 0) {
    state.currentEntryIndex = 0;
  }
  if (state.currentEntryIndex >= len) {
    state.currentEntryIndex = len - 1;
  }

  return state.currentEntryIndex;
}

function changeEntryIndex(delta) {
  const plan = getCurrentPlan();
  if (!plan || !Array.isArray(plan.entries) || plan.entries.length === 0) return;
  ensureEntryIndexInRange(plan);
  setEntryIndex(state.currentEntryIndex + delta);
}

function setEntryIndex(index) {
  const plan = getCurrentPlan();
  if (!plan || !Array.isArray(plan.entries) || plan.entries.length === 0) return;
  const len = plan.entries.length;
  const clamped = Math.max(0, Math.min(len - 1, index));
  if (state.currentEntryIndex === clamped) {
    return;
  }
  state.currentEntryIndex = clamped;
  persistPlanProgress();
  renderCurrentEntry();
}

function updateNavigationButtons(entryCount) {
  if (!navigationControls.prev || !navigationControls.next) return;
  if (entryCount <= 1) {
    navigationControls.prev.disabled = true;
    navigationControls.next.disabled = true;
    return;
  }

  navigationControls.prev.disabled = state.currentEntryIndex <= 0;
  navigationControls.next.disabled = state.currentEntryIndex >= entryCount - 1;
}

function formatDisplayDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function formatPlanName(name) {
  if (!name || typeof name !== "string") return "";
  const cleaned = name.replace(/[-_]+/g, " ").trim();
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ----- UI wiring -----------------------------------------------------

let state = {
  plans: [],
  activePlanId: null,
  currentEntryIndex: -1,
  themeMode: DEFAULT_THEME_MODE,
  displaySettings: {
    fontSizeIndex: Math.floor(FONT_SIZE_STEPS.length / 2),
    fontFamilyIndex: 0
  },
  planProgress: {}
};

const navigationControls = {
  prev: null,
  next: null
};

const bsbCache = new Map();
let lastBsbRequest = null;

async function init() {
  const [defaultPlan, meditations] = await Promise.all([
    loadDefaultPlan(),
    loadBundledJson("meditations.json")
  ]);
  if (meditations?.version === 1 && meditations.weeks) {
    meditationWeeks = meditations.weeks;
  }
  state.plans = loadPlans(defaultPlan);
  state.activePlanId = loadActivePlanId(state.plans, defaultPlan);
  state.planProgress = loadPlanProgress();
  state.currentEntryIndex = getInitialEntryIndexForPlan(getCurrentPlan());
  if (state.currentEntryIndex >= 0) {
    persistPlanProgress();
  }
  state.themeMode = loadThemeMode();
  applyTheme(state.themeMode);
  const savedSettings = loadDisplaySettings();
  if (savedSettings) {
    state.displaySettings = savedSettings;
  }
  applyDisplaySettings(state.displaySettings);
  savePlans(state.plans);
  saveActivePlanId(state.activePlanId);

  setupPlanSelect();
  wireMenu(defaultPlan);
  wireEditor();
  setupPlanUpload();
  wireUploadShortcut();
  setupFontControls();
  setupThemeToggle();
  wireNavigation();
  wireCalendarResumeRefresh();
  renderCurrentEntry();
}

function getCurrentPlan() {
  return findPlanById(state.plans, state.activePlanId);
}

function setupPlanSelect() {
  const select = document.getElementById("planSelect");
  select.innerHTML = "";

  state.plans.forEach(plan => {
    const opt = document.createElement("option");
    opt.value = plan.id;
    opt.textContent = formatPlanName(plan.name) || plan.name || "Untitled Plan";
    opt.dataset.planId = plan.id;
    if (plan.id === state.activePlanId) opt.selected = true;
    select.appendChild(opt);
  });

  select.dataset.activePlanId = state.activePlanId || "";

  select.addEventListener("change", () => {
    state.activePlanId = select.value;
    saveActivePlanId(state.activePlanId);
    state.currentEntryIndex = -1;
    const plan = getCurrentPlan();
    const initialIndex = getInitialEntryIndexForPlan(plan);
    setEntryIndex(initialIndex);
    showToast("Active plan updated");
    broadcastPlanChange(state.activePlanId);
  });
}

function broadcastPlanChange(planId) {
  const select = document.getElementById("planSelect");
  if (!select) return;
  select.dataset.activePlanId = planId || "";
  select.dispatchEvent(
    new CustomEvent("planchange", {
      detail: { planId }
    })
  );
}

function wireMenu(defaultPlan) {
  const menuToggle = document.getElementById("menuToggle");
  const menuPanel = document.getElementById("menuPanel");
  const resetSampleBtn = document.getElementById("resetSampleBtn");
  const resetPlanProgressBtn = document.getElementById("resetPlanProgressBtn");
  const setCurrentAsTodayBtn = document.getElementById("setCurrentAsTodayBtn");
  const refreshAppBtn = document.getElementById("refreshAppBtn");
  const deletePlanBtn = document.getElementById("deletePlanBtn");

  const openMenu = () => menuPanel.classList.add("open");
  const closeMenu = () => menuPanel.classList.remove("open");

  menuToggle.addEventListener("click", () => {
    if (menuPanel.classList.contains("open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  document.addEventListener("click", event => {
    if (!menuPanel.classList.contains("open")) return;
    const target = event.target;
    const clickedInside = menuPanel.contains(target) || menuToggle.contains(target);
    if (!clickedInside) {
      closeMenu();
    }
  });

  resetSampleBtn.disabled = !defaultPlan;
  resetSampleBtn.addEventListener("click", () => {
    const plan = findPlanById(state.plans, defaultPlan.id);
    if (!plan) state.plans.unshift(clonePlan(defaultPlan));
    state.activePlanId = defaultPlan.id;
    savePlans(state.plans);
    saveActivePlanId(state.activePlanId);
    setupPlanSelect();
    state.currentEntryIndex = -1;
    setEntryIndex(getInitialEntryIndexForPlan(getCurrentPlan()));
    showToast("Default study selected");
    broadcastPlanChange(state.activePlanId);
  });

  resetPlanProgressBtn?.addEventListener("click", () => {
    const plan = getCurrentPlan();
    if (!plan || !Array.isArray(plan.entries) || plan.entries.length === 0) {
      showToast("No active plan entries to reset");
      return;
    }
    state.currentEntryIndex = -1;
    setEntryIndex(0);
    showToast("Plan reset to Day 1");
  });

  setCurrentAsTodayBtn?.addEventListener("click", () => {
    const plan = getCurrentPlan();
    if (!plan || !Array.isArray(plan.entries) || plan.entries.length === 0) {
      showToast("No active plan entries to set");
      return;
    }

    const idx = ensureEntryIndexInRange(plan);
    if (idx < 0) {
      showToast("No active entry to set");
      return;
    }

    const entry = plan.entries[idx];
    if (!entry || typeof entry !== "object") {
      showToast("Current entry is invalid");
      return;
    }

    const todayIso = getTodayIso();

    // Ensure date-based matching picks this entry for today.
    plan.entries.forEach((item, itemIdx) => {
      if (!item || typeof item !== "object" || itemIdx === idx) return;
      if (item.date === todayIso) {
        delete item.date;
      }
    });
    entry.date = todayIso;

    // Keep dayIndex-based progression aligned from this entry forward.
    const hasDayIndex = plan.entries.some(item => item && typeof item.dayIndex === "number");
    const selectedDayIndex =
      typeof entry.dayIndex === "number" && entry.dayIndex > 0 ? entry.dayIndex : idx + 1;
    if (hasDayIndex || plan.startDate) {
      plan.startDate = shiftIsoDate(todayIso, -(selectedDayIndex - 1));
    }

    savePlans(state.plans);
    saveActivePlanId(state.activePlanId);
    state.currentEntryIndex = idx;
    persistPlanProgress();
    renderCurrentEntry();
    showToast("Current entry set as today");
    broadcastPlanChange(state.activePlanId);
  });

  deletePlanBtn?.addEventListener("click", () => {
    const plan = getCurrentPlan();
    if (!plan) {
      showToast("No active plan to delete");
      return;
    }
    if (state.plans.length <= 1) {
      showToast("Keep at least one plan");
      return;
    }

    const planLabel = formatPlanName(plan.name) || plan.name || "this plan";
    const confirmDelete = window.confirm(`Delete "${planLabel}"? This cannot be undone.`);
    if (!confirmDelete) return;

    state.plans = state.plans.filter(p => p.id !== plan.id);
    if (state.planProgress && Object.prototype.hasOwnProperty.call(state.planProgress, plan.id)) {
      delete state.planProgress[plan.id];
      savePlanProgress();
    }

    const nextPlan = state.plans[0] || null;
    state.activePlanId = nextPlan ? nextPlan.id : null;
    savePlans(state.plans);
    saveActivePlanId(state.activePlanId);
    setupPlanSelect();
    state.currentEntryIndex = -1;
    setEntryIndex(getInitialEntryIndexForPlan(nextPlan));
    showToast("Plan deleted");
    broadcastPlanChange(state.activePlanId);
  });

  refreshAppBtn?.addEventListener("click", () => {
    savePlans(state.plans);
    saveActivePlanId(state.activePlanId);
    showToast("Refreshing…");
    setTimeout(() => window.location.reload(), 120);
  });
}

function setupPlanUpload() {
  const input = document.getElementById("planFileUpload");
  if (!input) return;
  input.addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name?.split(".").pop()?.toLowerCase();
    if (extension === "json") {
      parseJsonPlanFile(file);
    } else {
      parseCsvFile(file);
    }
    input.value = "";
  });
}

function wireUploadShortcut() {
  const uploadBtn = document.getElementById("uploadPlanBtn");
  const uploadInput = document.getElementById("planFileUpload");
  if (!uploadBtn || !uploadInput) return;
  uploadBtn.addEventListener("click", () => uploadInput.click());
}

function parseCsvFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const text = reader.result;
    if (typeof text !== "string") {
      showToast("Unable to read CSV file.");
      return;
    }
    const rows = parseCsvText(text);
    if (rows.length < 2) {
      showToast("CSV appears empty.");
      return;
    }
    const plan = buildPlanFromCsv(rows, file.name);
    if (!plan || plan.entries.length === 0) {
      showToast("CSV did not contain any entries.");
      return;
    }
    applyUploadedPlan(plan, "CSV plan loaded");
  };
  reader.readAsText(file);
}

function applyUploadedPlan(plan, message) {
  const planToUse = ensurePlanStartDate(clonePlan(plan));
  state.plans = [planToUse, ...state.plans.filter(p => p.id !== planToUse.id)];
  state.activePlanId = planToUse.id;
  savePlans(state.plans);
  saveActivePlanId(state.activePlanId);
  setupPlanSelect();
  state.currentEntryIndex = -1;
  setEntryIndex(getInitialEntryIndexForPlan(planToUse));
  showToast(message);
  broadcastPlanChange(state.activePlanId);
}

function parseJsonPlanFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const text = reader.result;
    if (typeof text !== "string") {
      showToast("Unable to read JSON file.");
      return;
    }
    let parsed;
    try {
      parsed = parseJsonLoose(text);
    } catch (error) {
      showToast("Invalid JSON: " + error.message);
      return;
    }
    const plan = normalizeUploadedPlan(parsed, file.name);
    if (!plan) {
      showToast("JSON plan was missing entries or metadata.");
      return;
    }
    applyUploadedPlan(plan, "JSON plan loaded");
  };
  reader.readAsText(file);
}

function normalizeUploadedPlan(raw, fileName) {
  if (Array.isArray(raw)) {
    raw = { entries: raw };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const entries = Array.isArray(raw.entries) ? raw.entries : [];
  const sanitizedEntries = entries
    .filter(entry => entry && typeof entry === "object")
    .map(normalizeEntryFields)
    .filter(entry => entry.title || entry.body || entry.reference || entry.questions || entry.prayer);
  if (sanitizedEntries.length === 0) return null;

  const baseName = fileName ? fileName.replace(/\.[^.]+$/, "") : "Uploaded Plan";
  return {
    id: raw.id || `json-${Date.now()}`,
    name: raw.name || baseName,
    startDate: raw.startDate,
    entries: sanitizedEntries
  };
}

function normalizeEntryFields(entry) {
  const normalized = { ...entry };

  if (normalized.dayIndex === undefined && normalized.day !== undefined) {
    const parsed = Number(normalized.day);
    if (!Number.isNaN(parsed)) {
      normalized.dayIndex = parsed;
    }
  }

  if (!normalized.questions && normalized.question) {
    normalized.questions = normalized.question;
  }

  return normalized;
}

function ensurePlanStartDate(plan) {
  if (!plan) return plan;
  if (!Array.isArray(plan.entries) || plan.entries.length === 0) return plan;
  const hasDayIndex = plan.entries.some(entry => entry && typeof entry.dayIndex === "number");
  if (!hasDayIndex) return plan;
  const hasDates = plan.entries.some(entry => entry && entry.date);
  if (!plan.startDate || !hasDates) {
    plan.startDate = getTodayIso();
  }
  return plan;
}

function setupThemeToggle() {
  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;
  toggle.addEventListener("click", toggleTheme);
}

function setupFontControls() {
  const familyToggle = document.getElementById("fontFamilyToggle");
  const sizeButtons = document.querySelectorAll("[data-font-size]");
  sizeButtons?.forEach(btn => {
    const index = Number(btn.getAttribute("data-font-size"));
    if (Number.isNaN(index)) return;
    btn.addEventListener("click", () => setFontSizeIndex(index));
  });
  familyToggle?.addEventListener("click", cycleFontFamily);
}

function parseCsvText(text) {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[i + 1] === "\n") {
        i++;
      }
      row.push(current.trim());
      rows.push(row);
      row = [];
      current = "";
      continue;
    }
    current += char;
  }
  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    rows.push(row);
  }
  return rows.filter(r => r.some(cell => cell.trim() !== ""));
}

function normalizeCsvRow(row, headerLength, headerMap) {
  if (!Array.isArray(row) || row.length <= headerLength) return row;
  const questionIndex = headerMap.question ?? headerLength - 2;
  const targetIndex = Math.max(0, Math.min(questionIndex, headerLength - 2));
  const extraCount = row.length - headerLength;
  const normalized = row.slice();
  const extras = normalized.slice(targetIndex + 1, targetIndex + 1 + extraCount);
  normalized.splice(targetIndex + 1, extraCount);
  normalized[targetIndex] = [normalized[targetIndex], ...extras]
    .filter(Boolean)
    .join(", ")
    .trim();
  return normalized;
}

function looksLikeScriptureText(reference, text) {
  if (!reference || !text) return false;
  const normalize = value => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalizedRef = normalize(reference);
  if (!normalizedRef) return false;
  const normalizedText = normalize(text);
  if (!normalizedText.includes(normalizedRef)) return false;
  if (normalizedText.length <= normalizedRef.length + 8) return true;
  return normalizedText === normalizedRef;
}

function buildPlanFromCsv(rows, fileName) {
  const header = rows[0].map(h => h.trim().toLowerCase());
  const headerMap = {};
  header.forEach((name, idx) => {
    headerMap[name] = idx;
  });

  const synonyms = {
    day: ["day", "dayindex", "day index"],
    date: ["date"],
    title: ["title"],
    reference: ["reference", "ref"],
    body: ["body", "text"],
    questions: ["question", "questions"],
    prayer: ["prayer"],
    tag: ["tag"]
  };

  const columnIndex = {};
  for (const [key, names] of Object.entries(synonyms)) {
    columnIndex[key] = names
      .map(name => headerMap[name])
      .find(idx => typeof idx === "number");
  }

  const planEntries = rows.slice(1).map((row, idx) => {
    const normalizedRow = normalizeCsvRow(row, header.length, headerMap);
    const getColumn = key => {
      const col = columnIndex[key];
      if (col === undefined) return "";
      return (normalizedRow[col] || "").trim();
    };

    const entry = {
      title: getColumn("title"),
      reference: getColumn("reference"),
      body: getColumn("body"),
      questions: getColumn("questions"),
      prayer: getColumn("prayer")
    };

    if (looksLikeScriptureText(entry.reference, entry.body)) {
      entry.body = "";
    }

    const dateValue = getColumn("date");
    if (dateValue) {
      entry.date = dateValue;
    }
    const dayValue = getColumn("day");
    if (dayValue) {
      const parsed = Number(dayValue);
      if (!Number.isNaN(parsed)) {
        entry.dayIndex = parsed;
      }
    } else {
      entry.dayIndex = idx + 1;
    }

    return entry;
  });

  const entries = planEntries.filter(
    e => e.title || e.body || e.reference || e.questions || e.prayer
  );
  const droppedEntryCount = planEntries.length - entries.length;
  if (droppedEntryCount > 0) {
    console.warn(
      `Dropped ${droppedEntryCount} CSV row(s) with no title/body/reference/questions/prayer fields.`
    );
  }
  if (entries.length === 0) return null;
  const planName = fileName ? fileName.replace(/\.[^.]+$/, "") : "CSV Plan";
  const startDate = entries.find(e => e.date)?.date;

  return {
    id: `csv-${Date.now()}`,
    name: planName,
    startDate: startDate || undefined,
    entries
  };
}

function wireEditor() {
  const editorPanel = document.getElementById("editorPanel");
  const editPlanBtn = document.getElementById("editPlanBtn");
  const closeEditorBtn = document.getElementById("closeEditorBtn");
  const planJsonInput = document.getElementById("planJsonInput");
  const savePlanJsonBtn = document.getElementById("savePlanJsonBtn");
  const editorError = document.getElementById("editorError");

  function openEditor() {
    const currentPlan = getCurrentPlan();
    if (!currentPlan) return;
    editorError.textContent = "";
    // Pretty-print JSON of the active plan
    planJsonInput.value = JSON.stringify(currentPlan, null, 2);
    editorPanel.classList.add("open");
  }

  function closeEditor() {
    editorPanel.classList.remove("open");
  }

  editPlanBtn.addEventListener("click", openEditor);
  closeEditorBtn.addEventListener("click", closeEditor);

  savePlanJsonBtn.addEventListener("click", () => {
    editorError.textContent = "";
    const raw = planJsonInput.value.trim();
    if (!raw) {
      editorError.textContent = "JSON cannot be empty.";
      return;
    }

    let parsed;
    try {
      parsed = parseJsonLoose(raw);
    } catch (e) {
      editorError.textContent = "Invalid JSON:\n" + e.message;
      return;
    }

    if (!parsed.id) {
      editorError.textContent = "Plan must include an 'id' field.";
      return;
    }
    if (!parsed.name) {
      editorError.textContent = "Plan must include a 'name' field.";
      return;
    }
    if (!Array.isArray(parsed.entries)) {
      editorError.textContent = "Plan must include an 'entries' array.";
      return;
    }

    // Upsert plan in list
    const planToSave = ensurePlanStartDate(parsed);
    const idx = state.plans.findIndex(p => p.id === planToSave.id);
    if (idx >= 0) {
      state.plans[idx] = planToSave;
    } else {
      state.plans.push(planToSave);
    }

    state.activePlanId = planToSave.id;
    savePlans(state.plans);
    saveActivePlanId(state.activePlanId);
    setupPlanSelect();
    state.currentEntryIndex = -1;
    setEntryIndex(getInitialEntryIndexForPlan(getCurrentPlan()));
    showToast("Plan saved");
    broadcastPlanChange(state.activePlanId);
  });
}

function wireNavigation() {
  navigationControls.prev = document.getElementById("prevEntry");
  navigationControls.next = document.getElementById("nextEntry");
  if (!navigationControls.prev || !navigationControls.next) return;

  navigationControls.prev.addEventListener("click", () => changeEntryIndex(-1));
  navigationControls.next.addEventListener("click", () => changeEntryIndex(1));
}

function refreshEntryIndexFromCalendar() {
  const plan = getCurrentPlan();
  if (!plan) return;
  const nextIndex = getInitialEntryIndexForPlan(plan);
  if (nextIndex >= 0) {
    setEntryIndex(nextIndex);
  }
}

function wireCalendarResumeRefresh() {
  window.addEventListener("focus", refreshEntryIndexFromCalendar);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      refreshEntryIndexFromCalendar();
    }
  });
}

function updateProgressDisplay(index, total) {
  const label = document.getElementById("progressLabel");
  const bar = document.getElementById("progressBar");
  if (!label || !bar) return;
  if (total <= 0) {
    label.textContent = "";
    bar.style.width = "0%";
    return;
  }

  label.textContent = `Day ${index + 1} of ${total}`;
  const pct = Math.min(100, ((index + 1) / total) * 100);
  bar.style.width = `${pct}%`;
}

// Toast helper
let toastTimeout = null;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

// Init on load
document.addEventListener("DOMContentLoaded", init);
