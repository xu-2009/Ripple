// Extended workflows share the original app's rendering, validation and design tokens.
let importDraft = null;
// Re-enable only after account isolation and shared submissions pass a multi-user test.
const CLOUD_MULTIUSER_VERIFIED = false;
let cloudUser = null;
let cloudRevision = 0;
let cloudStatus = 'Local only';
let cloudBusy = false;
let cloudDirty = false;
let cloudConflict = false;
let cloudReady = false;
let cloudAvailable = false;
let recoveryMode = false;
let syncTimer;
let syncGeneration = 0;
let cloudRequest = Promise.resolve();
let communityRows = [];
let communityError = '';
let mySubmissions = [];
let communityRuns = [];
let communityRanks = [];
let communityMonth = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth()-1); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'); })();
let environmentData = null;
let environmentError = '';
let environmentPanelOpen = false;
const GUEST_STORAGE_KEY = 'ripples-demo-v1';
const D = window.RipplesData;
const C = window.RipplesCloud;

function downloadFile(name, text, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function renderImport() {
  return `<section class="card feature-section"><div class="eyebrow">BRING YOUR HISTORY</div><h2>Import bills</h2>
    <p class="muted">Import a CSV export using the columns in our template. Review every bill before saving. Files are read on this device.</p>
    <div class="button-row"><button class="button secondary" data-extra="template">Download CSV template</button><button class="button secondary" data-extra="export-csv">Export my bills</button></div>
    <label class="field file-field"><span>Choose CSV · maximum 2 MB / 600 bills</span><input type="file" accept=".csv,text/csv" data-import-csv></label>
    <p class="fineprint">Direct recurring imports from a utility account require a supported utility connection and its authorization. That connection is not active.</p>
    ${importDraft ? `<div class="import-review"><h3>Review ${importDraft.length} bills</h3><div class="table-scroll"><table><thead><tr><th>Resource</th><th>Month</th><th>Days</th><th>Quantity</th><th>Existing?</th></tr></thead><tbody>${importDraft.map(e => `<tr><td>${esc(e.type)}</td><td>${esc(e.month)}</td><td>${e.days}</td><td>${number(e.quantity, 2)} ${esc(e.unit)}</td><td>${state.entries.some(old => old.type === e.type && old.month === e.month) ? 'Yes' : 'No'}</td></tr>`).join('')}</tbody></table></div>
    <label class="field"><span>When a resource/month already exists</span><select id="import-policy"><option value="skip">Keep existing bill (skip imported duplicate)</option><option value="replace">Replace existing bill with imported bill</option></select></label>
    <div class="button-row"><button class="button primary" data-extra="import-confirm">Confirm import</button><button class="button secondary" data-extra="import-cancel">Cancel</button></div></div>` : ''}</section>`;
}
function renderForecast() {
  const f = D.forecast(state.entries, state.resource);
  const names = { mean3: 'Recent 3-month average', mean6: 'Recent 6-month average', trend: 'Recent linear trend', seasonal: 'Same month last year' };
  return `<section class="card feature-section"><div class="eyebrow">LOOKING AHEAD · ESTIMATES</div><h2>Your next three months</h2>
    ${!f.ready ? `<p class="empty">${esc(f.reason)} You currently have ${f.count} consecutive bills.</p>` : `<p class="muted">${esc(names[f.model])} performed best on ${f.validationMonths} held-out months from your ${f.count}-month history.</p>
    <div class="grid three">${f.points.map(p => `<div class="forecast-stat"><div class="stat-label">${monthLabel(p.month)}</div><strong>${number(p.amount)} ${unit()}</strong><small>Scenario range ${number(p.low)}–${number(p.high)}</small></div>`).join('')}</div>
    <p class="fineprint">Each estimate uses a 30.44-day equivalent month. Backtest mean absolute error: ${number(f.mae, 1)} ${unit()}/day. Ranges use the largest observed backtest error, widened with the forecast horizon; they are not statistical confidence intervals. Weather, occupancy changes and missing bills can make actual use very different. These estimates never become bill records.</p>`}</section>`;
}
function renderMeasuredGoals() {
  const latest = latestAndPrevious().latest;
  const goals = state.conservationGoals || [];
  return `<section class="card feature-section"><div class="eyebrow">BILL-BASED TARGET</div><h2>Measure a future bill</h2>
    <p class="muted">Compare a future bill with a saved baseline on the same 30.44-day basis.</p>
    <form id="conservation-goal-form"><div class="form-grid">
    ${field('Resource', '<select name="type"><option value="water">Water</option><option value="electricity">Electricity</option></select>')}
    ${field('Target billing month', '<input name="month" type="month" required value="' + (latest ? D.monthName(D.monthIndex(latest.month) + 1) : todayLocal().slice(0,7)) + '">')}
    ${field('Reduction type', '<select name="mode"><option value="percent">Percent reduction</option><option value="amount">Fewer gal / kWh per equivalent month</option></select>')}
    ${field('Reduction', '<input name="reduction" type="number" min="0.01" step="any" required placeholder="e.g. 5">')}
    </div><p class="fineprint">Uses the latest bill for the chosen resource as the baseline. The target month must be later.</p><button class="button primary" type="submit">Save conservation goal</button></form>
    <div class="goal-list">${goals.map(g => { const p = D.goalProgress(g, state.entries); return `<div class="measured-goal"><div class="card-head"><div><h3>${esc(monthLabel(g.month))} · ${esc(g.type)}</h3><p>Limit ${number(g.limit)} ${unit(g.type)} · baseline ${number(g.baseline)} from ${monthLabel(g.baselineMonth)}</p></div><button class="button ghost small" data-goal-remove="${esc(g.id)}">Remove</button></div><progress max="100" value="${p.percent}"></progress><p>${p.pending ? 'Waiting for your target-month bill' : p.complete ? 'Goal reached — your recorded bill is within the limit.' : number(p.percent) + '% of the planned reduction reached'}</p></div>`; }).join('')}</div></section>`;
}
function renderGoalSummary() {
  const goals=state.conservationGoals.filter(g=>g.type===state.resource);
  if(!goals.length) return '';
  return '<section class="card feature-section"><div class="eyebrow">YOUR GOALS</div><h2>Progress at a glance</h2>'+goals.slice(-3).map(g=>{
    const result=D.goalProgress(g,state.entries);
    return '<p>'+esc(monthLabel(g.month))+': '+(result.pending?'Waiting for bill':result.complete?'Goal reached':number(result.percent)+'% of reduction reached')+'</p><progress max="100" value="'+result.percent+'"></progress>';
  }).join('')+'<div class="button-row"><button class="button secondary" data-nav="ripple">Manage goals →</button></div></section>';
}
function renderAccount() {
  if (!CLOUD_MULTIUSER_VERIFIED) return `<section class="card feature-section" id="account"><div class="eyebrow">ACCOUNT & SHARING</div><h2>Local preview</h2><p class="empty">Account login and shared bill submissions are hidden until they pass a multi-account privacy and sync check.</p></section>
    <section class="card feature-section"><div class="eyebrow">YOUR DATA, YOUR CONTROL</div><h2>Backup & preferences</h2><div class="button-row"><button class="button secondary" data-extra="backup">Download backup</button><button class="button danger" data-extra="clear-local">Clear this workspace</button></div>
    <label class="field file-field"><span>Restore a Ripples JSON backup</span><input type="file" accept="application/json,.json" data-import-backup></label>
    <label class="check"><input type="checkbox" data-reduce-motion ${state.reduceMotion ? 'checked' : ''}> Reduce animations</label><p class="fineprint">Your device’s reduced-motion preference is also respected. Backups contain household information; keep them private.</p></section>`;
  const configured = C.configured && cloudAvailable;
  return `<section class="card feature-section" id="account"><div class="eyebrow">ACCOUNT & SYNC</div><h2>${cloudUser ? 'Your connected household' : 'Keep your progress with you'}</h2><p role="status" id="cloud-status">${esc(cloudStatus)}</p>
    ${!configured ? '<p class="empty">' + (C.configured ? 'Cloud setup is being checked. If it stays unavailable, confirm the SQL schema was run in the connected Supabase project. Your local data stays available.' : 'Cloud accounts are not configured yet. You can keep using the app locally and export a backup below.') + '</p>' + (cloudUser ? '<button class="button secondary" data-extra="logout">Sign out to guest workspace</button>' : '') : !cloudUser ? `<form id="auth-form"><div class="form-grid">${field('Email', '<input name="email" type="email" autocomplete="email" required maxlength="254">')}${field('Password', '<input name="password" type="password" autocomplete="current-password" minlength="12" maxlength="128" required>')}</div><div class="button-row"><button class="button primary" name="intent" value="login">Sign in</button><button class="button secondary" name="intent" value="signup">Create account</button><button class="button ghost" name="intent" value="reset" formnovalidate>Reset password</button></div></form><p class="fineprint">Account creation requires email confirmation. Signing in opens that account’s workspace; your guest data stays separate.</p>` : `<p>${esc(cloudUser.email)}</p>
    ${recoveryMode ? '<form id="password-form">' + field('New password', '<input name="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required>') + '<button class="button primary">Update password</button></form>' : ''}
    <div class="button-row"><button class="button primary" data-extra="sync" ${cloudBusy ? 'disabled' : ''}>Sync now</button><button class="button secondary" data-extra="guest-import">Copy guest data into this account</button><button class="button secondary" data-extra="logout">Sign out</button></div>
    ${cloudConflict ? '<div class="empty">Another device changed this household. Download a backup before choosing.<div class="button-row"><button class="button secondary" data-extra="use-cloud">Load cloud version</button><button class="button secondary" data-extra="use-local">Keep this device’s version</button></div></div>' : ''}
    <p class="fineprint">Your private profile, bills, goals and local challenge history sync to your account. Community sharing requires separate consent.</p><button class="button danger" data-extra="erase-cloud">Delete my cloud records</button>`}</section>
    <section class="card feature-section"><div class="eyebrow">YOUR DATA, YOUR CONTROL</div><h2>Backup & preferences</h2><div class="button-row"><button class="button secondary" data-extra="backup">Download backup</button><button class="button danger" data-extra="clear-local">Clear this workspace</button></div>
    <label class="field file-field"><span>Restore a Ripples JSON backup</span><input type="file" accept="application/json,.json" data-import-backup></label>
    <label class="check"><input type="checkbox" data-reduce-motion ${state.reduceMotion ? 'checked' : ''}> Reduce animations</label><p class="fineprint">Your device’s reduced-motion preference is also respected. Backups contain household information; keep them private.</p></section>`;
}
function refreshAccountPanel() {
  if (state.page !== 'profile') return;
  const current = document.getElementById('account');
  if (!current) return;
  const template = document.createElement('template');
  template.innerHTML = renderAccount();
  current.replaceWith(template.content.firstElementChild);
}
function countyOptions() { return (countyMap?.counties || []).map(c => `<option value="${esc(c.name)}" ${selected(c.name, state.region)}>${esc(c.name)} County</option>`).join(''); }
function renderCommunity() {
  return `<section class="card feature-section" id="real-community"><div class="eyebrow">CONSENTED COMMUNITY REPORTS</div><h2>Share a documented contribution</h2>
    <p class="muted">Share a past bill with a reviewer. Remove names, addresses and account numbers from the evidence first; keep the resource, billing dates and usage visible. A reviewer checks the bill before it enters any public summary. Household size and county remain self-reported.</p>
    ${!cloudUser ? '<p class="empty">Sign in through Profile to submit a bill for review. Nothing is shared automatically.</p>' : `<form id="community-form"><div class="form-grid">${field('Saved bill', '<select name="bill" required><option value="">Choose a bill</option>' + state.entries.map(e => `<option value="${esc(e.id)}">${esc(e.month)} · ${esc(e.type)} · ${number(e.amount)} ${unit(e.type)}</option>`).join('') + '</select>')}${field('County', '<select name="county" required>' + countyOptions() + '</select>')}${field('Redacted evidence · PDF / PNG / JPEG, up to 5 MB', '<input name="evidence" type="file" accept="application/pdf,image/png,image/jpeg" required>')}</div><label class="check"><input name="consent" type="checkbox" required> I consent to reviewer access and inclusion in anonymous county summaries. I can withdraw this submission.</label><button class="button primary">Submit for review</button></form>
    <button class="button ghost small" data-extra="my-submissions">Refresh my submissions</button>${mySubmissions.map(s => `<div class="record"><div><strong>${esc(s.month.slice(0,7))} · ${esc(s.resource)} · ${esc(s.status)}</strong><span>${esc(s.review_note)}</span></div><button class="button danger small" data-withdraw="${esc(s.id)}">Withdraw</button></div>`).join('')}`}
    <hr><h3>Reviewed county progress</h3><p class="fineprint">Only counties with at least 10 accounts with reviewed bills in both the chosen month and its preceding month appear. Rates use equal-weight household per-person daily averages. These volunteers do not represent every household. Reductions can reflect weather or occupancy as well as conservation.</p>
    <div class="button-row"><label class="field"><span>Report month</span><input type="month" value="${esc(communityMonth)}" data-community-month></label><button class="button secondary" data-extra="community-refresh" ${C.configured ? '' : 'disabled'}>Load ${state.resource} report</button></div>
    ${communityError ? `<p class="notice">${esc(communityError)}</p>` : ''}
    ${communityRows.length ? `<div class="table-scroll"><table><thead><tr><th>County</th><th>Accounts</th><th>${unit()}/person/day</th><th>Reduction</th></tr></thead><tbody>${communityRows.map(r => `<tr><td>${esc(r.county)}</td><td>${esc(r.participant_band)}</td><td>${number(r.daily_per_person,1)}</td><td>${r.reduction_percent == null ? 'Undefined (zero baseline)' : number(r.reduction_percent,1) + '%'}</td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">No reviewed county report loaded. Missing or suppressed data is not zero use.</p>'}</section>`;
}
function renderLiveChallenges() {
  return `<section class="card feature-section"><div class="eyebrow">TOGETHER, THIS WEEK</div><h2>Community challenges</h2><p class="muted">Shared weeks run Monday–Sunday, UTC. Check-ins are self-reported actions. Joining consents to anonymous county participation totals; leaving removes your current-week contribution.</p>
    ${!cloudUser ? '<p class="empty">Sign in to join a shared challenge. The personal seven-day challenges above work offline.</p>' : `<label class="field"><span>County when joining</span><select id="challenge-county">${countyOptions()}</select></label><div class="grid two">${CHALLENGES.map(c => { const run = communityRuns.find(r => r.challenge === c.id); return `<article class="measured-goal"><h3>${esc(c.title)}</h3><p>${esc(c.action)}</p><p>${run ? run.checkins.length + ' / 7 days · ' + esc(run.county) + ' County' : 'Not joined this week'}</p><div class="button-row">${run ? `<button class="button primary" data-live-challenge="${c.id}" data-operation="${run.checkins.includes(run.server_day) ? 'undo' : 'checkin'}">${run.checkins.includes(run.server_day) ? 'Undo today' : 'Check in today'}</button><button class="button ghost" data-live-challenge="${c.id}" data-operation="leave">Leave</button>` : `<button class="button primary" data-live-challenge="${c.id}" data-operation="join">Join this week</button>`}</div></article>`; }).join('')}</div>`}
    <button class="button secondary" data-extra="refresh-challenges" ${C.configured ? '' : 'disabled'}>Refresh community progress</button>
    ${communityRanks.length ? communityRanks.map(r => `<p>${esc(r.county)} · ${esc(CHALLENGES.find(c => c.id === r.challenge)?.title || r.challenge)}: ${number(r.percent,1)}% of weekly check-ins, ${esc(r.participant_band)} accounts</p>`).join('') : '<p class="fineprint">County participation is shown only after at least 10 accounts join the same challenge. No live totals loaded.</p>'}</section>`;
}
function renderEnvironment() {
  const r = environmentData;
  return `<section class="card feature-section"><div class="eyebrow">OFFICIAL ENVIRONMENTAL CONTEXT</div><h2>Utah beyond your household</h2>
    ${r ? `<p class="muted">U.S. Drought Monitor · observation ${esc(r.date)} · ${esc(r.mode)}</p><div class="grid three">${[['D1','Moderate drought or worse'],['D2','Severe drought or worse'],['D3','Extreme drought or worse']].map(([key,label]) => `<div class="forecast-stat"><span>${label}</span><strong>${number(r[key],1)}%</strong><small>of Utah land area</small></div>`).join('')}</div><p class="fineprint">Categories are cumulative and overlap; do not add them. Land-area drought is environmental context, not household consumption. Retrieved ${esc(r.retrievedAt)}.</p>` : '<p class="empty">Load the latest official drought report.</p>'}
    ${environmentError ? `<p class="notice">${esc(environmentError)}</p>` : ''}<button class="button secondary" data-extra="environment">Refresh official data</button>
    <div class="source-grid"><a target="_blank" rel="noopener noreferrer" href="https://droughtmonitor.unl.edu/CurrentMap/StateDroughtMonitor.aspx?UT">U.S. Drought Monitor · weekly area statistics ↗</a><a target="_blank" rel="noopener noreferrer" href="https://water.utah.gov/reservoirlevels/">Utah reservoir storage · official live dashboard ↗</a><a target="_blank" rel="noopener noreferrer" href="https://www.nrcs.usda.gov/wps/portal/wcc/home/quicklinks/states/utah/">NRCS Utah snowpack & water supply ↗</a><a target="_blank" rel="noopener noreferrer" href="${EIA_SOURCE}">EIA residential electricity · 2024 reference ↗</a></div></section>`;
}

function payload() {
  return { profile: state.profile, entries: state.entries, actionGoals: state.actionGoals, challengeRuns: state.challengeRuns, conservationGoals: state.conservationGoals, reduceMotion: state.reduceMotion };
}
function updateCloudStatus(text) {
  cloudStatus = text;
  document.getElementById('cloud-status')?.replaceChildren(document.createTextNode(text));
  const badge = document.getElementById('storage-badge'); if (badge) badge.textContent = cloudUser ? text : 'Local · saved in this browser';
}
function persistSyncMeta() {
  if (cloudUser) localStorage.setItem(STORAGE_KEY + ':sync', JSON.stringify({ revision: cloudRevision, dirty: cloudDirty }));
}
function queueSync() {
  if (!cloudUser) return;
  cloudDirty = true; persistSyncMeta(); updateCloudStatus('Saved here · waiting to sync');
  if (!cloudReady) return;
  clearTimeout(syncTimer); syncTimer = setTimeout(() => syncCloud().catch(() => {}), 900);
}
async function syncCloud() {
  if (!cloudUser || !cloudReady || cloudBusy || cloudConflict) return;
  cloudBusy = true; const generation = syncGeneration;
  try {
    if (!cloudDirty) {
      const remote = await (cloudRequest = C.pull());
      if (generation !== syncGeneration) return;
      if (remote && remote.revision > cloudRevision) {
        if (cloudDirty) { cloudConflict = true; updateCloudStatus('Sync paused · choose which version to keep'); renderShell(); return; }
        state = loadState({ ...remote.payload, page: state.page, resource: state.resource, region: state.region });
        cloudRevision = remote.revision; saveState(false); persistSyncMeta();
        renderShell(); if (state.page === 'ripple') updateSimulation();
      }
    } else {
      const sent = JSON.stringify(payload());
      const revision = await (cloudRequest = C.push(JSON.parse(sent), cloudRevision));
      if (generation !== syncGeneration) return;
      cloudRevision = revision; cloudDirty = JSON.stringify(payload()) !== sent; persistSyncMeta();
    }
    updateCloudStatus(cloudDirty ? 'New changes waiting to sync' : 'Cloud up to date');
  } catch (e) {
    if (generation !== syncGeneration) return;
    cloudConflict = e.message.includes('SYNC_CONFLICT');
    updateCloudStatus(cloudConflict ? 'Sync conflict · open Profile to choose a version' : 'Saved here · sync failed: ' + e.message);
    if (cloudConflict && state.page === 'profile') renderShell();
  } finally {
    if (generation === syncGeneration) { cloudBusy = false; if (cloudDirty && !cloudConflict) { clearTimeout(syncTimer); syncTimer = setTimeout(() => syncCloud(), 30000); } }
  }
}
async function acceptSession(event, session) {
  if (event === 'PASSWORD_RECOVERY') recoveryMode = true;
  const user = session?.user || null;
  if (cloudUser?.id === user?.id && cloudReady) { if (recoveryMode) { state.page='profile'; renderShell(); } return; }
  if (!user && !cloudUser) return;
  syncGeneration++; const generation = syncGeneration; clearTimeout(syncTimer);
  cloudReady = false; cloudBusy = false; cloudConflict = false; cloudUser = user; cloudRevision = 0; cloudDirty = false;
  mySubmissions = []; communityRuns = [];
  STORAGE_KEY = user ? GUEST_STORAGE_KEY + ':' + user.id : GUEST_STORAGE_KEY;
  state = loadState(); state.page = 'profile'; editingId = null; importDraft = null;
  if (!user) { cloudReady = true; updateCloudStatus('Local only'); renderShell(); return; }
  try {
    const meta = JSON.parse(localStorage.getItem(STORAGE_KEY + ':sync') || '{}');
    cloudRevision = Number.isSafeInteger(meta.revision) ? meta.revision : 0; cloudDirty = meta.dirty === true;
    const remote = await C.pull(); if (generation !== syncGeneration) return;
    if (remote) {
      if (cloudDirty && remote.revision !== cloudRevision) cloudConflict = true;
      else if (!cloudDirty) { state = loadState({ ...remote.payload, page: 'profile' }); cloudRevision = remote.revision; saveState(false); }
    } else if (cloudRevision > 0) { cloudConflict = true; }
    cloudReady = true; persistSyncMeta(); updateCloudStatus(cloudConflict ? 'Sync paused · review versions below' : 'Account connected');
  } catch (e) { updateCloudStatus('Cloud unavailable: ' + e.message + '. Sign out and retry; local account data is safe.'); }
  renderShell();
}
async function loadEnvironment() {
  environmentError = '';
  try {
    const response = await fetch('/api/drought', { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Official service unavailable');
    environmentData = await response.json();
  } catch (e) {
    environmentError = 'Live refresh unavailable. ' + e.message;
    if (!environmentData) {
      try { const response = await fetch('./environment-snapshot.json'); if (response.ok) environmentData = { ...await response.json(), mode: 'Saved official snapshot · not live' }; } catch {}
    }
  }
  if (state.page === 'map') renderShell();
}

async function handleExtra(action) {
  if (action === 'template') return downloadFile('ripples-bills-template.csv', 'type,month,days,quantity,unit,cost\r\nwater,2026-01,31,4.5,kgal,\r\nelectricity,2026-01,31,650,kWh,\r\n', 'text/csv');
  if (action === 'export-csv') return downloadFile('ripples-bills.csv', D.csv(state.entries), 'text/csv');
  if (action === 'backup') return downloadFile('ripples-backup-' + todayLocal() + '.json', JSON.stringify({ app:'Ripples', version:1, exportedAt:new Date().toISOString(), state:payload() },null,2));
  if (action === 'import-cancel') importDraft = null;
  if (action === 'import-confirm' && importDraft) {
    const replace = document.getElementById('import-policy').value === 'replace';
    if (replace && !confirm('Replace matching saved bills with the imported values?')) return;
    const merged = D.mergeBills(state.entries,importDraft,replace); state.entries = merged.entries; importDraft = null;
    notice = `${merged.added} added, ${merged.replaced} replaced, ${merged.skipped} skipped.`; saveState();
  }
  if (action === 'sync') { await syncCloud(); return; }
  if (action === 'logout') { await C.logout(); await acceptSession('SIGNED_OUT',null); return; }
  if (action === 'guest-import') {
    if (!confirm('Replace this account workspace with a copy of the guest workspace? Export a backup first if needed.')) return;
    state = loadState(JSON.parse(localStorage.getItem(GUEST_STORAGE_KEY) || '{}')); state.page = 'profile'; saveState();
  }
  if (action === 'use-cloud' || action === 'use-local') {
    if (!confirm(action === 'use-cloud' ? 'Replace this workspace with the cloud version? Download a backup first.' : 'Replace the cloud version with this workspace? Other devices will receive these changes.')) return;
    const remote = await C.pull(); cloudRevision = remote?.revision || 0; cloudConflict = false;
    if (action === 'use-cloud') { state = loadState({ ...(remote?.payload || {}), page:'profile' }); cloudDirty=false; saveState(false); persistSyncMeta(); }
    else { cloudDirty=true; persistSyncMeta(); await syncCloud(); }
  }
  if (action === 'clear-local') {
    if (!confirm(cloudUser ? 'Clear this account workspace and sync the empty workspace to the cloud? Community submissions stay separate.' : 'Delete the guest data in this browser?')) return;
    state=structuredClone(DEFAULT_STATE); state.page='profile'; saveState();
  }
  if (action === 'erase-cloud') {
    if (!confirm('Delete private cloud records, challenge contributions and submitted bills? Your sign-in account will remain. Export a backup first.')) return;
    syncGeneration++; clearTimeout(syncTimer); cloudReady=false;
    try {
      await cloudRequest.catch(() => {});
      await C.erase(); localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(STORAGE_KEY + ':sync');
      cloudRevision=0; cloudDirty=false; cloudConflict=false; mySubmissions=[]; communityRuns=[];
      state=structuredClone(DEFAULT_STATE); state.page='profile'; saveState(false); updateCloudStatus('Cloud records deleted');
    } finally { cloudReady=true; cloudBusy=false; }
  }
  if (action === 'my-submissions') mySubmissions = await C.submissions();
  if (action === 'community-refresh') {
    communityRows=[]; communityError='';
    const requestedMonth=communityMonth,requestedResource=state.resource;
    try { const rows = await C.aggregate(requestedMonth,requestedResource); if(requestedMonth===communityMonth&&requestedResource===state.resource) communityRows=rows; }
    catch(e) { communityError=e.message; }
  }
  if (action === 'refresh-challenges') { communityRanks = await C.challengeStats(); if(cloudUser) communityRuns=await C.challengeMine(); }
  if (action === 'environment') { await loadEnvironment(); return; }
  renderShell(); if(state.page==='ripple') updateSimulation();
}
function installFeatures() {
  const chartTip = event => {
    const point=event.target.closest?.('[data-chart-tip]'); if(!point) return;
    const output=point.closest('svg')?.nextElementSibling; if(output?.matches('.chart-tooltip')) output.textContent=point.dataset.chartTip;
  };
  for(const name of ['pointerover','focusin','click']) app.addEventListener(name,chartTip);
  app.addEventListener('click',event=>{const button=event.target.closest('[data-chart-style]');if(button){state.chartStyle=button.dataset.chartStyle;saveState();renderShell();app.querySelector('[data-chart-style="'+state.chartStyle+'"]').focus();}});
  app.addEventListener('click', async event => {
    const button=event.target.closest('[data-extra],[data-goal-remove],[data-withdraw],[data-live-challenge]'); if(!button) return;
    button.disabled=true;
    try {
      if (button.dataset.extra) await handleExtra(button.dataset.extra);
      if (button.dataset.goalRemove) { state.conservationGoals=state.conservationGoals.filter(g=>g.id!==button.dataset.goalRemove); saveState(); renderShell(); updateSimulation(); }
      if (button.dataset.withdraw) { const s=mySubmissions.find(s=>s.id===button.dataset.withdraw); if(s && confirm('Withdraw this report and delete its evidence?')) { await C.withdraw(s.id,s.evidence_path); mySubmissions=await C.submissions(); renderShell(); } }
      if (button.dataset.liveChallenge) {
        await C.communityChallenge(button.dataset.liveChallenge,document.getElementById('challenge-county').value,button.dataset.operation);
        communityRuns=await C.challengeMine(); communityRanks=await C.challengeStats(); renderShell(); updateSimulation();
      }
    } catch(e) { showValidationNotice(e.message); } finally { button.disabled=false; }
  });
  app.addEventListener('change', async event => {
    const el=event.target;
    try {
      if(el.matches('[data-import-csv]')) {
        const file=el.files[0]; if(!file) return; if(file.size>2e6) throw new Error('Choose a CSV under 2 MB.');
        importDraft=D.parseCSV(await file.text()); renderShell(); document.querySelector('.import-review')?.scrollIntoView({behavior:scrollBehavior()});
      }
      if(el.matches('[data-import-backup]')) {
        const file=el.files[0]; if(!file) return; if(file.size>2e6) throw new Error('Backup is too large.');
        const backup=JSON.parse(await file.text());
        if(backup.app!=='Ripples'||backup.version!==1||!Array.isArray(backup.state?.entries)||backup.state.entries.length>1000) throw new Error('Not a supported Ripples backup.');
        const validated=backup.state.entries.map(e=>D.bill(e,e.id));
        if(new Set(validated.map(e=>e.type+e.month)).size!==validated.length) throw new Error('Backup contains duplicate bills.');
        if(confirm('Replace this workspace with the backup? Export current data first if needed.')) { state=loadState({...backup.state,entries:validated,page:'profile'}); saveState(); notice='Backup restored.'; renderShell(); }
      }
      if(el.matches('[data-reduce-motion]')) { state.reduceMotion=el.checked; saveState(); renderShell(); }
      if(el.matches('[data-community-month]')) { communityMonth=el.value; communityRows=[]; }
    } catch(e) { importDraft=null; showValidationNotice(e.message); }
  });
  app.addEventListener('submit', async event => {
    const form=event.target;
    if(!['auth-form','password-form','conservation-goal-form','community-form'].includes(form.id)) return;
    event.preventDefault(); const data=new FormData(form), button=event.submitter; if(button) button.disabled=true;
    try {
      if(form.id==='auth-form') {
        const intent=button?.value || 'login', email=String(data.get('email')).trim(), password=String(data.get('password'));
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
        if(intent==='reset') { await C.reset(email); showValidationNotice('If an account matches, a password reset email will arrive.'); }
        else { const result=await C[intent](email,password); if(result.session) await acceptSession('SIGNED_IN',result.session); else showValidationNotice('Check your email to confirm the account, then sign in.'); }
      }
      if(form.id==='password-form') { await C.password(String(data.get('password'))); recoveryMode=false; notice='Password updated.'; renderShell(); }
      if(form.id==='conservation-goal-form') {
        const type=data.get('type'), latest=latestAndPrevious(type).latest, month=String(data.get('month')), reduction=Number(data.get('reduction'));
        if(!latest || latest.amount<=0) throw new Error('Add a nonzero bill for this resource before setting a reduction goal.');
        const baseline=monthlyEquivalent(latest), amount=data.get('mode')==='percent'?baseline*reduction/100:reduction;
        if(!Number.isFinite(amount)||amount<=0||amount>baseline||!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||month<=latest.month) throw new Error('Choose a later month and a reduction greater than zero, up to the baseline.');
        if(state.conservationGoals.some(g=>g.type===type&&g.month===month)) throw new Error('A goal for this resource/month already exists. Remove it before replacing.');
        state.conservationGoals.push({id:crypto.randomUUID(),type,month,baseline,limit:baseline-amount,baselineMonth:latest.month}); saveState(); renderShell(); updateSimulation();
      }
      if(form.id==='community-form') {
        const b=state.entries.find(e=>e.id===data.get('bill')); if(!b||!data.has('consent')) throw new Error('Choose a saved bill and consent before submitting.');
        await C.submit({...b,residents:state.profile.residents,county:data.get('county'),consent:true},data.get('evidence'),cloudUser.id);
        mySubmissions=await C.submissions(); notice='Submitted for review. It is not verified yet.'; renderShell();
      }
    } catch(e) { showValidationNotice(e.message); } finally { if(button) button.disabled=false; }
  });
  window.addEventListener('online',()=>syncCloud());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncCloud();});
  window.addEventListener('storage',event=>{ if(event.key===STORAGE_KEY && event.newValue) { if(cloudDirty||cloudBusy) { cloudConflict=true; updateCloudStatus('Another tab changed this workspace. Review in Profile.'); } else { state=loadState(); renderShell(); if(state.page==='ripple')updateSimulation(); } } });
  setInterval(()=>{if(!document.hidden)syncCloud();},30000);
  if (CLOUD_MULTIUSER_VERIFIED) C.init(acceptSession).then(async session=>{
    if (!C.configured) return;
    await C.challengeStats(); // Public aggregate RPC doubles as a safe schema readiness check.
    cloudAvailable=true; updateCloudStatus(session?'Account connected':'Cloud ready · sign in through Profile');
    if(session) await acceptSession('INITIAL_SESSION',session); else refreshAccountPanel();
  }).catch(e=>{cloudAvailable=false;updateCloudStatus('Cloud setup unavailable: '+e.message);refreshAccountPanel();});
}
