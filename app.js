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
  profile: { residents: 1, home: "apartment", city: "", lawn: false, irrigation: false, waterGoal: "", electricGoal: "" },
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
function pageIntro(kicker, title, subtitle = "") {
  return '<header class="intro"><h1>' + esc(title) + '</h1>' +
    (subtitle ? '<p>' + esc(subtitle) + '</p>' : '') + '</header>';
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
      '<p class="footer">Student-built in Utah. Your data stays in this browser unless you enable an account. Sample map data and calculator outputs are estimates, not verified savings.</p>' +
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
  // Difference between two billing-period daily averages, scaled to the latest bill.
  // This is not a verified conservation measurement (weather, occupancy and season vary).
  const waterDifference = water.latest && water.previous
    ? (daily(water.previous) - daily(water.latest)) * water.latest.days : null;
  const electricDifference = electricity.latest && electricity.previous
    ? (daily(electricity.previous) - daily(electricity.latest)) * electricity.latest.days : null;
  const goal = Number(state.profile.waterGoal);
  const tankLevel = water.latest && goal > 0
    ? Math.max(8, Math.min(93, monthlyEquivalent(water.latest) / goal * 100)) : 51;
  const tankCaption = water.latest && goal > 0
    ? number(monthlyEquivalent(water.latest) / goal * 100, 0) + '% of your monthly water goal (capped in animation)'
    : 'Decorative water animation · not a storage reading';
  const tiltAvailable = !reducedMotion() && window.isSecureContext && typeof DeviceOrientationEvent !== 'undefined';
  const motionHint = reducedMotion() ? 'Reduced motion is on.' :
    !window.isSecureContext ? 'Phone tilt requires HTTPS.' :
    typeof DeviceOrientationEvent === 'undefined' ? 'Move over the tank or touch it to make waves.' :
    (tiltMessage || 'Move over the tank, or enable phone tilt to slosh the water.');
  const waterDifferenceText = waterDifference === null ? '—'
    : (waterDifference > 0 ? number(waterDifference, 0) + ' gal less' :
      waterDifference < 0 ? number(Math.abs(waterDifference), 0) + ' gal more' : 'No change');
  const electricDifferenceText = electricDifference === null ? '—'
    : (electricDifference > 0 ? number(electricDifference, 1) + ' kWh less' :
      electricDifference < 0 ? number(Math.abs(electricDifference), 1) + ' kWh more' : 'No change');
  return `
    <section class="card hero hero-flow-demo home-hero">
      <div class="hero-tank" aria-hidden="true" style="--tank-level:${tankLevel.toFixed(2)}%">
        <svg class="hero-tank-water" preserveAspectRatio="none">
          <defs>
            <linearGradient id="tank-front-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#56dae4"/><stop offset="0.5" stop-color="#069ab1"/><stop offset="1" stop-color="#074f6c"/>
            </linearGradient>
            <linearGradient id="tank-back-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#bcffff" stop-opacity=".85"/>
              <stop offset="1" stop-color="#35bacb" stop-opacity=".4"/>
            </linearGradient>
          </defs>
          <path class="tank-wave-back" fill="url(#tank-back-fill)"></path>
          <path class="tank-wave-front" fill="url(#tank-front-fill)"></path>
          <path class="tank-wave-crest" stroke="rgba(233,255,255,.95)" stroke-width="3" fill="none"></path>
        </svg><div class="tank-ripple"></div>
      </div>
      <div class="hero-copy">
        <div class="home-kicker">YOUR WATER</div>
        <h1>See the difference.</h1>
        <p>Track water and electricity. Find changes worth making.</p>
        <div class="home-water-number">${waterDifferenceText}</div>
        <div class="home-water-detail">${waterChange === null ? 'Add two water bills to compare your usage.' :
          Math.abs(waterChange).toFixed(1) + '% ' + (waterChange < 0 ? 'lower' : waterChange > 0 ? 'higher' : 'change') +
          ' daily water use than your previous bill'}</div>
        <div class="button-row"><button type="button" class="button primary" data-nav="usage">Add a bill</button>
          <button type="button" class="button secondary" data-nav="map">Explore Utah</button></div>
        <div class="tank-motion"><button type="button" class="tilt-toggle" data-tilt ${tiltAvailable ? '' : 'disabled'}>${tiltEnabled ? 'Turn tilt off' : 'Enable phone tilt'}</button>
          <p class="motion-hint" id="tilt-status" role="status">${esc(motionHint)}</p></div>
        <div class="home-tank-disclaimer">${esc(tankCaption)}</div>
      </div>
    </section>
    <section class="home-stat-row">
      <article class="card home-stat"><div class="home-stat-icon">💧</div><div>
        <span class="stat-label">Latest water bill</span>
        <div class="home-stat-number">${water.latest ? number(water.latest.amount, 0) + ' gal' : 'No data'}</div>
        <p class="stat-note">${water.latest ? esc(monthLabel(water.latest.month)) : 'Add your first bill'}</p>
      </div></article>
      <article class="card home-stat"><div class="home-stat-icon">⚡</div><div>
        <span class="stat-label">Electricity vs. previous bill</span>
        <div class="home-stat-number">${electricDifferenceText}</div>
        <p class="stat-note">${electricChange === null ? 'Add two electricity bills to compare' :
          Math.abs(electricChange).toFixed(1) + '% ' + (electricChange < 0 ? 'lower' : electricChange > 0 ? 'higher' : 'change') + ' daily use'}</p>
      </div></article>
    </section>
    <p class="home-comparison-note">Differences compare daily usage between your two latest bills and scale it to the latest billing period. They aren't verified savings; seasons and household changes affect bills.</p>
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
    {value: 'apartment', icon: '🏢', label: 'Apartment'},
    {value: 'townhome', icon: '🏘️', label: 'Townhome'},
    {value: 'house', icon: '🏡', label: 'House'}
  ];
  return pageIntro('', 'Your Household', 'A few details help make your comparisons useful.') +
    '<section class="card profile-visual-card"><form id="profile-form">' +
      '<h2>How many people live here?</h2>' +
      '<div class="residents-picker"><span class="residents-graphic" aria-hidden="true">👥</span>' +
      '<button class="residents-step" type="button" data-residents-step="-1" aria-label="Remove one person">−</button>' +
      '<input name="residents" type="number" min="1" max="30" step="1" required aria-label="People in household" value="' + esc(p.residents) + '">' +
      '<button class="residents-step" type="button" data-residents-step="1" aria-label="Add one person">+</button></div>' +
      '<h2 class="profile-question">What kind of home?</h2>' +
      '<input type="hidden" name="home" value="' + esc(p.home) + '">' +
      '<div class="home-choice-grid" role="group" aria-label="Home type">' + houses.map(h =>
        '<button type="button" class="home-choice ' + (p.home === h.value ? 'selected' : '') + '" data-home-choice="' + h.value + '" aria-pressed="' + (p.home === h.value) + '"><span class="home-choice-icon" aria-hidden="true">' + h.icon + '</span><span>' + h.label + '</span></button>'
      ).join('') + '</div>' +
      '<div class="profile-extra-fields">' +
        field('City or ZIP (optional)', '<input name="city" maxlength="80" value="' + esc(p.city) + '" placeholder="e.g. Provo">') +
        field('Monthly water goal (gal)', '<input name="waterGoal" type="number" min="0.01" max="100000000000" step="any" value="' + esc(p.waterGoal) + '" placeholder="Optional">') +
        field('Monthly electricity goal (kWh)', '<input name="electricGoal" type="number" min="0.01" max="100000000000" step="any" value="' + esc(p.electricGoal) + '" placeholder="Optional">') +
      '</div>' +
      '<div class="profile-options"><label class="check"><input name="lawn" type="checkbox" ' + (p.lawn ? 'checked' : '') + '> 🌿 We have a lawn or garden</label>' +
      '<label class="check"><input name="irrigation" type="checkbox" ' + (p.irrigation ? 'checked' : '') + '> 💦 Our water bill includes irrigation</label></div>' +
      '<button class="button primary profile-save" type="submit">Save household</button></form></section>' +
    '<details class="card profile-data"><summary>Your data & preferences</summary>' +
      '<p class="muted">Records are stored in this browser. Export a backup before clearing anything.</p>' +
      '<div class="button-row"><button class="button secondary" type="button" data-extra="backup">Download backup</button>' +
      '<button class="button danger" type="button" data-extra="clear-local">Clear saved data</button></div>' +
      '<label class="field file-field"><span>Restore a backup</span><input type="file" accept=".json,application/json" data-import-backup></label>' +
      '<label class="check"><input type="checkbox" data-reduce-motion ' + (state.reduceMotion ? 'checked' : '') + '> Reduce animations</label></details>';
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
  const chosen = counties.find(c => c.name === state.region) || counties.find(c => c.name === 'Salt Lake');
  const name = chosen?.name || 'Salt Lake';
  const isWater = state.resource === 'water';
  const val = chosen ? demoCountyUsage(chosen) : null;
  const label = isWater ? 'gal/person/day' : 'kWh/account/day';
  const colorData = counties.map(county => {
    const amount = demoCountyUsage(county);
    return '<path class="county ' + (county.name === name ? 'active' : '') + '" d="' + county.path +
      '" style="--county-fill:' + usageDemoColor(amount, state.resource) + '" data-region="' + esc(county.name) +
      '" role="button" tabindex="0" aria-label="' + esc(county.name) + ' County, fictional usage ' + amount + ' ' + label +
      '"><title>' + esc(county.name) + ' County · sample ' + amount + ' ' + label + '</title></path>';
  }).join('');
  return pageIntro('', 'Explore Utah', 'Tap a county to see its sample usage.') +
    '<div class="map-hero-top"><div class="map-hero-title"><span class="map-icon">⌖</span><strong>Utah, county by county</strong></div>' + resourceSwitch() + '</div>' +
    '<p class="map-demo-label"><strong>FICTIONAL DATA</strong> · Colors illustrate how a county usage map could work. No measured county household data is shown.</p>' +
    '<section class="map-stage">' +
      '<div class="map-canvas">' + (counties.length ? '<svg class="utah-map" viewBox="0 0 380 510" role="group" aria-label="Utah counties colored by fictional household ' + (isWater ? 'water' : 'electricity') + ' use">' + colorData + '</svg>' :
        '<div class="empty">' + (countyLoadError ? esc(countyLoadError) : 'Loading Utah counties…') + '</div>') +
      '<div class="map-gradient-legend"><div class="map-gradient-bar ' + (isWater ? 'water' : 'electricity') + '"></div><span>Less example use</span><span>More example use</span></div></div>' +
      '<aside class="map-side"><span class="map-side-label">SELECTED COUNTY</span><h2>' + esc(name) + '</h2>' +
        '<div class="map-selected-stat">' + (val === null ? '—' : number(val, 1)) + '</div>' +
        '<div class="map-selected-unit">sample ' + label + '</div>' +
        '<label class="field map-select-label"><span>Choose a county</span><select data-county-select ' + (counties.length ? '' : 'disabled') + '>' +
        counties.map(c => '<option value="' + esc(c.name) + '" ' + selectedOption(c.name, name) + '>' + esc(c.name) + ' County</option>').join('') +
        '</select></label>' +
        '<p class="map-side-foot">Darker counties represent higher usage in this fictional example, <strong>not actual Utah statistics</strong>.</p></aside>' +
    '</section>' +
    renderRegionalLeaderboard(counties, name, true) +
    '<details class="card map-sources"><summary>About the data</summary>' +
      '<p>These county usage numbers are intentionally simulated to illustrate the map. They do not represent real county water or electricity consumption, participant counts, or savings.</p>' +
      '<p>County boundaries: <a href="https://gis.utah.gov/products/sgid/boundaries/county/" target="_blank" rel="noopener noreferrer">Utah SGID</a>. ' +
      'Statewide context (not county estimates): <a href="' + USGS_DOMESTIC_SOURCE + '" target="_blank" rel="noopener noreferrer">USGS water</a> · ' +
      '<a href="' + EIA_SOURCE + '" target="_blank" rel="noopener noreferrer">EIA electricity</a>.</p></details>';
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
  const water = state.resource === 'water';
  const p = state.profile;
  const themes = water ? [
    {icon:'🌊', title:'Great Salt Lake', description:'Using less water can reduce demand on shared supplies. It does not mean saved household gallons flow directly into the lake.'},
    {icon:'🏞️', title:'Rivers & reservoirs', description:'Less demand can help conservation planning and resilience, depending on local water management.'},
    {icon:'🏠', title:'Your community', description:'Reducing waste can lower demand on the systems that deliver and treat household water.'}
  ] : [
    {icon:'⚡', title:'The power grid', description:'Using fewer kWh reduces household electricity demand. The generation and emissions impact varies by time and supply.'},
    {icon:'🌎', title:'Energy resources', description:'Efficiency can reduce the energy needed to supply homes, especially during high-demand hours.'},
    {icon:'🏠', title:'Your household', description:'Using less electricity may reduce your bill, depending on rates and fixed charges.'}
  ];
  const cards = themes.map(t => '<article class="impact-destination"><span class="impact-emoji" aria-hidden="true">' + t.icon + '</span><h3>' + t.title + '</h3><p>' + t.description + '</p></article>').join('');
  const tipIds = water ? ['hidden-leaks', p.lawn ? 'outdoor-watering' : 'efficient-fixtures', 'full-laundry'] : ['idle-power'];
  const tips = tipIds.map(id => ACTION_CATALOG.find(a => a.id === id)).filter(Boolean)
    .map(a => '<article class="ripple-simple-tip"><h3>' + esc(a.title) + '</h3><p>' + esc(a.action) + '</p></article>').join('');
  const electricTips = water ? '' : '<article class="ripple-simple-tip"><h3>Switch to LEDs</h3><p>Choose LED bulbs when replacing frequently used lights.</p></article>' +
    '<article class="ripple-simple-tip"><h3>Check the thermostat</h3><p>Adjust heating and cooling when you are away, when practical.</p></article>';
  const calculator = water
    ? '<section class="card ripple-simulator"><div class="impact-calculator-label">TRY A CHANGE</div><h2>Shorter showers</h2><p class="muted">Estimate how many gallons you could save.</p>' +
        slider('Current shower length', 'current', 1, 30, simulation.current, 'min') +
        slider('New shower length', 'target', 1, 30, simulation.target, 'min') +
        slider('People showering daily', 'household', 1, 30, simulation.household ?? p.residents, 'people') +
        slider('Showerhead flow rate', 'flow', .5, 5, simulation.flow, 'gal/min', .1) +
        '<div class="grid two ripple-output"><div><div class="stat-label">Monthly estimate</div><div class="stat-value" id="sim-monthly">—</div><small>gal / 30 days</small></div>' +
        '<div><div class="stat-label">Yearly estimate</div><div class="stat-value" id="sim-yearly">—</div><small>gal / 365 days</small></div></div>' +
        '<p class="fineprint" id="sim-explanation"></p></section>'
    : '<section class="card ripple-simulator"><div class="impact-calculator-label">TRY A CHANGE</div><h2>Standby electricity</h2><p class="muted">Estimate the kWh avoided by switching off idle devices.</p>' + renderActionEstimate('idle-power') + '</section>';
  return pageIntro('', 'Your Impact', 'See why conserving water and electricity matters.') +
    '<div class="section-spotlight impact-switch"><span class="spotlight-icon">' + (water ? '💧' : '⚡') + '</span><strong>' + (water ? 'Water' : 'Electricity') + ' impact</strong>' + resourceSwitch() + '</div>' +
    '<section class="impact-intro"><div class="impact-orb">' + (water ? '💧' : '⚡') + '</div>' +
      '<h2>Where could it make a difference?</h2>' +
      '<p>What you conserve stays part of a bigger system. Here are places reduced demand can matter.</p></section>' +
    '<section class="impact-destinations" aria-label="Potential conservation benefits">' + cards + '</section>' +
    '<p class="impact-caution">These are potential system-wide benefits, not destinations for specific gallons or a claim of measured environmental impact.</p>' +
    calculator +
    '<details class="card impact-tips"><summary>Simple ways to use less</summary><div class="impact-tip-grid">' + tips + electricTips + '</div></details>' +
    '<details class="card ripple-goal-details"><summary>Set a monthly reduction goal</summary>' +
      renderMeasuredGoals().replace(/^<section class="card feature-section">|<\/section>$/g, '') + '</details>';
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
function waveLine(width, base, tilt, amplitude, phase, frequency) {
  const points = [];
  for (let i = 0; i <= 36; i++) {
    const x = width * i / 36;
    const position = i / 36;
    const y = base + tilt * (position - .5) +
      Math.sin(position * Math.PI * frequency + phase) * amplitude +
      Math.sin(position * Math.PI * (frequency * 1.83) - phase * .66) * amplitude * .26;
    points.push((i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1));
  }
  return points.join(' ');
}
function drawWaterWave() {
  const tank = app.querySelector('.hero-tank');
  if (!tank) { waterWave.frame = 0; return; }
  const svg = tank.querySelector('.hero-tank-water');
  const width = tank.clientWidth;
  const height = tank.clientHeight;
  if (!width || !height) { waterWave.frame = requestAnimationFrame(drawWaterWave); return; }
  const still = reducedMotion();
  if (!still) {
    waterWave.velocity += (waterWave.target - waterWave.angle) * .105 - waterWave.velocity * .12;
    waterWave.angle += waterWave.velocity;
    waterWave.energy *= .978;
    waterWave.phase += .048;
  } else {
    waterWave.angle = 0;
    waterWave.velocity = 0;
    waterWave.energy = 0;
  }
  const level = Math.max(0, Math.min(100, parseFloat(tank.style.getPropertyValue('--tank-level')) || 0));
  if (level === 0) { waterWave.frame = 0; return; }
  const base = height * (1 - level / 100);
  const tilt = still ? 0 : waterWave.angle * width * .040;
  const amplitude = still ? 0 : Math.min(36, 4.2 + waterWave.energy * 15);
  svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
  const back = waveLine(width, base - 10, -tilt * .8, amplitude * .72, -waterWave.phase * .9, 1.5);
  const front = waveLine(width, base, tilt, amplitude, waterWave.phase, 1.8);
  svg.querySelector('.tank-wave-back').setAttribute('d', back + ' L' + width + ' ' + height + ' L0 ' + height + ' Z');
  svg.querySelector('.tank-wave-front').setAttribute('d', front + ' L' + width + ' ' + height + ' L0 ' + height + ' Z');
  svg.querySelector('.tank-wave-crest').setAttribute('d', front);
  waterWave.frame = still ? 0 : requestAnimationFrame(drawWaterWave);
}
function startWaterWaves() {
  if (waterWave.frame) cancelAnimationFrame(waterWave.frame);
  waterWave.frame = 0;
  if (app.querySelector('.hero-tank')) waterWave.frame = requestAnimationFrame(drawWaterWave);
}
function applyWaterMotion(x) {
  if (reducedMotion()) return;
  const next = Math.max(-1, Math.min(1, x)) * -11;
  waterWave.energy = Math.min(3.5, waterWave.energy + Math.abs(next - waterWave.target) * .26);
  waterWave.target = next;
  const tank = app.querySelector('.hero-tank');
  if (tank) tank.style.setProperty('--tank-angle', next.toFixed(2) + 'deg');
}
function handleOrientation(event) {
  if (!tiltEnabled || !Number.isFinite(event.gamma) || !Number.isFinite(event.beta)) return;
  if (!orientationBase) orientationBase = { gamma: event.gamma, beta: event.beta };
  const x = Math.max(-1, Math.min(1, (event.gamma - orientationBase.gamma) / 14));
  applyWaterMotion(x);
}
async function toggleTilt() {
  if (tiltEnabled) {
    tiltEnabled = false;
    orientationBase = null;
    window.removeEventListener('deviceorientation', handleOrientation);
    applyWaterMotion(0);
    tiltMessage = 'Tilt is off. Touch or move over the water to make it respond.';
  } else if (!window.isSecureContext) {
    tiltMessage = 'Tilt needs HTTPS on this phone.';
  } else if (typeof DeviceOrientationEvent === 'undefined') {
    tiltMessage = 'This browser has no orientation sensor available.';
  } else {
    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const result = await DeviceOrientationEvent.requestPermission();
        if (result !== 'granted') throw new Error('Permission not granted');
      }
      orientationBase = null;
      tiltEnabled = true;
      tiltMessage = 'Tilt enabled. Move the phone gently to shift the water.';
      window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    } catch {
      tiltMessage = 'Motion access was not granted. Touch interaction still works.';
    }
  }
  renderShell();
  app.querySelector('[data-tilt]')?.focus({ preventScroll: true });
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
    waterGoal,
    electricGoal
  };
  notice = "Household profile saved.";
  saveState();
  renderShell();
  app.querySelector('#profile-form [type="submit"]')?.focus({ preventScroll: true });
}
app.addEventListener("click", event => {
  if (event.target.closest('[data-tilt]')) { toggleTilt(); return; }
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
  if (leaderboardRegion && countyMap?.counties.some(county => county.name === leaderboardRegion.dataset.leaderboardRegion)) {
    state.region = leaderboardRegion.dataset.leaderboardRegion;
    saveState();
    renderShell();
    app.querySelector('[data-leaderboard-region="' + CSS.escape(state.region) + '"]')?.focus({ preventScroll: true });
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
  if (region && countyMap?.counties.some(county => county.name === region.dataset.region)) {
    state.region = region.dataset.region;
    saveState();
    renderShell();
    app.querySelector('[data-region="' + CSS.escape(state.region) + '"]')?.focus({ preventScroll: true });
    return;
  }
});
app.addEventListener('pointermove', event => {
  const surface = event.target.closest('.hero-flow-demo');
  if (!surface || tiltEnabled) return;
  const bounds = surface.getBoundingClientRect();
  applyWaterMotion((event.clientX - bounds.left) / bounds.width * 2 - 1);
});
app.addEventListener('pointermove', event => {
  if (event.pointerType !== 'touch' || tiltEnabled) return;
  const hero = event.target.closest('.hero-flow-demo');
  if (!hero) return;
  const rect = hero.getBoundingClientRect();
  applyWaterMotion(((event.clientX - rect.left) / rect.width) * 2 - 1);
});
app.addEventListener('pointerout', event => {
  const surface = event.target.closest('.hero-flow-demo');
  if (tiltEnabled || !surface || surface.contains(event.relatedTarget)) return;
  applyWaterMotion(0);
});
app.addEventListener('pointerdown', event => {
  const hero = event.target.closest('.hero-flow-demo');
  if (!hero || event.target.closest('button, input') || reducedMotion()) return;
  const tank = hero.querySelector('.hero-tank');
  if (!tank) return;
  const bounds = hero.getBoundingClientRect();
  tank.style.setProperty('--ripple-x', ((event.clientX - bounds.left) / bounds.width * 100).toFixed(1) + '%');
  tank.style.setProperty('--ripple-y', ((event.clientY - bounds.top) / bounds.height * 100).toFixed(1) + '%');
  tank.classList.remove('pulse');
  void tank.offsetWidth;
  tank.classList.add('pulse');
});
app.addEventListener("keydown", event => {
  if ((event.key === "Enter" || event.key === " ") && event.target.matches("svg [data-region]") &&
      countyMap?.counties.some(county => county.name === event.target.dataset.region)) {
    event.preventDefault();
    state.region = event.target.dataset.region;
    saveState();
    renderShell();
    app.querySelector('[data-region="' + CSS.escape(state.region) + '"]')?.focus({ preventScroll: true });
  }
});
app.addEventListener("change", event => {
  if (event.target.matches('[data-county-select]') && countyMap?.counties.some(county => county.name === event.target.value)) {
    state.region = event.target.value;
    saveState();
    renderShell();
    app.querySelector('[data-county-select]')?.focus({ preventScroll: true });
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
