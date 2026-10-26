let STORAGE_KEY = "ripples-demo-v1";
const EIA_UTAH_KWH_2024 = 774;
const USGS_UTAH_DOMESTIC_GPCD_2015 = 169;
const AVERAGE_MONTH_DAYS = 30.44;
const EIA_SOURCE = "https://www.eia.gov/electricity/sales_revenue_price/pdf/table_5A.pdf";
const USGS_DOMESTIC_SOURCE = "https://pubs.usgs.gov/circ/1441/circ1441.pdf";
const WATER_SOURCE = "https://water.utah.gov/water-data/water-use-reporting/";
const WATER_UNITS = { gal: 1, kgal: 1000, ccf: 748.052 };
const NAV = [
  { id: "home", label: "Home", icon: "home" },
  { id: "usage", label: "My Usage", icon: "chart" },
  { id: "map", label: "Explore Utah", icon: "map" },
  { id: "ripple", label: "Save", icon: "drop" },
  { id: "profile", label: "Profile", icon: "user" }
];
const ACTION_CATALOG = [
  { id: "shorter-showers", title: "Shorten one shower", problem: "Long showers can add up across a household.", action: "Choose a shorter target in the simulator and try it this week.", why: "Fewer minutes at the same flow rate mean less water used; the simulator shows an estimate from your inputs." },
  { id: "hidden-leaks", title: "Look for hidden leaks", problem: "A running toilet or dripping faucet can go unnoticed.", action: "Check fixtures and your meter when nobody is intentionally using water.", why: "Repairing a leak stops water from flowing when it is not needed. Compare later bills to see any measured change." },
  { id: "full-laundry", title: "Run full laundry loads", problem: "Many small loads can use more water and energy per item.", action: "Combine laundry where the care labels allow it.", why: "A fuller load makes better use of each wash cycle. Savings vary by machine and cycle." },
  { id: "outdoor-watering", title: "Inspect outdoor watering", problem: "Broken heads and overspray can waste water in Utah's dry climate.", action: "Watch each sprinkler zone run and repair leaks or water reaching pavement.", why: "Water that reaches the plants instead of pavement can support the landscape with less waste." },
  { id: "idle-power", title: "Check idle electricity use", problem: "Devices can draw electricity while nobody is using them.", action: "Find devices that can be switched off or unplugged between uses.", why: "Fewer hours drawing power can lower future measured kWh. The result depends on each device." }
  ,{ id: "efficient-fixtures", title: "Choose a more efficient fixture", problem: "Older showerheads or faucets may use more water for the same task.", action: "Compare measured flow with a suitable WaterSense-labeled replacement before buying.", why: "A lower flow rate can reduce water use while the fixture runs. Keep duration and comfort in mind; longer use can offset savings." }
];
const CHALLENGES = [
  { id: "water-week", title: "Shorter Shower Week", resource: "water", action: "Try the shorter shower target you chose, then check in once each day." },
  { id: "power-week", title: "Power Down Week", resource: "electricity", action: "Disconnect one safe-to-unplug idle device, then check in once each day." }
];
const ESTIMATE_SCENARIOS = {
  "efficient-fixtures": {
    fields: [{key:"oldFlow",label:"Current measured flow",unit:"gal/min",max:20},{key:"newFlow",label:"Replacement flow",unit:"gal/min",max:20},{key:"minutes",label:"Total household use each day",unit:"minutes",max:1440}],
    formula:"Positive flow-rate difference × minutes/day × 30",unit:"gal / 30 days",
    caution:"Use comparable flow measurements. Assumes the same minutes of use before and after replacement; it does not estimate hot-water energy savings.",
    source:"EPA WaterSense showerheads",url:"https://www.epa.gov/watersense/showerheads"
  },
  "hidden-leaks": {
    fields: [{ key: "rate", label: "Measured leak flow", unit: "gal/hour", max: 10000 }, { key: "hours", label: "Hours flowing each day", unit: "hours", max: 24 }],
    formula: "Leak flow × hours/day × 30 days", unit: "gal / 30 days",
    caution: "Use a meter reading taken while other water use is off. This is potential avoided flow only if the leak is repaired.",
    source: "EPA WaterSense leak checks", url: "https://www.epa.gov/watersense/fix-leak-week"
  },
  "full-laundry": {
    fields: [{ key: "loads", label: "Small loads combined away", unit: "loads/week", max: 30 }, { key: "gallons", label: "Your machine's water per load", unit: "gal/load", max: 100 }],
    formula: "Loads avoided/week × gal/load × 30/7", unit: "gal / 30 days",
    caution: "Find water per cycle in your washer information. Adaptive fill can change the real result; this is a rough scenario, not a promise.",
    source: "EPA WaterSense laundry guidance", url: "https://www.epa.gov/watersense/home-maintenance"
  },
  "outdoor-watering": {
    fields: [{ key: "minutes", label: "Watering time safely reduced", unit: "min/week", max: 1000 }, { key: "flow", label: "Measured zone flow", unit: "gal/min", max: 100 }],
    formula: "Minutes/week × zone flow × 30/7", unit: "gal / 30 days",
    caution: "Only count minutes that can be removed without under-watering plants. A separate irrigation meter may not affect your household bill.",
    source: "EPA WaterSense watering tips", url: "https://www.epa.gov/watersense/watering-tips"
  },
  "idle-power": {
    fields: [{ key: "watts", label: "Measured standby power", unit: "watts", max: 3000 }, { key: "hours", label: "Hours unplugged each day", unit: "hours", max: 24 }],
    formula: "Watts × hours/day × 30 days ÷ 1,000", unit: "kWh / 30 days",
    caution: "Use a plug-in power meter for standby watts. Actual savings depend on the device and whether it is truly disconnected.",
    source: "U.S. DOE standby-power measurement", url: "https://www.energy.gov/cmei/femp/measuring-standby-power"
  }
};
const ICONS = {
  home: '<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-6h6v6"/>',
  chart: '<path d="M4 20V5M4 20h17"/><path d="m7 16 4-4 3 2 6-7"/>',
  map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
  drop: '<path d="M12 2C8 8 5 11 5 15a7 7 0 0 0 14 0c0-4-3-7-7-13Z"/><path d="M9 17a3 3 0 0 0 3 3"/>',
  user: '<circle cx="12" cy="7" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'
};
const DEFAULT_STATE = {
  page: "home",
  resource: "water",
  chartSpan: "monthly",
  chartStyle: "line",
  mapLayer: "demo",
  region: "Salt Lake",
  actionGoals: [],
  challengeRuns: [],
  conservationGoals: [],
  reduceMotion: false,
  profile: { residents: 1, home: "apartment", city: "", lawn: false, irrigation: false, waterGoal: "", electricGoal: "", priority: "both" },
  entries: []
};
const app = document.getElementById("app");
let state = loadState();
let editingId = null;
let notice = "";
let simulation = { current: 10, target: 7, flow: 2, household: null };
const estimateInputs = {
  "hidden-leaks": { rate: "", hours: "" },
  "full-laundry": { loads: "", gallons: "" },
  "outdoor-watering": { minutes: "", flow: "" },
  "idle-power": { watts: "", hours: "" }
  ,"efficient-fixtures": { oldFlow:"", newFlow:"", minutes:"" }
};
const estimateOpen = new Set();
let countyMap = null;
let showcaseCountyStats = [];
let countyLoadError = "";
let usageHistoryOpen = false;
let tiltEnabled = false;
let tiltMessage = "";
let orientationBase = null;

const waterWave = { frame: 0, target: 0, angle: 0, velocity: 0, energy: 0, phase: 0 };

