const state = {
  route: "dashboard",
  authorityId: KM_DATA.authorities[0].id,
  tab: "snapshot",
  contactFilter: "",
  statusFilter: "all",
  dirty: false,
  lastSavedAt: localStorage.getItem("km:lastSavedAt") || "",
  authorities: KM_DATA.authorities,
  tableCache: {},
  noteCache: {},
  activityLog: [],
  autosaveTimer: null,
  currentUser: localStorage.getItem("km:currentUser") || "",
  savingNow: false,
  loading: true,
};

const statusLabels = {
  green: "תקין",
  yellow: "דורש תשומת לב",
  red: "סיכון",
};

const segmentedAuthorityIds = ["netanya", "basmat", "zarzir"];
const educationStages = [
  ["elementary", "יסודי"],
  ["middle", "חטיבה"],
  ["high", "תיכון"],
];

const navItems = [
  ["dashboard", "Dashboard", "⌂"],
  ["overview", "Overview", "◎"],
  ["authorities", "רשויות", "▦"],
  ["centers", "מרכזים", "▥"],
  ["contacts", "אנשי קשר", "☎"],
  ["tasks", "משימות", "☑"],
  ["risks", "סיכונים", "⚠"],
  ["opportunities", "הזדמנויות", "◈"],
  ["workplans", "תוכניות עבודה", "▤"],
  ["calendar", "לוח שנה שנתי", "◷"],
  ["documents", "מסמכים", "▣"],
  ["knowledge", "Knowledge Base", "▧"],
  ["lessons", "Lessons Learned", "✦"],
  ["activity", "Activity Log", "◔"],
  ["insights", "תובנות ניהוליות", "◆"],
];

const tabs = [
  ["snapshot", "תמונת מצב"],
  ["stakeholders", "בעלי עניין"],
  ["org", "עץ ארגוני"],
  ["tasks", "משימות"],
  ["risks", "סיכונים"],
  ["opportunities", "הזדמנויות"],
  ["history", "היסטוריה"],
  ["politics", "פוליטיקה ארגונית"],
  ["documents", "מסמכים"],
  ["recommendations", "המלצות למחליף"],
];

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === "class") node.className = value;
    else if (key === "html") node.innerHTML = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value);
  });
  children.forEach(child => node.append(child instanceof Node ? child : document.createTextNode(child)));
  return node;
}

function mount() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  app.append(renderSidebar(), renderMain());
  bindSearch();
}

async function initApp() {
  state.loading = true;
  try {
    if (!window.KM_DB) throw new Error("KM_DB לא נטען. בדקי שהקובץ supabaseClient.js קיים ונטען.");
    state.authorities = await KM_DB.loadAuthorities(KM_DATA.authorities);
    state.activityLog = await KM_DB.loadActivity();
    localStorage.removeItem("km:initWarning");
  } catch (error) {
    console.error("Application init failed. Falling back to local data.", error);
    state.authorities = KM_DATA.authorities;
    state.activityLog = loadJson("km:activityLog") || [];
    localStorage.setItem("km:initWarning", error.message || String(error));
  }
  if (!state.authorities.some(item => item.id === state.authorityId)) {
    state.authorityId = state.authorities[0]?.id || KM_DATA.authorities[0].id;
  }
  state.loading = false;
  try {
    mount();
    renderInitWarning();
  } catch (error) {
    console.error("Render failed", error);
    renderFatalError(error);
  }
}

function authorities() {
  return state.authorities && state.authorities.length ? state.authorities : KM_DATA.authorities;
}

function renderInitWarning() {
  const warning = localStorage.getItem("km:initWarning");
  if (!warning) return;
  const main = document.querySelector(".main");
  if (!main) return;
  main.prepend(el("div", { class: "app-warning" }, [
    el("strong", {}, ["המערכת עלתה במצב מקומי"]),
    el("span", {}, [`Supabase לא נטען כרגע: ${warning}`])
  ]));
}

function renderFatalError(error) {
  const app = document.getElementById("app");
  app.className = "";
  app.innerHTML = "";
  app.append(el("main", { class: "fatal-error" }, [
    el("h1", {}, ["המערכת לא הצליחה להיטען"]),
    el("p", {}, ["הדף כבר לא ריק, הנה השגיאה שעצרה את הטעינה:"]),
    el("pre", {}, [error && error.stack ? error.stack : String(error)]),
    el("p", {}, ["נסי לרענן עם Ctrl + F5. אם זה חוזר, שלחי לי צילום מסך של ההודעה הזו."])
  ]));
}