// Browser storage is untrusted: recover safe fields and recompute standardized totals.
function loadState(source) {
  const clean = structuredClone(DEFAULT_STATE);
  try {
    const raw = source === undefined ? JSON.parse(localStorage.getItem(STORAGE_KEY)) : source;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return clean;
    if (NAV.some(item => item.id === raw.page)) clean.page = raw.page;
    if (["water", "electricity"].includes(raw.resource)) clean.resource = raw.resource;
    if (["monthly", "annual"].includes(raw.chartSpan)) clean.chartSpan = raw.chartSpan;
    if (["line", "bar"].includes(raw.chartStyle)) clean.chartStyle = raw.chartStyle;
    if (["demo", "official"].includes(raw.mapLayer)) clean.mapLayer = raw.mapLayer;
    if (typeof raw.region === "string" && raw.region.length <= 40) clean.region = raw.region;
    clean.reduceMotion = raw.reduceMotion === true;
    clean.conservationGoals = Array.isArray(raw.conservationGoals) ? raw.conservationGoals.filter(RipplesData.validGoal).slice(-100).map(g => ({id:g.id,type:g.type,month:g.month,baseline:g.baseline,limit:g.limit,baselineMonth:g.baselineMonth})) : [];
    if (Array.isArray(raw.actionGoals)) {
      const goals = new Map();
      for (const goal of raw.actionGoals) {
        if (ACTION_CATALOG.some(action => action.id === goal?.id)) goals.set(goal.id, { id: goal.id, done: goal.done === true });
      }
      clean.actionGoals = [...goals.values()];
    }
    if (Array.isArray(raw.challengeRuns)) {
      clean.challengeRuns = raw.challengeRuns.slice(-50).filter(run =>
        CHALLENGES.some(challenge => challenge.id === run?.id) && validLocalDay(run.startedOn) &&
        Array.isArray(run.checkins) && run.checkins.length <= 7 &&
        run.checkins.every(day => validLocalDay(day) && dayOffset(run.startedOn, day) >= 0 && dayOffset(run.startedOn, day) < 7) &&
        new Set(run.checkins).size === run.checkins.length
      ).map(run => ({ id: run.id, startedOn: run.startedOn, checkins: [...run.checkins] }));
    }
    const profile = raw.profile || {};
    if (Number.isInteger(profile.residents) && profile.residents >= 1 && profile.residents <= 30) clean.profile.residents = profile.residents;
    if (["house", "apartment", "townhome"].includes(profile.home)) clean.profile.home = profile.home;
    if (typeof profile.city === "string") clean.profile.city = profile.city.trim().slice(0, 80);
    clean.profile.lawn = profile.lawn === true;
    clean.profile.irrigation = profile.irrigation === true;
    if (["water", "electricity", "both"].includes(profile.priority)) clean.profile.priority = profile.priority;
    for (const key of ["waterGoal", "electricGoal"]) {
      if (["string", "number"].includes(typeof profile[key]) && Number.isFinite(Number(profile[key])) && Number(profile[key]) >= 0.01 && Number(profile[key]) <= 1e11) clean.profile[key] = String(profile[key]);
    }
    // One bill per resource/month; invalid records never reach calculations or edit controls.
    const bills = new Map();
    const ids = new Set();
    for (const entry of Array.isArray(raw.entries) ? raw.entries : []) {
      if (!isValidStoredEntry(entry) || ids.has(entry.id)) continue;
      ids.add(entry.id);
      const quantity = Number(entry.quantity);
      bills.set(entry.type + entry.month, {
        id: entry.id, type: entry.type, month: entry.month, days: Number(entry.days),
        quantity, unit: entry.unit, cost: entry.cost == null ? null : Number(entry.cost),
        amount: quantity * (entry.type === "water" ? WATER_UNITS[entry.unit] : 1)
      });
    }
    clean.entries = [...bills.values()];
    return clean;
  } catch {
    return clean;
  }
}
function isValidStoredEntry(e) {
  return e && typeof e.id === "string" && e.id.length > 0 &&
    (e.type === "water" || e.type === "electricity") &&
    typeof e.month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(e.month) && Number(e.month.slice(0, 4)) > 0 &&
    typeof e.quantity === "number" && Number.isFinite(e.quantity) && e.quantity >= 0 && e.quantity <= 1e8 &&
    Number.isInteger(e.days) && e.days >= 1 && e.days <= 366 &&
    (e.type === "water" ? Object.hasOwn(WATER_UNITS, e.unit) : e.unit === "kWh") &&
    (e.cost == null || (typeof e.cost === "number" && Number.isFinite(e.cost) && e.cost >= 0 && e.cost <= 1e6));
}
function saveState(sync = true) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (sync) queueSync();
  } catch {
    notice = "This browser could not save your data. Please check storage settings.";
  }
}
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, char =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function icon(name) {
  return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + "</svg>";
}
function number(value, digits = 0) {
  return Number(value).toLocaleString("en-US", { maximumFractionDigits: digits });
}
function monthLabel(month) {
  if (!month) return "";
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
function todayLocal() {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
}
function dayValue(day) {
  const [year, month, date] = day.split("-").map(Number);
  return Date.UTC(year, month - 1, date);
}
function validLocalDay(day) {
  if (typeof day !== "string" || !/^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(day)) return false;
  const [year] = day.split("-").map(Number);
  return year >= 2000 && year <= 2100 && new Date(dayValue(day)).toISOString().slice(0, 10) === day;
}
function dayOffset(start, day) {
  return Math.round((dayValue(day) - dayValue(start)) / 86400000);
}
function dayAt(start, offset) {
  return new Date(dayValue(start) + offset * 86400000).toISOString().slice(0, 10);
}
function resourceEntries(type = state.resource) {
  return state.entries.filter(e => e.type === type).sort((a, b) => a.month.localeCompare(b.month));
}
function unit(type = state.resource) {
  return type === "water" ? "gal" : "kWh";
}
function latestAndPrevious(type = state.resource) {
  const entries = resourceEntries(type);
  return { latest: entries.at(-1), previous: entries.at(-2) };
}
function daily(entry) {
  return entry ? Number(entry.amount) / Number(entry.days) : null;
}
// Goals and the annual-account benchmark use the same declared average-month basis.
function monthlyEquivalent(entry) {
  return daily(entry) * AVERAGE_MONTH_DAYS;
}
function dailyChange(current, previous) {
  if (!current || !previous) return null;
  // A percentage relative to zero is undefined; two zero bills mean no change.
  if (daily(previous) === 0) return daily(current) === 0 ? 0 : null;
  return ((daily(current) - daily(previous)) / daily(previous)) * 100;
}
function resourceSwitch() {
  return '<div class="switch" role="group" aria-label="Resource">' +
    '<button type="button" data-resource="water" aria-pressed="' + (state.resource === "water") + '" class="' + (state.resource === "water" ? "selected" : "") + '">Water</button>' +
    '<button type="button" data-resource="electricity" aria-pressed="' + (state.resource === "electricity") + '" class="' + (state.resource === "electricity" ? "selected" : "") + '">Electricity</button></div>';
}
function pageIntro(kicker, title, subtitle) {
  return `
    <header class="intro">
      <h1>${esc(title)}</h1>
      ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
    </header>
  `;
}
function renderShell() {
  document.documentElement.classList.toggle('reduce-motion', state.reduceMotion);
  // Keep keyboard users on the control they activated after replacing the view.
  const active = document.activeElement;
  const focusKey = ["data-nav", "data-resource", "data-map-layer", "data-span", "data-region"].find(key => active?.hasAttribute(key));
  const focusValue = focusKey ? active.getAttribute(focusKey) : null;
  const content = {
    home: renderHome,
    usage: renderUsage,
    map: renderMap,
    ripple: renderRipple,
    profile: renderProfile
  }[state.page]();
  app.innerHTML =
    '<div class="app-shell"><aside class="sidebar" aria-label="Main navigation">' +
      '<div class="brand"><span class="brand-mark">≈</span>ripples.</div>' +
      '<nav class="nav-list">' + NAV.map(item =>
        '<button type="button" class="nav-button ' + (state.page === item.id ? "active" : "") +
        '" data-nav="' + item.id + '" aria-current="' + (state.page === item.id ? "page" : "false") +
        '">' + icon(item.icon) + '<span>' + item.label + '</span></button>'
      ).join("") + '</nav>' +
      '<div class="sidebar-foot">Utah conservation, made clearer.<br><br>Ripples · 2026</div>' +
    '</aside><main class="content page-' + state.page + '">' +
      '<div class="topline"><span>RIPPLES · UTAH</span><span class="pill" id="storage-badge">' + esc(cloudUser ? cloudStatus : 'Local · saved in this browser') + '</span></div>' +
      (notice ? '<div class="notice" role="status">' + esc(notice) + '</div>' : "") +
      (hasFictionalSampleBills() ? '<div class="notice sample-data-notice" role="note"><strong>DEMO DATA</strong> · These bills are fictional. They are not actual household records.</div>' : '') +
      content +
      '<p class="footer">Student-built in Utah. Bills are saved in this browser. County figures are fictional demonstrations; calculators show estimates, not verified savings.</p>' +
    '</main></div>';
  if (focusKey) app.querySelector('[' + focusKey + '="' + CSS.escape(focusValue) + '"]')?.focus({ preventScroll: true });
  startWaterWaves();
}
function showValidationNotice(message) {
  // Keep the user's draft and focus intact when application validation fails.
  notice = message;
  let node = app.querySelector('.notice');
  if (!node) {
    node = document.createElement('div');
    node.className = 'notice';
    node.setAttribute('role', 'status');
    app.querySelector('.topline').after(node);
  }
  node.textContent = message;
}
function scrollBehavior() {
  return reducedMotion() ? 'auto' : 'smooth';
}
function reducedMotion() { return state.reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
function renderHome() {
  const water = latestAndPrevious('water');
  const electricity = latestAndPrevious('electricity');
  const waterChange = dailyChange(water.latest, water.previous);
  const electricChange = dailyChange(electricity.latest, electricity.previous);

  // Usage differences account for billing-period length. They do not prove
  // conservation savings; season, occupancy and weather may also change.
  const usageDifference = pair => pair.latest && pair.previous
    ? (daily(pair.previous) - daily(pair.latest)) * pair.latest.days
    : null;
  const waterDifference = usageDifference(water);
  const electricityDifference = usageDifference(electricity);
  // This tank is an actual data visualization, not decorative fill.
  // The same daily normalization used by the chart keeps bill lengths comparable.
  // A chosen monthly goal takes priority; otherwise compare with this household's
  // highest recorded daily water usage. Never infer storage or measured savings.
  const waterBills = resourceEntries('water');
  const waterGoal = Number(state.profile.waterGoal);
  const peakDailyWaterUse = waterBills.length
    ? Math.max(...waterBills.map(entry => daily(entry)))
    : 0;
  const tankRatio = !water.latest ? null
    : waterGoal > 0
      ? monthlyEquivalent(water.latest) / waterGoal
      : peakDailyWaterUse > 0
        ? daily(water.latest) / peakDailyWaterUse
        : 0;
  const tankLevel = tankRatio === null ? 0
    : Math.max(0, Math.min(100, tankRatio * 100));
  const tankPercentage = tankRatio === null ? null : Math.round(tankRatio * 100);
  const tankReference = waterGoal > 0 ? 'of monthly water goal' : 'of your highest recorded daily use';
  const tankMeterLabel = water.latest
    ? 'Water level: ' + number(tankPercentage) + '% ' + tankReference
    : 'No water bills added';

  const waterHeadline = waterDifference === null ? 'Your water, at a glance'
    : waterDifference > 0 ? number(waterDifference, 0) + ' gal less'
    : waterDifference < 0 ? number(Math.abs(waterDifference), 0) + ' gal more'
    : 'No change';
  const waterSubhead = waterChange === null
    ? 'Add two water bills to compare monthly usage.'
    : number(Math.abs(waterChange), 1) + '% ' +
      (waterChange < 0 ? 'lower' : waterChange > 0 ? 'higher' : 'unchanged') +
      ' daily usage than your previous bill';
  const goalText = !water.latest
    ? 'Enter your first water bill to fill the tank.'
    : waterGoal > 0
      ? number(monthlyEquivalent(water.latest), 0) + ' gal/month · ' +
        number(tankPercentage) + '% of your ' + number(waterGoal, 0) + ' gal goal'
      : number(daily(water.latest), 1) + ' gal/day · ' +
        number(tankPercentage) + '% of your highest recorded daily use';

  const electricSub = electricChange === null
    ? 'Add two bills to compare'
    : number(Math.abs(electricChange), 1) + '% ' +
      (electricChange < 0 ? 'lower' : electricChange > 0 ? 'higher' : 'unchanged') +
      ' daily use';

  return `
    <section class="card hero home-hero hero-flow-demo full-tank-hero">
      <div class="hero-tank-shell" aria-hidden="true">
        <div class="hero-tank" style="--tank-level:${tankLevel.toFixed(1)}%">
          <svg class="hero-tank-water" viewBox="0 0 600 420" preserveAspectRatio="none" role="presentation" aria-hidden="true">
            <defs>
              <clipPath id="tank-clip"><rect x="8" y="8" width="584" height="404" rx="24"/></clipPath>
              <linearGradient id="tank-water-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#82e5f0"/>
                <stop offset="35%" stop-color="#34b7cd"/>
                <stop offset="100%" stop-color="#09516d"/>
              </linearGradient>
              <linearGradient id="tank-glass-fill" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stop-color="#fff" stop-opacity=".17"/>
                <stop offset="12%" stop-color="#fff" stop-opacity=".01"/>
                <stop offset="88%" stop-color="#fff" stop-opacity=".01"/>
                <stop offset="100%" stop-color="#defaff" stop-opacity=".18"/>
              </linearGradient>
            </defs>
            <rect x="8" y="8" width="584" height="404" rx="24" fill="#afeff2" fill-opacity=".09"/>
            <g clip-path="url(#tank-clip)">
              <path class="tank-water-body" fill="url(#tank-water-fill)"></path>
              <path class="tank-wave-crest" fill="none" stroke="#ddffff" stroke-opacity=".83" stroke-width="2.6"></path>
              <path class="tank-underwater-glow" fill="none" stroke="#b7fcff" stroke-opacity=".15" stroke-width="14"></path>
            </g>
            <rect x="8" y="8" width="584" height="404" rx="24" fill="url(#tank-glass-fill)" stroke="#c9fdff" stroke-opacity=".34" stroke-width="2"/>
          </svg>
        </div>
      </div>
      <div class="tank-reading" role="status" aria-label="${esc(tankMeterLabel)}">
        <span class="tank-reading-title">WATER LEVEL</span>
        <strong class="tank-reading-percent">${tankPercentage === null ? '—' : number(tankPercentage) + '%'}</strong>
        <span class="tank-reading-caption">${esc(water.latest ? tankReference : 'Add a water bill')}</span>
      </div>
      <div class="hero-overlay-copy">
        <span class="home-kicker">RIPPLES · WATER & ELECTRICITY</span>
        <h1>${esc(waterHeadline)}</h1>
        <p class="hero-overlay-sub">${esc(waterSubhead)}</p>
        <p class="home-goal-line">${esc(goalText)}</p>
        <div class="button-row">
          <button type="button" class="button primary" data-nav="usage">Add a bill</button>
          <button type="button" class="button secondary" data-nav="map">Explore Utah</button>
        </div>
      </div>
    </section>
    <section class="home-stat-row" aria-label="Latest household usage">
      <article class="card home-stat"><div class="home-stat-icon" aria-hidden="true">💧</div>
        <div><span class="stat-label">Latest water bill</span>
          <div class="home-stat-number">${water.latest ? number(water.latest.amount, 0) + ' gal' : 'No data'}</div>
          <p class="stat-note">${esc(water.latest ? monthLabel(water.latest.month) : 'Add your first water bill')}</p>
        </div>
      </article>
      <article class="card home-stat"><div class="home-stat-icon" aria-hidden="true">⚡</div>
        <div><span class="stat-label">Latest electricity bill</span>
          <div class="home-stat-number">${electricity.latest ? number(electricity.latest.amount, 0) + ' kWh' : 'No data'}</div>
          <p class="stat-note">${esc(electricity.latest ? electricSub : 'Add your first electricity bill')}</p>
        </div>
      </article>
    </section>
    <p class="home-comparison-note">Bill comparisons use daily averages. Changes in weather and household size can affect the result.</p>
  `;
}

function statCard(label, value, note, tone = "") {
  return '<div class="card"><div class="stat-label">' + esc(label) + '</div><div class="stat-value ' + tone + '">' +
    esc(value) + '</div><p class="stat-note">' + esc(note) + '</p></div>';
}
function renderChart(entries, type, annual = false) {
  if (!entries.length) return '<div class="empty">No ' + (type === "water" ? "water" : "electricity") + ' bills yet. Add your first one to see a trend.</div>';
  let pointsData = entries.map(e => ({ label: monthLabel(e.month), value: daily(e) }));
  if (annual) {
    const groups = new Map();
    entries.forEach(e => {
      const year = e.month.slice(0, 4);
      const group = groups.get(year) || { label: year, total: 0, days: 0 };
      group.total += Number(e.amount);
      group.days += Number(e.days);
      groups.set(year, group);
    });
    pointsData = [...groups.values()].map(g => ({ label: g.label, value: g.total / g.days }));
  }
  const narrow = window.innerWidth <= 560;
  const w = narrow ? 320 : 620, h = 210, left = 42, right = 18, top = 16, bottom = 35;
  const max = Math.max(1, ...pointsData.map(p => p.value)) * 1.16;
  const x = i => left + (pointsData.length === 1 ? (w - left - right) / 2 : i * (w - left - right) / (pointsData.length - 1));
  const y = v => top + (1 - v / max) * (h - top - bottom);
  const pts = pointsData.map((p, i) => x(i) + "," + y(p.value)).join(" ");
  // Keep long histories readable on a phone; every value remains available below.
  const tickCount = Math.min(pointsData.length, narrow ? 4 : 6);
  const ticks = new Set(Array.from({ length: tickCount }, (_, i) => Math.round(i * (pointsData.length - 1) / Math.max(1, tickCount - 1))));
  const labels = pointsData.map((p, i) => ticks.has(i) ?
    '<text x="' + x(i) + '" y="' + (h - 8) + '" text-anchor="' + (i === pointsData.length - 1 && pointsData.length > 1 ? 'end' : 'middle') + '">' + esc(p.label) + '</text>' : '').join("");
  const dots = pointsData.map((p, i) => {
    const label=esc(p.label + ': ' + number(p.value,1) + ' ' + unit(type) + '/day');
    const attrs=' tabindex="0" role="button" aria-label="'+label+'" data-chart-tip="'+label+'"';
    return state.chartStyle==='bar' ? '<rect x="'+(x(i)-Math.min(12,(w-left-right)/pointsData.length/3))+'" y="'+y(p.value)+'" width="'+Math.min(24,(w-left-right)/pointsData.length*2/3)+'" height="'+Math.max(1,h-bottom-y(p.value))+'"'+attrs+'><title>'+label+'</title></rect>' :
      '<circle cx="' + x(i) + '" cy="' + y(p.value) + '" r="5"'+attrs+'><title>' + label + '</title></circle>';
  }).join('');
  return '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" role="group" aria-label="' + esc(type) + ' daily use trend">' +
    [0, .5, 1].map(f => '<line x1="' + left + '" y1="' + y(max * f) + '" x2="' + (w - right) + '" y2="' + y(max * f) + '"/>').join("") +
    '<text x="0" y="' + (top + 4) + '">' + number(max, 0) + '</text><text x="0" y="' + (h - bottom + 4) + '">0</text>' +
    (state.chartStyle==='bar'?'':'<polyline points="' + pts + '"/>') + dots + labels + '</svg><p class="chart-tooltip fineprint" aria-live="polite">Select a point to inspect its value.</p>' +
    '<p class="fineprint">Daily averages adjust for different billing periods. ' + unit(type) + ' to account for different billing period lengths.' +
    (annual ? " Annual groups include recorded bills only; missing months are not estimated." : "") +
    (pointsData.length === 1 ? " Add another bill to see a trend." : "") + '</p>' +
    '<details class="chart-values"><summary>View chart values</summary><table><caption>Recorded daily averages</caption><thead><tr><th scope="col">Period</th><th scope="col">' + unit(type) + '/day</th></tr></thead><tbody>' +
    pointsData.map(p => '<tr><th scope="row">' + esc(p.label) + '</th><td>' + number(p.value, 1) + '</td></tr>').join('') + '</tbody></table></details>';
}
function renderComparison() {
  const { latest } = latestAndPrevious();
  if (state.resource === "water") {
    if (!latest) return '<div class="empty">Enter one water bill to compare with a sourced Utah residential reference.</div>';
    const perPerson = daily(latest) / state.profile.residents;
    const delta = (perPerson / USGS_UTAH_DOMESTIC_GPCD_2015 - 1) * 100;
    const max = Math.max(perPerson, USGS_UTAH_DOMESTIC_GPCD_2015, 1);
    return '<div class="stat-value ' + (delta <= 0 ? "good" : "warm") + '">' + (delta > 0 ? "+" : "") + number(delta, 1) + '%</div>' +
      '<p class="muted">Your household’s billed gallons per person per day versus an older Utah residential reference.</p>' +
      '<div class="compare-bars">' + bar("Your bill", perPerson, max, false, "gal/person/day") + bar("Utah 2015", USGS_UTAH_DOMESTIC_GPCD_2015, max, true, "gal/person/day") + '</div>' +
      '<p class="source">Your ' + latest.days + '-day bill is divided by ' + state.profile.residents + ' household ' + (state.profile.residents === 1 ? 'resident' : 'residents') + '. <a href="' + USGS_DOMESTIC_SOURCE + '" target="_blank" rel="noopener noreferrer">USGS Circular 1441, Table 6 ↗</a> estimates <strong>169 gal/person/day for Utah in 2015</strong> from public-supply deliveries to domestic users, including indoor and outdoor use. It is not a current monthly, city, housing-type, lawn, or season-matched average. Separate irrigation meters, self-supplied water, and the age of the reference limit comparison.</p>';
  }
  if (!latest) return '<div class="empty">Enter one electricity bill to compare with a sourced Utah reference.</div>';
  const normalized = monthlyEquivalent(latest);
  const delta = ((normalized - EIA_UTAH_KWH_2024) / EIA_UTAH_KWH_2024) * 100;
  const max = Math.max(normalized, EIA_UTAH_KWH_2024, 1);
  return '<div class="stat-value ' + (delta <= 0 ? "good" : "warm") + '">' + (delta > 0 ? "+" : "") + number(delta, 1) + '%</div>' +
    '<p class="muted">Your bill versus the 2024 Utah residential-account monthly average.</p>' +
    '<div class="compare-bars">' +
      bar("Your bill", normalized, max, false) + bar("Utah 2024", EIA_UTAH_KWH_2024, max, true) +
    '</div><p class="source">Your ' + latest.days + '-day bill is scaled to an average month (30.44 days). The statewide figure is <strong>774 kWh per residential account per month</strong>; it is not matched by household size, home type, or season. <a href="' + EIA_SOURCE + '" target="_blank" rel="noopener noreferrer">Source: U.S. EIA, Table 5A ↗</a></p>';
}
function bar(label, value, max, reference, valueUnit = "kWh") {
  return '<div class="bar-row"><span>' + label + '</span><div class="bar-track"><div class="bar-fill ' +
    (reference ? "reference" : "") + '" style="width:' + Math.max(2, value / max * 100) + '%"></div></div><strong>' +
    number(value, 1) + ' ' + valueUnit + '</strong></div>';
}
function hasFictionalSampleBills() { return state.entries.some(entry => entry.id.startsWith("sample-")); }
function makeFictionalSampleBills() {
  const water = [5200, 4700, 4900, 5600, 6800, 8200, 9100, 8800, 7600, 6500, 5700, 5300];
  const electricity = [780, 720, 690, 650, 700, 820, 940, 910, 790, 720, 810, 900];
  const entries = [];
  for (let month = 1; month <= 12; month++) {
    const ym = `2025-${String(month).padStart(2, "0")}`;
    const days = new Date(2025, month, 0).getDate();
    entries.push({ id: `sample-water-${ym}`, type: "water", month: ym, days, quantity: water[month - 1], unit: "gal", amount: water[month - 1], cost: null });
    entries.push({ id: `sample-electricity-${ym}`, type: "electricity", month: ym, days, quantity: electricity[month - 1], unit: "kWh", amount: electricity[month - 1], cost: null });
  }
  return entries;
}
function renderUsage() {
  const type = state.resource;
  state.chartSpan = 'monthly';
  state.chartStyle = 'line';
  const entry = state.entries.find(e => e.id === editingId);
  const entries = resourceEntries().slice().reverse();
  const introIcon = type === 'water' ? '💧' : '⚡';
  return pageIntro('', 'My Usage', 'Add bills, then see how your usage changes.') +
    '<div class="section-spotlight usage-spotlight"><span class="spotlight-icon">' + introIcon + '</span><div><strong>' + (type === 'water' ? 'Water tracking' : 'Electricity tracking') + '</strong><small>Your numbers. Your trends.</small></div>' + resourceSwitch() + '</div>' +
    (state.entries.length === 0 ? '<section class="card sample-data-card"><h3>Try it with sample bills</h3><p>Load fictional 2025 bills to preview trends. You can delete them later.</p><button class="button secondary" type="button" data-load-sample>Load sample bills</button></section>' : '') +
    '<div class="usage-layout"><section class="card usage-entry-card"><h2>' + (entry ? 'Edit bill' : 'Add a bill') + '</h2>' +
      '<form id="entry-form"><div class="form-grid">' +
        field('Billing month', '<input name="month" type="month" required value="' + esc(entry?.month || new Date().toISOString().slice(0, 7)) + '">') +
        field('Billing days', '<input name="days" type="number" min="1" max="366" step="1" required value="' + esc(entry?.days || 30) + '">') +
        field('Usage amount', '<input name="quantity" type="number" min="0" max="100000000" step="any" required value="' + esc(entry?.quantity ?? '') + '" placeholder="' + (type === 'water' ? 'e.g. 4500' : 'e.g. 750') + '">') +
        field('Unit', type === 'water' ?
          '<select name="unit"><option value="gal" ' + selected(entry?.unit || 'gal', 'gal') + '>Gallons</option><option value="kgal" ' + selected(entry?.unit, 'kgal') + '>Thousand gallons</option><option value="ccf" ' + selected(entry?.unit, 'ccf') + '>CCF</option></select>' :
          '<input name="unit" value="kWh" readonly aria-label="Kilowatt-hours">') +
        field('Bill cost (optional)', '<input name="cost" type="number" min="0" max="1000000" step="0.01" value="' + esc(entry?.cost ?? '') + '" placeholder="$">') +
      '</div><div class="form-actions"><button class="button primary" type="submit">' + (entry ? 'Save changes' : 'Save bill') + '</button>' +
      (entry ? '<button class="button secondary" type="button" data-cancel-edit>Cancel</button>' : '') +
      '</div></form></section>' +
    '<section class="card usage-chart"><h2>Your trend</h2>' + renderChart(resourceEntries(), type) + '</section></div>' +
    '<div class="utility-details-row"><details class="card usage-history"' + (usageHistoryOpen ? ' open' : '') + '><summary>Bill history (' + entries.length + ')</summary>' +
      (entries.length ? entries.map(e => '<div class="record"><div><strong>' + esc(monthLabel(e.month)) + ' · ' + number(e.quantity, 2) + ' ' + esc(e.unit) +
        '</strong><span>' + e.days + ' billing days</span></div><div class="record-actions"><button class="button small secondary" data-edit="' + esc(e.id) + '">Edit</button>' +
        '<button class="button small danger" data-delete="' + esc(e.id) + '">Delete</button></div></div>').join('') : '<div class="empty">No bills yet.</div>') +
      '</details>' +
    '<details class="card usage-import"' + (importDraft ? ' open' : '') + '><summary>Import / export</summary>' +
      renderImport().replace(/^<section class="card feature-section">|<\/section>$/g, '') + '</details>' +
    '<details class="card usage-reference"><summary>Compare with Utah</summary><div class="usage-reference-body">' + renderComparison() + '</div></details></div>';
}

function selected(value, expected) { return value === expected ? "selected" : ""; }
function field(label, control, hint = "") {
  return '<label class="field"><span>' + label + '</span>' + control + (hint ? '<small>' + hint + '</small>' : "") + '</label>';
}
function renderProfile() {
  const p = state.profile;
  const houses = [
    { value: 'apartment', icon: '🏢', label: 'Apartment' },
    { value: 'townhome', icon: '🏘️', label: 'Townhome' },
    { value: 'house', icon: '🏡', label: 'House' }
  ];
  const priorities = [
    { value: 'water', icon: '💧', label: 'Water' },
    { value: 'electricity', icon: '⚡', label: 'Electricity' },
    { value: 'both', icon: '🌎', label: 'Both' }
  ];
  return pageIntro('', 'Profile', 'Set up your household.') + `
    <section class="card profile-visual-card">
      <form id="profile-form">
        <h2>Household size</h2>
        <div class="residents-picker">
          <span class="residents-graphic" aria-hidden="true">👥</span>
          <button type="button" class="residents-step" data-residents-step="-1" aria-label="Remove one person">−</button>
          <input name="residents" aria-label="People in household" type="number" min="1" max="30" step="1" required value="${esc(p.residents)}">
          <button type="button" class="residents-step" data-residents-step="1" aria-label="Add one person">+</button>
        </div>
        <h2 class="profile-question">Home type</h2>
        <input type="hidden" name="home" value="${esc(p.home)}">
        <div class="home-choice-grid" role="group" aria-label="Home type">
          ${houses.map(item => `<button type="button" class="home-choice ${p.home === item.value ? 'selected' : ''}"
            data-home-choice="${item.value}" aria-pressed="${p.home === item.value}">
            <span class="home-choice-icon" aria-hidden="true">${item.icon}</span><span>${item.label}</span></button>`).join('')}
        </div>
        <h2 class="profile-question">Main priority</h2>
        <input type="hidden" name="priority" value="${esc(p.priority || 'both')}">
        <div class="home-choice-grid" role="group" aria-label="Main priority">
          ${priorities.map(item => `<button type="button" class="home-choice ${(p.priority || 'both') === item.value ? 'selected' : ''}"
            data-priority-choice="${item.value}" aria-pressed="${(p.priority || 'both') === item.value}">
            <span class="home-choice-icon" aria-hidden="true">${item.icon}</span><span>${item.label}</span></button>`).join('')}
        </div>
        <div class="profile-extra-fields">
          ${field('City or ZIP (optional)', '<input name="city" maxlength="80" value="' + esc(p.city) + '" placeholder="e.g. Provo">')}
          ${field('Monthly water goal (gal)', '<input name="waterGoal" type="number" min="0.01" max="100000000000" step="any" value="' + esc(p.waterGoal) + '" placeholder="Optional">')}
          ${field('Monthly electricity goal (kWh)', '<input name="electricGoal" type="number" min="0.01" max="100000000000" step="any" value="' + esc(p.electricGoal) + '" placeholder="Optional">')}
        </div>
        <div class="profile-options">
          <label class="check"><input name="lawn" type="checkbox" ${p.lawn ? 'checked' : ''}> Lawn or garden</label>
          <label class="check"><input name="irrigation" type="checkbox" ${p.irrigation ? 'checked' : ''}> Irrigation is included in my water bill</label>
        </div>
        <button class="button primary profile-save" type="submit">Save household</button>
      </form>
    </section>
    <details class="card profile-data">
      <summary>Backup & preferences</summary>
      <div class="profile-data-actions">
        <button class="button secondary" type="button" data-extra="backup">Download backup</button>
        <button class="button danger" type="button" data-extra="clear-local">Clear this workspace</button>
      </div>
      <label class="field file-field"><span>Restore a Ripples backup</span>
        <input type="file" accept="application/json,.json" data-import-backup></label>
      <label class="check"><input type="checkbox" data-reduce-motion ${state.reduceMotion ? 'checked' : ''}> Reduce animations</label>
      <p class="fineprint">Backups contain your household information. Keep them private.</p>
    </details>
  `;
}

function demoCountyUsage(county, type = state.resource) {
  // Deliberately invented figures to demonstrate a choropleth. Never actual county consumption.
  const n = Number(county.fips);
  const seed = ((n * 31 + 17) % 97 + (n * 13 + 7) % 29) / 126;
  return type === 'water' ? Math.round(70 + seed * 160) : Number((13 + seed * 38).toFixed(1));
}
function usageDemoColor(value, type) {
  const min = type === 'water' ? 70 : 13;
  const max = type === 'water' ? 230 : 51;
  const fraction = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const light = Math.round(86 - fraction * 55);
  return 'hsl(' + (type === 'water' ? 192 : 31) + ' 76% ' + light + '%)';
}
function renderMap() {
  const counties = countyMap?.counties || [];
  const selectedCounty = counties.find(c => c.name === state.region) ||
    counties.find(c => c.name === 'Salt Lake') || counties[0];
  const selectedName = selectedCounty?.name || 'Salt Lake';
  const resource = state.resource;
  const isWater = resource === 'water';
  const unitLabel = isWater ? 'gal / person / day' : 'kWh / account / day';
  const selectedValue = selectedCounty ? demoCountyUsage(selectedCounty, resource) : null;
  const ranked = counties.map(county => ({name: county.name, value: demoCountyUsage(county, resource)}))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));

  const mapSvg = counties.length ? `
    <svg class="utah-map" viewBox="0 0 380 510" role="group" aria-label="Select a Utah county on the fictional sample ${resource} map">
      ${counties.map(county => {
        const value = demoCountyUsage(county, resource);
        return `<path class="county ${county.name === selectedName ? 'active' : ''}"
          d="${county.path}" style="--county-fill:${usageDemoColor(value, resource)}"
          data-region="${esc(county.name)}" role="button" tabindex="0"
          aria-label="${esc(county.name)} County, fictional usage ${number(value, 1)} ${unitLabel}"
          aria-pressed="${county.name === selectedName}">
          <title>${esc(county.name)} County</title>
        </path>`;
      }).join('')}
    </svg>` : `<div class="empty">${esc(countyLoadError || 'Loading Utah counties…')}</div>`;

  return pageIntro('', 'Explore Utah', 'Select a county on the map or ranking.') + `
    <div class="map-main-head">
      <span class="map-hero-title">Utah's 29 counties</span>
      ${resourceSwitch()}
    </div>
    <p class="map-demo-label"><strong>Fictional sample data.</strong> Colors and rankings demonstrate a comparison, not measured Utah county consumption.</p>
    <section class="map-layout">
      <div class="map-main-card">
        <div class="map-canvas">${mapSvg}</div>
        <div class="map-legend" aria-label="Fictional usage color scale">
          <div class="legend-bar ${isWater ? 'water' : 'electricity'}"></div>
          <div class="legend-labels"><span>Lighter · lower use</span><span>Darker · higher use</span></div>
        </div>
      </div>
      <aside class="card map-side-panel">
        <section class="map-selected-block" aria-live="polite">
          <span class="map-side-label">SELECTED COUNTY</span>
          <h2 data-selected-county>${esc(selectedName)} County</h2>
          <div class="map-selected-stat" data-selected-value>${selectedValue === null ? '—' : number(selectedValue, 1)}</div>
          <p class="map-selected-unit">${unitLabel} · fictional example</p>
          <label class="field map-select-label"><span>Choose a county</span>
            <select data-county-select ${!counties.length ? 'disabled' : ''}>
              ${counties.map(c => `<option value="${esc(c.name)}" ${selectedOption(c.name, selectedName)}>${esc(c.name)} County</option>`).join('')}
            </select>
          </label>
        </section>
        <section class="map-ranking-block" aria-label="All county rankings, fictional data">
          <div class="map-ranking-head"><h3>County ranking</h3><span>${unitLabel}</span></div>
          <ol class="county-ranking-list">
            ${ranked.map((county, index) => `<li>
              <button type="button" class="county-ranking-item ${county.name === selectedName ? 'selected' : ''}"
                data-leaderboard-region="${esc(county.name)}"
                ${county.name === selectedName ? 'aria-current="true"' : ''}>
                <span class="county-ranking-rank">${index + 1}</span>
                <span class="county-ranking-name">${esc(county.name)}</span>
                <strong class="county-ranking-value">${number(county.value, 1)}</strong>
              </button>
            </li>`).join('')}
          </ol>
        </section>
      </aside>
    </section>
    <details class="card map-sources"><summary>Map data & methodology</summary>
      <p class="fineprint">County boundaries: <a href="https://gis.utah.gov/products/sgid/boundaries/county/" target="_blank" rel="noopener noreferrer">State of Utah SGID</a>. All county values are fictional, are unrelated to actual utility bills, and are not a survey of Utah residents.</p>
    </details>
  `;
}