function renderSidebar() {
  const side = el("aside", { class: "sidebar" });
  side.append(el("div", { class: "brand" }, [
    el("div", { class: "brand-mark" }, ["NB"]),
    el("div", {}, [
      el("h1", {}, ["ניהול ידע - אזור החוף"]),
      el("p", {}, ["נוי בוהדנה"]),
      el("p", {}, ["חינוך לפסגות"])
    ])
  ]));
  const group = el("div", { class: "nav-group" }, [el("div", { class: "nav-title" }, ["ניווט"])]);
  navItems.forEach(([id, label, icon]) => {
    group.append(el("button", {
      class: `nav-item ${state.route === id ? "active" : ""}`,
      onclick: () => { state.route = id; mount(); }
    }, [el("span", { class: "nav-icon" }, [icon]), label]));
  });
  const authNav = el("div", { class: "nav-group" }, [el("div", { class: "nav-title" }, ["רשויות"])]);
  authorities().forEach(item => {
    authNav.append(el("button", {
      class: `nav-item ${state.route === "authority" && state.authorityId === item.id ? "active" : ""}`,
      onclick: () => { state.route = "authority"; state.authorityId = item.id; state.tab = "snapshot"; mount(); }
    }, [el("span", { class: "nav-icon" }, ["●"]), item.name]));
  });
  side.append(group, authNav);
  return side;
}

function renderMain() {
  const main = el("main", { class: "main" });
  main.append(renderTopbar());
  const views = {
    dashboard: renderDashboard,
    overview: renderOverview,
    authorities: renderAuthoritiesIndex,
    centers: () => renderTablePage("מרכזים", "ניהול מרכזים לפי רשות, מנהל/ת, סטטוס ונתוני פעילות", "centers"),
    contacts: () => renderTablePage("מאגר אנשי קשר", "חיפוש, פילטור, תיוגים וקטגוריות לכל אנשי הקשר", "contacts"),
    tasks: () => renderTablePage("משימות", "כל המשימות הפתוחות והקריטיות באזור", "tasks"),
    risks: () => renderTablePage("סיכונים", "סיכונים אסטרטגיים, תקציביים ותפעוליים", "risks"),
    opportunities: () => renderTablePage("הזדמנויות", "מאגר הזדמנויות אזורי", "opportunities"),
    documents: () => renderTablePage("מסמכים", "Repository לקישורים, קבצים, תקציבים, מצגות ודוחות", "documents"),
    knowledge: () => renderBlocksPage("Knowledge Base", KM_DATA.knowledgeBase),
    lessons: () => renderTablePage("Lessons Learned", "מה עבד, מה לא עבד, טעויות ותובנות", "lessons"),
    activity: renderActivityLog,
    workplans: () => renderBlocksPage("תוכניות עבודה", [["תוכנית אזורית", "[הזן כאן תוכנית עבודה אזורית]"], ["תוכנית לפי רשות", "[הזן כאן תוכניות עבודה לפי רשות]"], ["מעקב ביצוע", "[הזן כאן סטטוס ביצוע ותלויות]"]]),
    calendar: () => renderBlocksPage("לוח שנה שנתי", [["אירועים קבועים", "[הזן כאן אירועים קבועים לפי חודשים]"], ["אבני דרך", "[הזן כאן אבני דרך שנתיות]"], ["דדליינים", "[הזן כאן דדליינים קריטיים]"]]),
    insights: () => renderBlocksPage("תובנות ניהוליות", [["עקרונות ניהול", "[הזן כאן עקרונות ניהוליים חשובים]"], ["מה חשוב לדעת", "[הזן כאן תובנות עומק למחליף/ה]"], ["אזהרות מוקדמות", "[הזן כאן סימנים מקדימים שכדאי לשים לב אליהם]"]]),
    authority: renderAuthority,
  };
  main.append((views[state.route] || renderDashboard)());
  main.append(renderNotes());
  return main;
}

function renderTopbar() {
  const title = state.route === "authority"
    ? authorities().find(a => a.id === state.authorityId).name
    : KM_DATA.meta.title;
  return el("div", { class: "topbar" }, [
    el("div", {}, [
      el("p", { class: "page-kicker" }, ["Executive Knowledge System"]),
      el("h1", { class: "page-title" }, [title]),
      el("p", { class: "page-subtitle" }, [KM_DATA.meta.subtitle])
    ]),
    el("div", { class: "topbar-actions" }, [
      renderSaveControls(),
      el("div", { class: "search-wrap" }, [
        el("span", { class: "search-icon" }, ["⌕"]),
        el("input", { class: "global-search", id: "globalSearch", placeholder: "חיפוש גלובלי בכל המערכת" }),
        el("div", { class: "search-results", id: "searchResults" })
      ])
    ])
  ]);
}

function renderSaveControls() {
  return el("div", { class: "save-controls" }, [
    el("input", {
      class: "user-input",
      placeholder: "מי מעדכן/ת?",
      value: state.currentUser,
      oninput: event => setCurrentUser(event.target.value)
    }),
    el("button", { class: "btn primary save-btn", onclick: saveCurrentPage }, ["שמור"]),
    el("button", { class: "btn", onclick: exportPdf }, ["Export PDF"]),
    el("button", { class: "btn", onclick: exportBackup }, ["גיבוי JSON"]),
    el("button", { class: "btn", onclick: () => document.getElementById("backupImport").click() }, ["ייבוא גיבוי"]),
    el("input", { id: "backupImport", class: "visually-hidden", type: "file", accept: "application/json", onchange: importBackup }),
    el("span", { class: `db-status ${KM_DB.isConfigured() ? "online" : "local"}` }, [
      KM_DB.isConfigured() ? "Supabase מחובר" : "מצב מקומי"
    ]),
    el("span", { class: "autosave-status", id: "autosaveStatus" }, ["Auto Save פעיל"]),
    el("span", { class: `save-status ${state.dirty ? "dirty" : "saved"}`, id: "saveStatus" }, [
      state.dirty ? "יש שינויים שלא נשמרו" : savedLabel()
    ])
  ]);
}

function renderDashboard() {
  return el("div", { class: "grid" }, [
    el("section", { class: "grid cols-5" }, authorities().map(renderAuthorityCard)),
    el("section", { class: "grid cols-2" }, [
      renderHeatMap(),
      renderCriticalWidgets(),
    ]),
    renderQuickAccess(),
  ]);
}

function renderAuthorityCard(item) {
  return el("article", { class: `authority-card card status-${item.status}` }, [
    el("div", { class: "card-head" }, [
      el("h3", {}, [item.name]),
      statusPill(item.status),
    ]),
    el("div", { class: "metrics" }, [
      editableMetric(item.id, "students", "תלמידים", item.students),
      editableMetric(item.id, "mentors", "מדריכים", item.mentors),
      editableMetric(item.id, "manager", "מנהל מרכז", item.manager),
      editableMetric(item.id, "openTasks", "משימות פתוחות", String(item.openTasks)),
      editableMetric(item.id, "openRisks", "סיכונים פתוחים", String(item.openRisks)),
    ]),
    renderEducationBreakdown(item.id),
    el("button", { class: "btn primary", onclick: () => { state.route = "authority"; state.authorityId = item.id; mount(); } }, ["פתיחת רשות"])
  ]);
}

function renderEducationBreakdown(authorityId) {
  if (!segmentedAuthorityIds.includes(authorityId)) return el("div");
  return el("section", { class: "education-breakdown" }, [
    el("h4", {}, ["חלוקה לפי שכבת גיל"]),
    el("div", { class: "stage-grid" }, educationStages.map(([stageId, label]) =>
      el("div", { class: "stage-box" }, [
        el("strong", {}, [label]),
        editableStageMetric(authorityId, stageId, "students", "חניכים"),
        editableStageMetric(authorityId, stageId, "mentors", "מדריכים"),
        editableStageMetric(authorityId, stageId, "manager", "מנהל/ת מרכז"),
      ])
    ))
  ]);
}

function renderHeatMap() {
  return el("section", { class: "panel" }, [
    el("h2", {}, ["Heat Map"]),
    el("div", { class: "heat-map" }, authorities().map(item =>
      el("div", { class: `heat-cell ${item.status}` }, [
        el("strong", {}, [item.name]),
        el("span", {}, [statusLabels[item.status]])
      ])
    ))
  ]);
}

function renderCriticalWidgets() {
  return el("section", { class: "panel" }, [
    el("h2", {}, ["משימות וסיכונים קריטיים"]),
    el("div", { class: "grid cols-2" }, [
      compactWidget("משימות פתוחות", "[הזן כאן משימות פתוחות]"),
      compactWidget("משימות באיחור", "[הזן כאן משימות באיחור]"),
      compactWidget("קרובות לדדליין", "[הזן כאן משימות קרובות לדדליין]"),
      compactWidget("סיכונים פתוחים", "[הזן כאן סיכונים פתוחים]")
    ])
  ]);
}

function renderQuickAccess() {
  const items = [
    ["אנשי קשר", "contacts"], ["מסמכים", "documents"], ["תוכניות עבודה", "workplans"],
    ["שותפים", "overview"], ["דוחות", "documents"], ["Lessons Learned", "lessons"]
  ];
  return el("section", { class: "panel" }, [
    el("h2", {}, ["Quick Access"]),
    el("div", { class: "toolbar" }, items.map(([label, route]) =>
      el("button", { class: "btn", onclick: () => { state.route = route; mount(); } }, [label])
    ))
  ]);
}

function renderOverview() {
  return renderBlocksPage("Overview", KM_DATA.overview.sections);
}

function renderAuthoritiesIndex() {
  return el("section", { class: "panel" }, [
    el("h2", {}, ["רשויות"]),
    el("div", { class: "grid cols-5" }, authorities().map(renderAuthorityCard))
  ]);
}