// Update selection in place. Rebuilding the whole page on every map click
// caused the flashing/refreshing effect and interrupted keyboard focus.
function selectMapCounty(name) {
  const chosen = countyMap?.counties.find(county => county.name === name);
  if (!chosen) return;
  state.region = chosen.name;
  saveState(false);
  if (state.page !== 'map') return;

  const title = app.querySelector('[data-selected-county]');
  const value = app.querySelector('[data-selected-value]');
  const dropdown = app.querySelector('[data-county-select]');
  if (title) title.textContent = chosen.name + ' County';
  if (value) value.textContent = number(demoCountyUsage(chosen, state.resource), 1);
  if (dropdown) dropdown.value = chosen.name;

  app.querySelectorAll('svg.utah-map [data-region]').forEach(path => {
    const active = path.dataset.region === name;
    path.classList.toggle('active', active);
    path.setAttribute('aria-pressed', String(active));
  });
  app.querySelectorAll('[data-leaderboard-region]').forEach(button => {
    const active = button.dataset.leaderboardRegion === name;
    button.classList.toggle('selected', active);
    if (active) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  });
}

function renderRegionalLeaderboard(counties, selectedName) {
  if (!counties.length) return '';
  const label = state.resource === 'water' ? 'gal/person/day' : 'kWh/account/day';
  const sorted = counties.map(c => ({ name: c.name, value: demoCountyUsage(c) }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  const items = (list, offset = 0) => list.map((c, index) =>
    '<li><button type="button" data-leaderboard-region="' + esc(c.name) + '" ' +
    (c.name === selectedName ? 'aria-current="true"' : '') + '>' +
    '<span class="leaderboard-rank">' + (index + 1 + offset) + '</span>' +
    '<span class="leaderboard-name"><strong>' + esc(c.name) + '</strong><small>Fictional usage</small></span>' +
    '<span class="leaderboard-percent">' + number(c.value, 1) + '</span></button></li>').join('');
  return '<details class="card leaderboard-section"><summary>Sample county ranking (' + label + ')</summary>' +
    '<p class="fineprint">Illustrative ranking based on fictional county usage. Not actual Utah data.</p>' +
    '<ol class="leaderboard-list">' + items(sorted.slice(0, 5)) + '</ol>' +
    '<details class="full-leaderboard"><summary>View all 29 counties</summary><ol class="leaderboard-list">' + items(sorted.slice(5), 5) + '</ol></details></details>';
}

function demoCountyStats(county, resource) {
  const saved = showcaseCountyStats.find(row => row.county === county.name && row.resource === resource);
  if (saved) {
    const participants = Number(saved.participants);
    const started = Number(saved.started);
    const completed = Number(saved.completed);
    return { participants, started, completed, percent: started ? Math.round(completed / started * 100) : 0 };
  }
  const seed = Number(county.fips);
  const offset = resource === "water" ? 0 : 37;
  const participants = 18 + ((seed * 7 + offset) % 74);
  const started = participants + 6 + ((seed * 5 + offset) % 27);
  const completed = Math.round(started * (0.28 + ((seed * 3 + offset) % 47) / 100));
  return { participants, started, completed, percent: Math.round(completed / started * 100) };
}
async function loadShowcaseCountyStats() {
  try {
    const local = await fetch('./showcase-county-stats.json');
    if (local.ok) showcaseCountyStats = await local.json();
  } catch {}
  const config = window.RIPPLES_CONFIG || {};
  if (config.supabaseUrl && config.supabaseKey) {
    try {
      const response = await fetch(config.supabaseUrl + '/rest/v1/rpc/showcase_county_report', {
        method: 'POST',
        headers: { apikey: config.supabaseKey, 'Content-Type': 'application/json' },
        body: '{}'
      });
      if (response.ok) {
        const rows = await response.json();
        if (Array.isArray(rows) && rows.length) showcaseCountyStats = rows;
      }
    } catch {}
  }
  if (state.page === 'map') renderShell();
}
function demoCountyColor(percent, isWater) {
  const lightness = Math.round(84 - (percent - 25) * 0.65);
  return 'hsl(' + (isWater ? 187 : 31) + ' 64% ' + lightness + '%)';
}
function selectedOption(value, expected) { return value === expected ? 'selected' : ''; }
async function loadCountyMap() {
  try {
    const response = await fetch('./county-map.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Map file unavailable');
    const data = await response.json();
    if (!Array.isArray(data.counties) || data.counties.length !== 29 ||
        !data.counties.every(county => typeof county.name === 'string' && /^[A-Za-z ]+$/.test(county.name) &&
          typeof county.fips === 'string' && /^[0-9]{3}$/.test(county.fips) &&
          typeof county.path === 'string' && /^M[MLZ0-9.,-]+$/.test(county.path))) {
      throw new Error('Invalid county map file');
    }
    countyMap = data;
    if (state.page === 'map') renderShell();
  } catch {
    countyLoadError = 'The county map could not be loaded. Try refreshing this page.';
    if (state.page === 'map') renderShell();
  }
}
function renderRipple() {
  const isWater = state.resource === 'water';
  const destinations = isWater ? [
    {title:'Great Salt Lake', text:'Water conservation matters to Utah, but household reductions do not automatically flow to the lake.'},
    {title:'Rivers & reservoirs', text:'Lower demand can help communities manage limited water supplies.'},
    {title:'Your household', text:'Using less water may lower your bill and build lasting habits.'}
  ] : [
    {title:'Utah’s power grid', text:'Reducing unnecessary usage can lower household demand.'},
    {title:'Your home', text:'Turning off unused devices can make bills easier to manage.'},
    {title:'Everyday habits', text:'Tracking your changes helps you identify what works.'}
  ];
  const tipIds = isWater ? ['shorter-showers', 'hidden-leaks', 'outdoor-watering']
    : ['idle-power', 'full-laundry'];
  const tips = tipIds.map(id => ACTION_CATALOG.find(action => action.id === id)).filter(Boolean);

  return pageIntro('', 'Your Impact', 'Where using less can make a difference.') + `
    <div class="save-page-header">${resourceSwitch()}</div>
    <section class="impact-top-grid">
      ${destinations.map(item => `<article class="card impact-card">
        <h2>${esc(item.title)}</h2><p>${esc(item.text)}</p>
      </article>`).join('')}
    </section>
    <section class="card ripple-simulator impact-panel">
      <h2>${isWater ? 'Water savings calculator' : 'Electricity savings calculator'}</h2>
      <p class="muted">${isWater ? 'See how a shorter shower could change water usage.' : 'Estimate the electricity saved by unplugging standby devices.'}</p>
      ${isWater ? `
        ${slider('Current shower length', 'current', 1, 30, simulation.current, 'min')}
        ${slider('New shower length', 'target', 1, 30, simulation.target, 'min')}
        ${slider('People showering daily', 'household', 1, 30, simulation.household ?? state.profile.residents, 'people')}
        ${slider('Showerhead flow', 'flow', .5, 5, simulation.flow, 'gal/min', .1)}
        <div class="grid two impact-results">
          <div><span class="stat-label">Estimated 30-day change</span><div class="stat-value" id="sim-monthly">—</div><small>gallons</small></div>
          <div><span class="stat-label">Estimated annual change</span><div class="stat-value" id="sim-yearly">—</div><small>gallons</small></div>
        </div>
        <p class="fineprint" id="sim-explanation"></p>
      ` : renderActionEstimate('idle-power')}
    </section>
    <div class="impact-bottom-grid">
      <section class="card impact-panel">
        <h2>Ways to save</h2>
        <div class="impact-tip-grid">
          ${tips.map(item => `<article class="tip ripple-tip"><h3>${esc(item.title)}</h3><p>${esc(item.action)}</p></article>`).join('')}
        </div>
      </section>
      <section class="card impact-panel">
        <h2>Set a monthly goal</h2>
        ${renderMeasuredGoals().replace(/^<section class="card feature-section">|<\/section>$/g, '')}
      </section>
    </div>
  `;
}

function renderRippleTip(action) {
  const goal = state.actionGoals.find(item => item.id === action.id);
  return '<article class="tip ripple-tip"><h3>' + esc(action.title) + '</h3><p>' + esc(action.action) + '</p><p class="tip-context"><strong>For your household:</strong> ' + esc(actionContext(action.id)) + '</p>' +
    (ESTIMATE_SCENARIOS[action.id] ? renderActionEstimate(action.id) : '') +
    (goal ? '<span class="tip-saved">' + (goal.done ? 'Done ✓' : 'Saved as a goal ✓') + '</span>' : '<button class="button small secondary" data-action-add="' + action.id + '">Add to my goals</button>') + '</article>';
}
function latestChallengeRun(id) {
  return state.challengeRuns.filter(run => run.id === id).at(-1) || null;
}
function renderChallenges() {
  const today = todayLocal();
  return '<section class="card challenge-section" id="challenges"><div class="eyebrow">P2 · COMMUNITY CHALLENGE PREVIEW</div><h2>Try a 7-day challenge.</h2>' +
    '<p class="muted">Join on this device and record one check-in per day. This preview has no live community members or leaderboard; your entries stay in this browser.</p>' +
    '<div class="grid two challenge-grid">' + CHALLENGES.map(challenge => renderChallengeCard(challenge, today)).join('') + '</div>' +
    '<p class="fineprint">Check-ins are self-reported actions, not measured water or electricity savings. Community totals will require opt-in accounts and privacy-safe aggregation.</p></section>';
}
function renderChallengeCard(challenge, today) {
  const run = latestChallengeRun(challenge.id);
  const day = run ? dayOffset(run.startedOn, today) : -1;
  const active = run && day >= 0 && day < 7;
  const doneToday = active && run.checkins.includes(today);
  const previousRuns = state.challengeRuns.filter(item => item.id === challenge.id).length - (run ? 1 : 0);
  const dayCells = run ? '<ol class="challenge-days" aria-label="Seven challenge days">' + Array.from({ length: 7 }, (_, index) => {
    const stamp = dayAt(run.startedOn, index);
    const checked = run.checkins.includes(stamp);
    return '<li class="' + (checked ? 'checked' : index === day ? 'current' : '') + '" aria-label="Day ' + (index + 1) + ', ' + (checked ? 'checked in' : 'not checked in') + '">' +
      '<span>Day ' + (index + 1) + '</span><strong>' + (checked ? '✓' : '·') + '</strong></li>';
  }).join('') + '</ol>' : '';
  return '<article class="challenge-card"><div class="eyebrow">' + (challenge.resource === 'water' ? 'WATER' : 'ELECTRICITY') + ' · LOCAL PREVIEW</div><h3>' + esc(challenge.title) + '</h3>' +
    '<p>' + esc(challenge.action) + '</p>' +
    (run ? '<p class="challenge-count"><strong>' + run.checkins.length + '/7</strong> daily check-ins · ' +
      (active ? 'Day ' + (day + 1) + ' of 7' : run.checkins.length === 7 ? 'Completed attempt' : '7-day window ended') + '</p>' +
      '<progress value="' + run.checkins.length + '" max="7">' + run.checkins.length + ' of 7</progress>' + dayCells :
      '<p class="fineprint">Start whenever you are ready. One check-in is available each calendar day for seven days.</p>') +
    (active ? '<div class="challenge-actions"><button type="button" class="button primary small" data-challenge-checkin="' + challenge.id + '" ' + (doneToday ? 'disabled' : '') + '>' + (doneToday ? 'Checked in today ✓' : 'Check in for today') + '</button>' +
      (doneToday ? '<button type="button" class="button ghost small" data-challenge-undo="' + challenge.id + '">Undo today</button>' : '') + '</div>' :
      '<button type="button" class="button secondary small" data-challenge-join="' + challenge.id + '">' + (run ? 'Start another attempt' : 'Join challenge') + '</button>') +
    (previousRuns > 0 ? '<p class="fineprint">Earlier attempts saved on this device: ' + previousRuns + '.</p>' : '') + '</article>';
}
function renderAction(action) {
  const goal = state.actionGoals.find(item => item.id === action.id);
  return '<div class="tip"><h3>' + esc(action.title) + '</h3>' +
    '<p><strong>Why look:</strong> ' + esc(action.problem) + '</p>' +
    '<p><strong>Try this:</strong> ' + esc(action.action) + '</p>' +
    '<p class="muted"><strong>Why it works:</strong> ' + esc(action.why) + '</p>' +
    '<p class="tip-context"><strong>For your household:</strong> ' + esc(actionContext(action.id)) + '</p>' +
    (ESTIMATE_SCENARIOS[action.id] ? renderActionEstimate(action.id) : '') +
    (goal ? '<span class="tip-saved">' + (goal.done ? 'Done ✓' : 'Saved as a goal ✓') + '</span>' :
      '<button class="button small secondary" data-action-add="' + action.id + '">Save as a goal</button>') + '</div>';
}
function actionContext(id) {
  const { latest: waterLatest, previous: waterPrevious } = latestAndPrevious("water");
  const { latest: electricLatest, previous: electricPrevious } = latestAndPrevious("electricity");
  if (id === "shorter-showers") return "Your profile has " + state.profile.residents + " household " + (state.profile.residents === 1 ? "member" : "members") + ". Set the number who actually shower daily in the simulator.";
  if (id === "hidden-leaks") {
    const change = dailyChange(waterLatest, waterPrevious);
    return change !== null && change > 5 ? "Your latest water bill's daily use is " + number(change, 1) + "% above the previous bill. A leak check may help; season and irrigation can also explain the change." :
      waterLatest ? "Your latest water bill averages " + number(daily(waterLatest), 1) + " gal/day. Check your meter during a period with no intentional water use." :
        "Add a water bill to see your own trend; check the meter during a period with no intentional water use.";
  }
  if (id === "full-laundry") return "Your profile lists " + state.profile.residents + " household " + (state.profile.residents === 1 ? "member" : "members") + ". Only count cycles you can actually avoid by combining small loads.";
  if (id === "outdoor-watering") return !state.profile.irrigation ?
    "Your profile says irrigation uses a separate meter, so this change might not appear on your household water bill." :
    "Your profile includes a lawn. Check sprinkler coverage before reducing minutes, and keep enough water for the landscape.";
  if (id === "idle-power") {
    const change = dailyChange(electricLatest, electricPrevious);
    return change !== null && change > 5 ? "Your latest electricity bill's daily use is " + number(change, 1) + "% above the previous bill. Measuring idle devices is one check; seasonal heating or cooling may matter more." :
      electricLatest ? "Your latest electricity bill averages " + number(daily(electricLatest), 1) + " kWh/day. A plug-in meter can show which idle devices use power." :
        "Add an electricity bill to see your trend; a plug-in meter can identify standby power.";
  }
  return "Choose a step that fits your household.";
}
function actionEstimateValue(id) {
  const fields = ESTIMATE_SCENARIOS[id]?.fields;
  if (!fields) return null;
  const values = fields.map(field => Number(estimateInputs[id][field.key]));
  if (fields.some((field, index) => estimateInputs[id][field.key] === "" || !Number.isFinite(values[index]) || values[index] <= 0 || values[index] > field.max)) return null;
  if (id === "hidden-leaks") return values[0] * values[1] * 30;
  if (id === "full-laundry" || id === "outdoor-watering") return values[0] * values[1] * 30 / 7;
  if (id === "efficient-fixtures") return Math.max(0, values[0] - values[1]) * values[2] * 30;
  return values[0] * values[1] * 30 / 1000;
}
function actionEstimateText(id) {
  const value = actionEstimateValue(id);
  return value === null ? "Enter all measured values to see a 30-day estimate." :
    "If the change happens: about " + number(value, value < 1 ? 4 : 1) + " " + ESTIMATE_SCENARIOS[id].unit + " avoided (estimate).";
}
function renderActionEstimate(id) {
  const scenario = ESTIMATE_SCENARIOS[id];
  return '<details class="estimate-panel" data-estimate-panel="' + id + '" ' + (estimateOpen.has(id) ? 'open' : '') + '><summary>Estimate with your own numbers</summary>' +
    '<div class="estimate-fields">' + scenario.fields.map(field =>
      '<label class="field"><span>' + esc(field.label) + '</span><input type="number" inputmode="decimal" min="0.01" max="' + field.max + '" step="any" value="' + esc(estimateInputs[id][field.key]) + '" data-estimate-action="' + id + '" data-estimate-field="' + field.key + '"><small>' + esc(field.unit) + '</small></label>').join('') + '</div>' +
    '<p class="estimate-result" data-estimate-output="' + id + '" role="status">' + esc(actionEstimateText(id)) + '</p>' +
    '<p class="fineprint">Formula: ' + esc(scenario.formula) + '. ' + esc(scenario.caution) + '</p>' +
    '<p class="source">Guidance: <a href="' + scenario.url + '" target="_blank" rel="noopener noreferrer">' + esc(scenario.source) + ' ↗</a>. The estimate uses only your inputs, not an EPA or DOE savings average.</p></details>';
}
function slider(label, name, min, max, value, suffix, step = 1) {
  return '<label class="field" style="margin-top:17px"><span>' + label + '</span><span class="range-row">' +
    '<input type="range" data-sim="' + name + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '">' +
    '<output id="sim-' + name + '">' + value + '</output></span><small>' + suffix + '</small></label>';
}
function updateSimulation() {
  const people = Math.max(1, Number(simulation.household ?? state.profile.residents) || 1);
  const minutes = Math.max(0, simulation.current - simulation.target);
  const dailySaved = minutes * simulation.flow * people;
  const targets = {
    "sim-current": number(simulation.current, 1),
    "sim-target": number(simulation.target, 1),
    "sim-flow": number(simulation.flow, 1),
    "sim-household": number(people),
    "sim-daily": number(dailySaved, 1),
    "sim-monthly": number(dailySaved * 30, 0),
    "sim-yearly": number(dailySaved * 365, 0),
    "sim-explanation": minutes === 0 ? "A shorter target duration is needed to project savings." :
      number(minutes, 1) + " fewer minutes × " + number(simulation.flow, 1) + " gal/min × " + people +
      " household " + (people === 1 ? "member" : "members") + " × one shower per day. Actual use may differ."
  };
  for (const [id, text] of Object.entries(targets)) {
    const node = document.getElementById(id);
    if (node) node.textContent = text;
  }
}
// Water: a 1D shallow-surface spring approximation, rendered into ONE clipped
// liquid body. Adjacent columns transfer momentum to give a damped slosh.
const TANK_W = 600;
const TANK_H = 420;
const SURFACE_COUNT = 85;
const surfaceOffset = new Float32Array(SURFACE_COUNT);
const surfaceVelocity = new Float32Array(SURFACE_COUNT);
let sensorPermissionAsked = false;
let orientationHasReported = false;
let previousWaveFrame = 0;

function liquidPath(points, bottom = TANK_H + 5) {
  return points.map((point, i) => (i ? 'L' : 'M') + point.x.toFixed(2) + ' ' + point.y.toFixed(2)).join(' ') +
    ` L${TANK_W} ${bottom} L0 ${bottom} Z`;
}

function drawWaterWave(timestamp = 0) {
  const tank = app.querySelector('.hero-tank');
  if (!tank) { waterWave.frame = 0; previousWaveFrame = 0; return; }
  const svg = tank.querySelector('.hero-tank-water');
  if (!svg) { waterWave.frame = 0; return; }
  const body = svg.querySelector('.tank-water-body');
  const crest = svg.querySelector('.tank-wave-crest');
  const shine = svg.querySelector('.tank-underwater-glow');
  if (!body || !crest || !shine) { waterWave.frame = 0; return; }

  const motionOff = reducedMotion();
  const rawFill = parseFloat(tank.style.getPropertyValue('--tank-level'));
  const fillFraction = Number.isFinite(rawFill) ? Math.max(0, Math.min(1, rawFill / 100)) : 0;
  // An empty record or a recorded zero must show an empty tank, not fake water.
  if (fillFraction === 0) {
    body.setAttribute('d', '');
    crest.setAttribute('d', '');
    shine.setAttribute('d', '');
    waterWave.frame = 0;
    previousWaveFrame = 0;
    return;
  }
  const base = 15 + (1 - fillFraction) * 390;
  const dt = previousWaveFrame ? Math.min(1.65, Math.max(.6, (timestamp - previousWaveFrame) / 16.67)) : 1;
  previousWaveFrame = timestamp;

  if (motionOff) {
    surfaceOffset.fill(0);
    surfaceVelocity.fill(0);
    waterWave.angle = 0;
  } else {
    waterWave.angle += (waterWave.target - waterWave.angle) * .055 * dt;
    const nextVelocity = new Float32Array(SURFACE_COUNT);
    for (let i = 0; i < SURFACE_COUNT; i++) {
      const position = i / (SURFACE_COUNT - 1) * 2 - 1;
      const equilibrium = waterWave.angle * position * 2.85;
      const current = surfaceOffset[i];
      const left = surfaceOffset[Math.max(0, i - 1)];
      const right = surfaceOffset[Math.min(SURFACE_COUNT - 1, i + 1)];
      const neighbourForce = (left + right - 2 * current) * .19;
      const restoreForce = (equilibrium - current) * .009;
      const friction = surfaceVelocity[i] * .047;
      nextVelocity[i] = (surfaceVelocity[i] + (neighbourForce + restoreForce - friction) * dt) * .998;
    }
    let mean = 0;
    for (let i = 0; i < SURFACE_COUNT; i++) {
      surfaceVelocity[i] = nextVelocity[i];
      surfaceOffset[i] += surfaceVelocity[i] * dt;
      mean += surfaceOffset[i];
    }
    mean /= SURFACE_COUNT;
    // Maintain average water volume as the surface tilts and oscillates.
    for (let i = 0; i < SURFACE_COUNT; i++) surfaceOffset[i] -= mean;
  }

  const points = [];
  for (let i = 0; i < SURFACE_COUNT; i++) {
    const x = i * TANK_W / (SURFACE_COUNT - 1);
    const y = Math.max(20, Math.min(402, base + surfaceOffset[i]));
    points.push({ x, y });
  }
  body.setAttribute('d', liquidPath(points));
  const top = points.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(2) + ' ' + p.y.toFixed(2)).join(' ');
  crest.setAttribute('d', top);
  shine.setAttribute('d', top);
  waterWave.frame = motionOff ? 0 : requestAnimationFrame(drawWaterWave);
}

function startWaterWaves() {
  if (waterWave.frame) cancelAnimationFrame(waterWave.frame);
  waterWave.frame = 0;
  previousWaveFrame = 0;
  if (app.querySelector('.hero-tank')) waterWave.frame = requestAnimationFrame(drawWaterWave);
}

function applyWaterMotion(x) {
  if (reducedMotion()) return;
  waterWave.target = Math.max(-1, Math.min(1, x)) * -15;
}

function addWaterImpulse(x, strength = 2) {
  if (reducedMotion()) return;
  const center = Math.max(0, Math.min(SURFACE_COUNT - 1, Math.round(x * (SURFACE_COUNT - 1))));
  for (let i = Math.max(0, center - 10); i <= Math.min(SURFACE_COUNT - 1, center + 10); i++) {
    const influence = Math.exp(-Math.pow((i - center) / 4.1, 2));
    surfaceVelocity[i] += influence * strength;
  }
}

function handleOrientation(event) {
  if (reducedMotion() || !Number.isFinite(event.gamma)) return;
  orientationHasReported = true;
  tiltEnabled = true;
  if (!orientationBase) orientationBase = { gamma: event.gamma };
  applyWaterMotion((event.gamma - orientationBase.gamma) / 25);
}

// Device orientation works automatically on browsers that grant motion access.
// iOS may require a user gesture to request permission, so the first touch on
// the water surface is the gesture. No separate Enable button is displayed.
async function requestTankMotionPermission() {
  if (sensorPermissionAsked || !window.isSecureContext ||
      typeof DeviceOrientationEvent === 'undefined' || reducedMotion()) return;
  sensorPermissionAsked = true;
  if (typeof DeviceOrientationEvent.requestPermission !== 'function') return;
  try {
    const result = await DeviceOrientationEvent.requestPermission();
    if (result !== 'granted') tiltEnabled = false;
  } catch {
    tiltEnabled = false;
  }
}

function setPage(page) {
  if (!NAV.some(item => item.id === page)) return;
  editingId = null;
  state.page = page;
  notice = "";
  saveState();
  renderShell();
  if (page === "ripple") updateSimulation();
  window.scrollTo({ top: 0, behavior: scrollBehavior() });
}
function saveEntry(form) {
  const data = new FormData(form);
  const type = state.resource;
  const month = String(data.get("month") || "");
  const days = Number(data.get("days"));
  const quantityRaw = String(data.get("quantity") ?? "").trim();
  const quantity = Number(quantityRaw);
  const billUnit = type === "water" ? String(data.get("unit")) : "kWh";
  const costRaw = String(data.get("cost") || "");
  const cost = costRaw === "" ? null : Number(costRaw);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || Number(month.slice(0, 4)) === 0 || !Number.isInteger(days) || days < 1 || days > 366 ||
      quantityRaw === "" || !Number.isFinite(quantity) || quantity < 0 || quantity > 1e8 ||
      (type === "water" && !Object.hasOwn(WATER_UNITS, billUnit)) ||
      (cost !== null && (!Number.isFinite(cost) || cost < 0 || cost > 1e6))) {
    showValidationNotice("Check the bill month, billing days, amount, unit, and optional cost.");
    return;
  }
  const duplicate = state.entries.find(e => e.type === type && e.month === month && e.id !== editingId);
  if (duplicate && !window.confirm("A " + type + " bill for " + monthLabel(month) + " already exists. Replace it?")) return;
  const id = editingId || (window.crypto?.randomUUID?.() || String(Date.now() + Math.random()));
  const amount = type === "water" ? quantity * WATER_UNITS[billUnit] : quantity;
  state.entries = state.entries.filter(e => e.id !== id && e.id !== duplicate?.id);
  state.entries.push({ id, type, month, days, quantity, unit: billUnit, amount, cost });
  editingId = null;
  notice = duplicate ? "Existing bill replaced." : "Bill saved to this browser.";
  saveState();
  renderShell();
  app.querySelector('#entry-form [name="month"]')?.focus({ preventScroll: true });
}
function saveProfile(form) {
  const data = new FormData(form);
  const residents = Number(data.get("residents"));
  const waterGoal = String(data.get("waterGoal") || "");
  const electricGoal = String(data.get("electricGoal") || "");
  if (!Number.isInteger(residents) || residents < 1 || residents > 30 ||
      (waterGoal && (!Number.isFinite(Number(waterGoal)) || Number(waterGoal) < 0.01 || Number(waterGoal) > 1e11)) ||
      (electricGoal && (!Number.isFinite(Number(electricGoal)) || Number(electricGoal) < 0.01 || Number(electricGoal) > 1e11))) {
    showValidationNotice("Please check your household size and goals.");
    return;
  }
  state.profile = {
    residents,
    home: ["house", "apartment", "townhome"].includes(data.get("home")) ? data.get("home") : "apartment",
    city: String(data.get("city") || "").trim().slice(0, 80),
    lawn: data.has("lawn"),
    irrigation: data.has("irrigation"),
    priority: ["water", "electricity", "both"].includes(data.get("priority")) ? data.get("priority") : "both",
    waterGoal,
    electricGoal
  };
  if (state.profile.priority !== "both") state.resource = state.profile.priority;
  notice = "Household profile saved.";
  saveState();
  renderShell();
  app.querySelector('#profile-form [type="submit"]')?.focus({ preventScroll: true });
}
app.addEventListener("click", event => {
  if (event.target.closest('.usage-history > summary')) { usageHistoryOpen = !usageHistoryOpen; return; }
  if (event.target.closest('.map-environment > summary')) { environmentPanelOpen = !environmentPanelOpen; return; }
  const loadSample = event.target.closest("[data-load-sample]");
  if (loadSample) {
    if (state.entries.length !== 0) { notice = "Sample data is available only when no bills are saved."; renderShell(); return; }
    state.entries = makeFictionalSampleBills();
    state.resource = "water";
    state.page = "usage";
    notice = "Loaded 24 fictional sample bills for 2025.";
    saveState();
    renderShell();
    return;
  }
  const householdStep = event.target.closest('[data-residents-step]');
  if (householdStep) {
    const input = app.querySelector('#profile-form [name="residents"]');
    if (input) input.value = Math.max(1, Math.min(30, (Number(input.value) || 1) + Number(householdStep.dataset.residentsStep)));
    return;
  }
  const homeChoice = event.target.closest('[data-home-choice]');
  if (homeChoice) {
    const form = app.querySelector('#profile-form');
    if (!form) return;
    form.querySelector('[name="home"]').value = homeChoice.dataset.homeChoice;
    form.querySelectorAll('[data-home-choice]').forEach(button => {
      const on = button === homeChoice;
      button.classList.toggle('selected', on);
      button.setAttribute('aria-pressed', String(on));
    });
    return;
  }
  const priorityChoice = event.target.closest('[data-priority-choice]');
  if (priorityChoice) {
    const form = app.querySelector('#profile-form');
    if (!form) return;
    form.querySelector('[name="priority"]').value = priorityChoice.dataset.priorityChoice;
    form.querySelectorAll('[data-priority-choice]').forEach(button => {
      const chosen = button === priorityChoice;
      button.classList.toggle('selected', chosen);
      button.setAttribute('aria-pressed', String(chosen));
    });
    return;
  }
  const nav = event.target.closest("[data-nav]");
  if (nav) { setPage(nav.dataset.nav); return; }
  const mapLayer = event.target.closest("[data-map-layer]");
  if (mapLayer && ["demo", "official"].includes(mapLayer.dataset.mapLayer)) {
    state.mapLayer = mapLayer.dataset.mapLayer;
    saveState();
    renderShell();
    return;
  }
  const challengeJoin = event.target.closest("[data-challenge-join]");
  if (challengeJoin && CHALLENGES.some(item => item.id === challengeJoin.dataset.challengeJoin)) {
    const id = challengeJoin.dataset.challengeJoin;
    const today = todayLocal();
    const current = latestChallengeRun(id);
    if (current && dayOffset(current.startedOn, today) >= 0 && dayOffset(current.startedOn, today) < 7) return;
    state.challengeRuns.push({ id, startedOn: today, checkins: [] });
    state.challengeRuns = state.challengeRuns.slice(-50);
    saveState();
    renderShell();
    app.querySelector('[data-challenge-checkin="' + id + '"]')?.focus({ preventScroll: true });
    return;
  }
  const challengeCheckin = event.target.closest("[data-challenge-checkin]");
  if (challengeCheckin && CHALLENGES.some(item => item.id === challengeCheckin.dataset.challengeCheckin)) {
    const id = challengeCheckin.dataset.challengeCheckin;
    const run = latestChallengeRun(id);
    const today = todayLocal();
    if (!run || dayOffset(run.startedOn, today) < 0 || dayOffset(run.startedOn, today) >= 7 || run.checkins.includes(today)) return;
    run.checkins.push(today);
    saveState();
    renderShell();
    app.querySelector('[data-challenge-undo="' + id + '"]')?.focus({ preventScroll: true });
    return;
  }
  const challengeUndo = event.target.closest("[data-challenge-undo]");
  if (challengeUndo && CHALLENGES.some(item => item.id === challengeUndo.dataset.challengeUndo)) {
    const id = challengeUndo.dataset.challengeUndo;
    const run = latestChallengeRun(id);
    const today = todayLocal();
    if (!run || !run.checkins.includes(today)) return;
    run.checkins = run.checkins.filter(day => day !== today);
    saveState();
    renderShell();
    app.querySelector('[data-challenge-checkin="' + id + '"]')?.focus({ preventScroll: true });
    return;
  }
  const resource = event.target.closest("[data-resource]");
  if (resource) {
    state.resource = resource.dataset.resource;
    communityRows = [];
    editingId = null;
    saveState();
    renderShell();
    if (state.page === 'ripple') updateSimulation();
    return;
  }
  const edit = event.target.closest("[data-edit]");
  if (edit) {
    const entry = state.entries.find(e => e.id === edit.dataset.edit);
    if (entry) {
      editingId = entry.id;
      state.resource = entry.type;
      renderShell();
      document.querySelector('#entry-form [name="month"]')?.focus({ preventScroll: true });
      document.getElementById("entry-form")?.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
    }
    return;
  }
  const deletion = event.target.closest("[data-delete]");
  if (deletion) {
    const entry = state.entries.find(e => e.id === deletion.dataset.delete);
    if (entry && window.confirm("Delete your " + monthLabel(entry.month) + " " + entry.type + " bill?")) {
      state.entries = state.entries.filter(e => e.id !== entry.id);
      if (editingId === entry.id) editingId = null;
      notice = "Bill deleted.";
      saveState();
      renderShell();
      (app.querySelector('[data-delete]') || app.querySelector('#entry-form [name="month"]'))?.focus({ preventScroll: true });
    }
    return;
  }
  if (event.target.closest("[data-cancel-edit]")) {
    const id = editingId;
    editingId = null;
    renderShell();
    app.querySelector('[data-edit="' + CSS.escape(id) + '"]')?.focus({ preventScroll: true });
    return;
  }
  const span = event.target.closest("[data-span]");
  if (span) { state.chartSpan = span.dataset.span; saveState(); renderShell(); return; }
  const leaderboardRegion = event.target.closest("[data-leaderboard-region]");
  if (leaderboardRegion) {
    selectMapCounty(leaderboardRegion.dataset.leaderboardRegion);
    return;
  }
  const actionAdd = event.target.closest('[data-action-add]');
  if (actionAdd && ACTION_CATALOG.some(action => action.id === actionAdd.dataset.actionAdd) &&
      !state.actionGoals.some(goal => goal.id === actionAdd.dataset.actionAdd)) {
    state.actionGoals.push({ id: actionAdd.dataset.actionAdd, done: false });
    saveState();
    renderShell();
    updateSimulation();
    app.querySelector('[data-action-toggle="' + actionAdd.dataset.actionAdd + '"]')?.focus({ preventScroll: true });
    return;
  }
  const actionToggle = event.target.closest('[data-action-toggle]');
  if (actionToggle) {
    const goal = state.actionGoals.find(item => item.id === actionToggle.dataset.actionToggle);
    if (!goal) return;
    goal.done = !goal.done;
    saveState();
    renderShell();
    updateSimulation();
    app.querySelector('[data-action-toggle="' + goal.id + '"]')?.focus({ preventScroll: true });
    return;
  }
  const actionRemove = event.target.closest('[data-action-remove]');
  if (actionRemove) {
    state.actionGoals = state.actionGoals.filter(goal => goal.id !== actionRemove.dataset.actionRemove);
    saveState();
    renderShell();
    updateSimulation();
    app.querySelector('[data-action-add="' + actionRemove.dataset.actionRemove + '"]')?.focus({ preventScroll: true });
    return;
  }
  const region = event.target.closest("[data-region]");
  if (region) {
    selectMapCounty(region.dataset.region);
    return;
  }
});
app.addEventListener('pointermove', event => {
  const hero = event.target.closest('.home-hero');
  if (!hero || (orientationHasReported && event.pointerType === 'touch')) return;
  const bounds = hero.getBoundingClientRect();
  if (!bounds.width) return;
  applyWaterMotion((event.clientX - bounds.left) / bounds.width * 2 - 1);
});
app.addEventListener('pointerout', event => {
  const hero = event.target.closest('.home-hero');
  if (!hero || hero.contains(event.relatedTarget) || orientationHasReported) return;
  applyWaterMotion(0);
});
app.addEventListener('pointerdown', event => {
  const hero = event.target.closest('.home-hero');
  if (!hero || event.target.closest('button,input,select') || reducedMotion()) return;
  // A direct user gesture can grant orientation access in mobile Safari.
  if (event.pointerType === 'touch') requestTankMotionPermission();
  const rect = hero.getBoundingClientRect();
  if (!rect.width) return;
  const x = (event.clientX - rect.left) / rect.width;
  addWaterImpulse(x, 4.5);
  if (!orientationHasReported) applyWaterMotion(x * 2 - 1);
});
window.addEventListener('deviceorientation', handleOrientation, { passive: true });