function renderAuthority() {
  const item = authorities().find(a => a.id === state.authorityId);
  const manager = getAuthorityValue(item.id, "manager", item.manager);
  return el("section", { class: "panel" }, [
    el("div", { class: "card-head" }, [
      el("div", {}, [
        el("h2", {}, [item.name]),
        el("p", { class: "page-subtitle" }, [`אחראי: ${manager}`])
      ]),
      statusPill(item.status)
    ]),
    el("div", { class: "tabs" }, tabs.map(([id, label]) =>
      el("button", { class: `tab ${state.tab === id ? "active" : ""}`, onclick: () => { state.tab = id; mount(); } }, [label])
    )),
    renderAuthorityTab(item)
  ]);
}

function renderAuthorityTab(item) {
  const name = item.name;
  const snapshots = [
    ["רקע", `[הזן כאן רקע על ${name}]`],
    ["סיפור הרשות", `[הזן כאן את סיפור הרשות]`],
    ["תמונת מצב", "[הזן כאן תמונת מצב עדכנית]"],
    ["חוזקות", "[הזן כאן חוזקות]"],
    ["חולשות", "[הזן כאן חולשות]"],
    ["הזדמנויות", "[הזן כאן הזדמנויות]"],
    ["איומים", "[הזן כאן איומים]"],
  ];
  const politics = [
    ["דינמיקות", "[הזן כאן דינמיקות פוליטיות וארגוניות]"],
    ["רגישויות", "[הזן כאן רגישויות חשובות]"],
    ["בעלי השפעה", "[הזן כאן בעלי השפעה גלויים וסמויים]"],
    ["מוקשים", "[הזן כאן מוקשים שכדאי להכיר]"],
    ["מערכות יחסים מורכבות", "[הזן כאן מערכות יחסים מורכבות]"],
  ];
  const recommendations = [
    ["מה לעשות", "[הזן כאן המלצות פעולה למחליף/ה]"],
    ["מה לא לעשות", "[הזן כאן דברים שכדאי להימנע מהם]"],
    ["אנשים שכדאי לחזק", "[הזן כאן אנשים וקשרים שכדאי לחזק]"],
    ["דברים שלא כדאי לשנות", "[הזן כאן דברים שעובדים וכדאי לשמר]"],
  ];
  const map = {
    snapshot: () => renderBlocks(snapshots),
    stakeholders: () => renderEditableTable("stakeholders"),
    org: renderOrgChart,
    tasks: () => renderEditableTable("tasks"),
    risks: () => renderEditableTable("risks"),
    opportunities: () => renderEditableTable("opportunities"),
    history: renderTimeline,
    politics: () => renderBlocks(politics),
    documents: () => renderEditableTable("documents"),
    recommendations: () => renderBlocks(recommendations),
  };
  return (map[state.tab] || map.snapshot)();
}

function renderBlocksPage(title, blocks) {
  return el("section", { class: "panel" }, [
    el("h2", {}, [title]),
    renderBlocks(blocks)
  ]);
}

function renderBlocks(blocks) {
  return el("div", { class: "section-list" }, blocks.map(([title, text], index) =>
    el("section", {}, [
      el("h3", {}, [title]),
      editableBlock(`block:${state.route}:${state.authorityId}:${state.tab}:${index}:${title}`, text)
    ])
  ));
}

function renderTablePage(title, subtitle, key) {
  return el("section", { class: "panel" }, [
    el("h2", {}, [title]),
    el("p", { class: "page-subtitle" }, [subtitle]),
    renderTableToolbar(key),
    renderEditableTable(key)
  ]);
}

function renderTableToolbar(key) {
  return el("div", { class: "toolbar" }, [
    el("input", { class: "filter-input", placeholder: "חיפוש בטבלה", oninput: event => filterTable(key, event.target.value) }),
    el("select", { class: "select" }, [
      el("option", {}, ["כל הסטטוסים"]),
      el("option", {}, ["פתוח"]),
      el("option", {}, ["בטיפול"]),
      el("option", {}, ["סגור"])
    ]),
    el("button", { class: "btn primary", onclick: () => addTableRow(key) }, ["+ הוספת שורה"]),
    el("button", { class: "btn", onclick: exportCsv }, ["ייצוא CSV"])
  ]);
}

function renderEditableTable(key) {
  const headers = KM_DATA.tables[key];
  const contextKey = tableContextKey(key);
  const storageKey = `table:${contextKey}:${key}`;
  ensureRowsLoaded(key, headers, contextKey);
  const rows = state.tableCache[storageKey] || loadJson(storageKey) || defaultRows(headers);
  return el("div", { class: "table-wrap" }, [
    el("table", { "data-table": key }, [
      el("thead", {}, [el("tr", {}, [...headers.map(h => el("th", {}, [h])), el("th", {}, ["פעולות"])])]),
      el("tbody", { oninput: () => saveTable(key) }, rows.map(row => tableRow(key, row)))
    ])
  ]);
}

function tableRow(key, row) {
  const record = Array.isArray(row) ? { id: `local-${crypto.randomUUID()}`, cells: row } : row;
  return el("tr", { "data-row-id": record.id }, [
    ...record.cells.map(value => el("td", { contenteditable: "true" }, [value])),
    el("td", {}, [el("button", { class: "btn danger", onclick: () => deleteTableRow(key, record.id) }, ["מחיקה"])])
  ]);
}

function addTableRow(key) {
  const table = document.querySelector(`[data-table="${key}"] tbody`);
  if (!table) return;
  table.append(tableRow(key, { id: `local-${crypto.randomUUID()}`, cells: KM_DATA.tables[key].map(h => `[הזן כאן ${h}]`) }));
  saveTable(key);
}

function saveTable(key) {
  const table = document.querySelector(`[data-table="${key}"] tbody`);
  if (!table) return;
  const headers = KM_DATA.tables[key];
  const contextKey = tableContextKey(key);
  const storageKey = `table:${contextKey}:${key}`;
  const rows = [...table.querySelectorAll("tr")].map(row => ({
    id: row.dataset.rowId,
    cells: [...row.querySelectorAll("td[contenteditable='true']")].map(cell => cell.textContent)
  }));
  state.tableCache[storageKey] = rows;
  localStorage.setItem(storageKey, JSON.stringify(rows));
  KM_DB.saveRows(key, headers, contextKey, rows, scopedAuthorityId(key)).then(result => {
    if (result && result.ids && result.ids.length === rows.length) {
      rows.forEach((row, index) => { row.id = result.ids[index]; });
      state.tableCache[storageKey] = rows;
      localStorage.setItem(storageKey, JSON.stringify(rows));
      [...table.querySelectorAll("tr")].forEach((rowNode, index) => {
        rowNode.dataset.rowId = rows[index].id;
      });
    }
    if (result && result.ok) {
      updateSaveStatus(KM_DB.isConfigured() ? "נשמר ב-Supabase" : "נשמר מקומית");
      KM_DB.logActivity("save", key, storageKey, `עודכנה טבלה: ${key}`);
    }
  });
  markDirty();
}

async function deleteTableRow(key, rowId) {
  const row = document.querySelector(`[data-table="${key}"] tr[data-row-id="${rowId}"]`);
  if (row) row.remove();
  await KM_DB.deleteRow(key, rowId);
  await KM_DB.logActivity("delete", key, rowId, `נמחקה שורה מטבלה: ${key}`);
  saveTable(key);
}

function filterTable(key, query) {
  const table = document.querySelector(`[data-table="${key}"] tbody`);
  if (!table) return;
  const normalized = query.trim().toLowerCase();
  [...table.querySelectorAll("tr")].forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(normalized) ? "" : "none";
  });
}

function defaultRows(headers) {
  return [
    { id: `local-${crypto.randomUUID()}`, cells: headers.map(h => `[הזן כאן ${h}]`) },
    { id: `local-${crypto.randomUUID()}`, cells: headers.map(h => `[הזן כאן ${h}]`) },
    { id: `local-${crypto.randomUUID()}`, cells: headers.map(h => `[הזן כאן ${h}]`) },
  ];
}

function tableContextKey(key) {
  const scoped = ["stakeholders", "tasks", "risks", "opportunities", "documents"].includes(key);
  return scoped && state.route === "authority" ? `authority:${state.authorityId}:${state.tab}` : `global:${key}`;
}

function scopedAuthorityId(key) {
  return state.route === "authority" && ["stakeholders", "tasks", "risks", "opportunities", "documents"].includes(key)
    ? state.authorityId
    : null;
}

function ensureRowsLoaded(key, headers, contextKey) {
  const storageKey = `table:${contextKey}:${key}`;
  if (state.tableCache[storageKey]) return;
  state.tableCache[storageKey] = loadJson(storageKey) || null;
  KM_DB.loadRows(key, headers, contextKey, scopedAuthorityId(key)).then(rows => {
    if (rows) {
      state.tableCache[storageKey] = rows;
      mount();
    }
  });
}

function exportCsv() {
  alert("ייצוא CSV מוכן לחיבור לשכבת שמירה. בגרסה זו הנתונים נערכים ישירות במסך כבלוקי הזנה.");
}