app.addEventListener("keydown", event => {
  if ((event.key === "Enter" || event.key === " ") && event.target.matches("svg [data-region]") &&
      countyMap?.counties.some(county => county.name === event.target.dataset.region)) {
    event.preventDefault();
    selectMapCounty(event.target.dataset.region);
  }
});
app.addEventListener("change", event => {
  if (event.target.matches('[data-county-select]') && countyMap?.counties.some(county => county.name === event.target.value)) {
    selectMapCounty(event.target.value);
  }
});
app.addEventListener("submit", event => {
  if (event.target.id === "entry-form") {
    event.preventDefault();
    saveEntry(event.target);
  } else if (event.target.id === "profile-form") {
    event.preventDefault();
    saveProfile(event.target);
  }
});
app.addEventListener("input", event => {
  if (event.target.matches("[data-sim]")) {
    simulation[event.target.dataset.sim] = Number(event.target.value);
    updateSimulation();
  } else if (event.target.matches("[data-estimate-action][data-estimate-field]")) {
    const id = event.target.dataset.estimateAction;
    const field = event.target.dataset.estimateField;
    if (!ESTIMATE_SCENARIOS[id]?.fields.some(item => item.key === field)) return;
    estimateInputs[id][field] = event.target.value;
    const output = app.querySelector('[data-estimate-output="' + id + '"]');
    if (output) output.textContent = actionEstimateText(id);
  }
});
app.addEventListener("toggle", event => {
  const panel = event.target;
  if (panel.matches?.(".usage-history")) { usageHistoryOpen = panel.open; return; }
  if (panel.matches?.(".map-environment")) { environmentPanelOpen = panel.open; return; }
  if (!panel.matches?.("[data-estimate-panel]")) return;
  if (panel.open) estimateOpen.add(panel.dataset.estimatePanel);
  else estimateOpen.delete(panel.dataset.estimatePanel);
}, true);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && state.page === "ripple") {
    renderShell();
    updateSimulation();
  }
});
renderShell();
if (state.page === "ripple") updateSimulation();
loadCountyMap();
loadShowcaseCountyStats();
installFeatures();