function renderOrgChart() {
  return el("div", { class: "org-chart" }, [
    editableBlock(`org:${state.authorityId}:manager`, "מנהל מרכז: [הזן כאן שם ותפקיד]", "org-node"),
    el("div", { class: "org-children" }, [
      editableBlock(`org:${state.authorityId}:mentors`, "מדריכים: [הזן כאן מדריכים]", "org-node"),
      editableBlock(`org:${state.authorityId}:partners`, "שותפים: [הזן כאן שותפים]", "org-node"),
      editableBlock(`org:${state.authorityId}:municipality`, "גורמים ברשות: [הזן כאן גורמים ברשות]", "org-node"),
    ])
  ]);
}

function renderTimeline() {
  return el("div", { class: "timeline" }, [
    timelineItem("אירועים משמעותיים", "[הזן כאן אירועים משמעותיים]"),
    timelineItem("הצלחות", "[הזן כאן הצלחות]"),
    timelineItem("משברים", "[הזן כאן משברים]"),
    timelineItem("החלטות חשובות", "[הזן כאן החלטות חשובות]"),
  ]);
}

function timelineItem(title, text) {
  return el("div", { class: "timeline-item" }, [
    el("h3", {}, [title]),
    editableBlock(`timeline:${state.authorityId}:${title}`, text)
  ]);
}

function renderNotes() {
  const key = `notes:${state.route}:${state.authorityId}:${state.tab}`;
  ensureNoteLoaded(key);
  return el("section", { class: "notes-dock" }, [
    el("div", { class: "notes-head" }, [
      el("h3", {}, ["Notes"]),
      el("span", { class: "meta-line" }, [`Last Updated: ${savedLabel()} | Who: ${currentUserLabel()}`])
    ]),
    el("textarea", {
      placeholder: "[הוסף/י כאן הערות חופשיות לעמוד הנוכחי]",
      "data-storage-key": key,
      oninput: event => {
        localStorage.setItem(key, event.target.value);
        markDirty();
      },
    }, [state.noteCache[key] || localStorage.getItem(key) || ""]),
    renderAttachments()
  ]);
}

function renderAttachments() {
  const attachments = loadJson("km:attachments") || [];
  return el("div", { class: "attachments" }, [
    el("div", { class: "attachment-actions" }, [
      el("strong", {}, ["Attach Files"]),
      el("button", { class: "btn", onclick: () => document.getElementById("fileAttachInput").click() }, ["צירוף קובץ"]),
      el("input", { id: "fileAttachInput", class: "visually-hidden", type: "file", multiple: "true", onchange: handleFileAttach })
    ]),
    el("div", { class: "attachment-list" }, attachments.slice(0, 6).map(file =>
      el("div", { class: "attachment-item" }, [
        el("span", {}, [file.name]),
        el("small", {}, [`${formatBytes(file.size)} | ${file.updated_by || currentUserLabel()}`])
      ])
    ))
  ]);
}

function renderActivityLog() {
  const rows = state.activityLog.length ? state.activityLog : (loadJson("km:activityLog") || []);
  return el("section", { class: "panel" }, [
    el("div", { class: "card-head" }, [
      el("div", {}, [
        el("h2", {}, ["Activity Log"]),
        el("p", { class: "page-subtitle" }, ["תיעוד אוטומטי של שמירות, עריכות, מחיקות וצירוף קבצים"])
      ]),
      el("button", { class: "btn", onclick: refreshActivityLog }, ["רענון"])
    ]),
    el("div", { class: "activity-list" }, rows.length ? rows.map(renderActivityItem) : [
      el("div", { class: "empty-line" }, ["עדיין אין פעילות להצגה."])
    ])
  ]);
}

function renderActivityItem(item) {
  return el("article", { class: "activity-item" }, [
    el("strong", {}, [item.summary || item.action]),
    el("span", {}, [`${item.entity_type || ""} | ${item.updated_by || "משתמש/ת"} | ${formatDateTime(item.created_at)}`])
  ]);
}

function bindSearch() {
  const input = document.getElementById("globalSearch");
  const box = document.getElementById("searchResults");
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    box.innerHTML = "";
    if (!q) { box.classList.remove("open"); return; }
    searchIndex().filter(item => item.text.toLowerCase().includes(q)).slice(0, 16).forEach(item => {
      box.append(el("div", { class: "search-result" }, [
        el("strong", {}, [item.title]),
        el("span", {}, [item.type]),
      ]));
    });
    if (!box.children.length) box.append(el("div", { class: "search-result" }, [el("span", {}, ["לא נמצאו תוצאות."]) ]));
    box.classList.add("open");
  });
}

function searchIndex() {
  const items = [];
  authorities().forEach(a => {
    const manager = getAuthorityValue(a.id, "manager", a.manager);
    items.push({ title: a.name, type: "רשות", text: `${a.name} ${manager} ${statusLabels[a.status]}` });
    tabs.forEach(([, label]) => items.push({ title: `${a.name} / ${label}`, type: "עמוד רשות", text: `${a.name} ${label}` }));
  });
  navItems.forEach(([, label]) => items.push({ title: label, type: "ניווט", text: label }));
  KM_DATA.knowledgeBase.forEach(([title, text]) => items.push({ title, type: "Knowledge Base", text: `${title} ${text}` }));
  Object.entries(state.tableCache).forEach(([key, rows]) => {
    if (!Array.isArray(rows)) return;
    rows.forEach(row => items.push({ title: row.cells?.[0] || key, type: `טבלה: ${key}`, text: `${key} ${(row.cells || []).join(" ")}` }));
  });
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    const value = localStorage.getItem(key) || "";
    if (key.startsWith("table:")) {
      try {
        JSON.parse(value).forEach(row => items.push({ title: row.cells?.[0] || key, type: "טבלה", text: `${key} ${(row.cells || []).join(" ")}` }));
      } catch {}
    }
    if (key.startsWith("notes:") || key.startsWith("block:") || key.startsWith("org:") || key.startsWith("timeline:")) {
      items.push({ title: key, type: "Notes", text: `${key} ${value}` });
    }
  }
  (loadJson("km:attachments") || []).forEach(file => items.push({ title: file.name, type: "קובץ מצורף", text: `${file.name} ${file.type || ""}` }));
  (state.activityLog || []).forEach(item => items.push({ title: item.summary || item.action, type: "Activity", text: `${item.summary || ""} ${item.updated_by || ""}` }));
  return items;
}

function editableBlock(key, fallback, className = "editable-block") {
  ensureNoteLoaded(key);
  return el("div", {
    class: className,
    contenteditable: "true",
    "data-storage-key": key,
    "data-note-title": key,
    oninput: event => {
      localStorage.setItem(key, event.currentTarget.textContent);
      markDirty();
    }
  }, [state.noteCache[key] || localStorage.getItem(key) || fallback]);
}

function loadJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function saveCurrentPage() {
  clearTimeout(state.autosaveTimer);
  state.savingNow = true;
  document.querySelectorAll("[contenteditable='true'][data-storage-key]").forEach(node => {
    const key = node.dataset.storageKey;
    localStorage.setItem(key, node.textContent);
    if (key.startsWith("authority:")) {
      const [, authorityId, field] = key.split(":");
      KM_DB.saveAuthorityField(authorityId, field, node.textContent);
      KM_DB.logActivity("update", "authority", authorityId, `עודכן שדה רשות: ${field}`);
      return;
    }
    KM_DB.saveNote(key, node.textContent, {
      authorityId: state.route === "authority" ? state.authorityId : null,
      noteType: "content_block",
      title: node.dataset.noteTitle || key,
    });
    KM_DB.logActivity("update", "note", key, `עודכן בלוק ידע: ${node.dataset.noteTitle || key}`);
  });
  document.querySelectorAll("textarea[data-storage-key]").forEach(node => {
    localStorage.setItem(node.dataset.storageKey, node.value);
    KM_DB.saveNote(node.dataset.storageKey, node.value, {
      authorityId: state.route === "authority" ? state.authorityId : null,
      noteType: "page_note",
      title: "Notes",
    });
    KM_DB.logActivity("update", "note", node.dataset.storageKey, "עודכנו הערות עמוד");
  });
  document.querySelectorAll("table[data-table]").forEach(table => {
    saveTable(table.dataset.table);
  });
  state.dirty = false;
  state.lastSavedAt = new Date().toLocaleString("he-IL");
  localStorage.setItem("km:lastSavedAt", state.lastSavedAt);
  localStorage.setItem("km:lastUpdatedBy", currentUserLabel());
  state.savingNow = false;
  updateSaveStatus("נשמר עכשיו");
  updateAutosaveStatus("Auto Save פעיל");
}

function markDirty() {
  state.dirty = true;
  updateSaveStatus("יש שינויים שלא נשמרו", true);
  if (state.savingNow) return;
  scheduleAutoSave();
}

function scheduleAutoSave() {
  clearTimeout(state.autosaveTimer);
  updateAutosaveStatus("Auto Save ממתין...");
  state.autosaveTimer = setTimeout(() => {
    updateAutosaveStatus("Auto Save שומר...");
    saveCurrentPage();
  }, 1200);
}

function updateSaveStatus(text, dirty = false) {
  const status = document.getElementById("saveStatus");
  if (!status) return;
  status.textContent = text;
  status.className = `save-status ${dirty ? "dirty" : "saved"}`;
}

function updateAutosaveStatus(text) {
  const status = document.getElementById("autosaveStatus");
  if (status) status.textContent = text;
}

function savedLabel() {
  return state.lastSavedAt ? `נשמר לאחרונה: ${state.lastSavedAt}` : "מוכן לשמירה";
}

function currentUserLabel() {
  return state.currentUser || localStorage.getItem("km:currentUser") || "משתמש/ת";
}

function setCurrentUser(value) {
  state.currentUser = value.trim();
  localStorage.setItem("km:currentUser", state.currentUser);
}

function exportPdf() {
  saveCurrentPage();
  KM_DB.logActivity("export", "pdf", state.route, `יוצא PDF מעמוד: ${state.route}`);
  window.print();
}

async function handleFileAttach(event) {
  const files = [...(event.target.files || [])];
  for (const file of files) {
    const fileRecord = await fileToAttachment(file);
    await KM_DB.saveAttachment(fileRecord);
    await KM_DB.logActivity("attach", "document", fileRecord.name, `צורף קובץ: ${fileRecord.name}`);
  }
  event.target.value = "";
  updateSaveStatus("קבצים צורפו");
  state.activityLog = await KM_DB.loadActivity();
  mount();
}

function fileToAttachment(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      data_url: reader.result,
      authority_id: state.route === "authority" ? state.authorityId : null,
      route: state.route,
      tab: state.tab,
      updated_by: currentUserLabel(),
      updated_at: new Date().toISOString(),
    });
    reader.readAsDataURL(file);
  });
}

async function refreshActivityLog() {
  state.activityLog = await KM_DB.loadActivity();
  mount();
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("he-IL");
}

function exportBackup() {
  saveCurrentPage();
  const backup = {};
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && (key.startsWith("authority:") || key.startsWith("block:") || key.startsWith("table:") || key.startsWith("notes:") || key.startsWith("org:") || key.startsWith("timeline:") || key.startsWith("km:"))) {
      backup[key] = localStorage.getItem(key);
    }
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `knowledge-management-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  updateSaveStatus("גיבוי נוצר");
}

function importBackup(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const backup = JSON.parse(reader.result);
      Object.entries(backup).forEach(([key, value]) => {
        if (typeof key === "string" && typeof value === "string") {
          localStorage.setItem(key, value);
        }
      });
      state.dirty = false;
      state.lastSavedAt = localStorage.getItem("km:lastSavedAt") || new Date().toLocaleString("he-IL");
      mount();
      updateSaveStatus("גיבוי נטען");
    } catch {
      updateSaveStatus("קובץ גיבוי לא תקין", true);
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function ensureNoteLoaded(key) {
  if (Object.prototype.hasOwnProperty.call(state.noteCache, key)) return;
  state.noteCache[key] = localStorage.getItem(key) || "";
  KM_DB.loadNote(key).then(content => {
    if (content !== null && content !== undefined) {
      state.noteCache[key] = content;
      mount();
    }
  });
}

function compactWidget(title, text) {
  return el("div", { class: "empty-line" }, [el("strong", {}, [title]), el("div", {}, [text])]);
}

function metric(label, value) {
  return el("div", { class: "metric" }, [el("span", {}, [label]), el("strong", {}, [value])]);
}

function editableMetric(authorityId, field, label, fallback) {
  const key = `authority:${authorityId}:${field}`;
  return el("div", { class: "metric editable-metric" }, [
    el("span", {}, [label]),
    el("strong", {
      contenteditable: "true",
      "data-storage-key": key,
      oninput: event => {
        const value = event.currentTarget.textContent;
        localStorage.setItem(key, value);
        KM_DB.saveAuthorityField(authorityId, field, value).then(result => {
          if (result && result.ok) updateSaveStatus(KM_DB.isConfigured() ? "נשמר ב-Supabase" : "נשמר מקומית");
        });
        KM_DB.logActivity("update", "authority", authorityId, `עודכן שדה רשות: ${label}`);
        markDirty();
      }
    }, [localStorage.getItem(key) || fallback])
  ]);
}

function editableStageMetric(authorityId, stageId, field, label) {
  const key = `authority:${authorityId}:stage:${stageId}:${field}`;
  return el("label", { class: "stage-field" }, [
    el("span", {}, [label]),
    el("b", {
      contenteditable: "true",
      "data-storage-key": key,
      oninput: event => {
        const value = event.currentTarget.textContent;
        localStorage.setItem(key, value);
        KM_DB.saveNote(key, value, {
          authorityId,
          noteType: "education_stage",
          title: `${authorityId}/${stageId}/${field}`,
        });
        KM_DB.logActivity("update", "education_stage", authorityId, `עודכנה חלוקה לפי שכבה: ${label}`);
        markDirty();
      }
    }, [localStorage.getItem(key) || "[הזן]"])
  ]);
}

function getAuthorityValue(authorityId, field, fallback) {
  return localStorage.getItem(`authority:${authorityId}:${field}`) || fallback;
}

function statusPill(status) {
  return el("span", { class: `status-pill status-${status}` }, [statusLabels[status]]);
}

initApp();
