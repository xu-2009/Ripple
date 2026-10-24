/* Pure calculations and import validation. No network or storage side effects. */
(function (root) {
  const factors = { gal: 1, kgal: 1000, ccf: 748.052, kWh: 1 };
  const monthIndex = m => Number(m.slice(0, 4)) * 12 + Number(m.slice(5)) - 1;
  const monthName = n => String(Math.floor(n / 12)).padStart(4, '0') + '-' + String(n % 12 + 1).padStart(2, '0');
  function bill(raw, id) {
    const type = String(raw.type || '').trim().toLowerCase();
    const month = String(raw.month || '').trim();
    let unit = String(raw.unit || '').trim();
    unit = unit.toLowerCase() === 'kwh' ? 'kWh' : unit.toLowerCase();
    const quantity = Number(raw.quantity), days = Number(raw.days);
    const cost = raw.cost == null || String(raw.cost).trim() === '' ? null : Number(raw.cost);
    if (!['water', 'electricity'].includes(type) || !/^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(month) ||
        String(raw.quantity ?? '').trim() === '' || !Number.isFinite(quantity) || quantity < 0 || quantity > 1e8 ||
        !Number.isInteger(days) || days < 1 || days > 366 ||
        (type === 'water' ? !['gal', 'kgal', 'ccf'].includes(unit) : unit !== 'kWh') ||
        (cost !== null && (!Number.isFinite(cost) || cost < 0 || cost > 1e6))) throw new Error('Invalid bill: check resource, YYYY-MM month, days, quantity, unit and cost.');
    return { id: id || crypto.randomUUID(), type, month, days, quantity, unit, cost, amount: quantity * factors[unit] };
  }
  function parseCSV(text) {
    if (text.length > 2e6) throw new Error('CSV must be smaller than 2 MB.');
    text = text.replace(/^\uFEFF/, '');
    const rows = []; let row = [], cell = '', quoted = false, closed = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') { quoted = false; closed = true; }
        else cell += c;
      } else if (c === '"' && !cell && !closed) quoted = true;
      else if (c === ',' || c === '\n' || c === '\r') {
        row.push(cell); cell = ''; closed = false;
        if (c !== ',') { if (row.some(v => v.trim())) rows.push(row); row = []; if (c === '\r' && text[i + 1] === '\n') i++; }
      } else { if (closed || c === '"') throw new Error('Malformed CSV quoting.'); cell += c; }
    }
    if (quoted) throw new Error('Unclosed CSV quote.');
    row.push(cell); if (row.some(v => v.trim())) rows.push(row);
    if (rows.length < 2 || rows.length > 601) throw new Error('Import 1–600 bills at a time.');
    const headers = rows.shift().map(h => h.trim().toLowerCase());
    if (new Set(headers).size !== headers.length || ['type', 'month', 'days', 'quantity', 'unit'].some(h => !headers.includes(h))) throw new Error('Required columns: type,month,days,quantity,unit,cost (cost optional).');
    const keys = new Set();
    return rows.map((values, i) => {
      try {
        if (values.length !== headers.length) throw new Error('Column count does not match header.');
        const b = bill(Object.fromEntries(headers.map((h, j) => [h, values[j]])));
        const key = b.type + b.month;
        if (keys.has(key)) throw new Error('Duplicate resource/month in this file.');
        keys.add(key); return b;
      } catch (e) { throw new Error('Row ' + (i + 2) + ': ' + e.message); }
    });
  }
  function csv(entries) {
    return 'type,month,days,quantity,unit,cost\r\n' + entries.map(e => [e.type, e.month, e.days, e.quantity, e.unit, e.cost ?? ''].join(',')).join('\r\n');
  }
  function mergeBills(existing, incoming, replace) {
    const result = new Map(existing.map(e => [e.type + e.month, e]));
    let added = 0, replaced = 0, skipped = 0;
    for (const raw of incoming) {
      const e = bill(raw, raw.id), key = e.type + e.month, old = result.get(key);
      if (old && !replace) { skipped++; continue; }
      if (old) { e.id = old.id; replaced++; } else added++;
      result.set(key, e);
    }
    return { entries: [...result.values()], added, replaced, skipped };
  }
  const mean = a => a.reduce((s, n) => s + n, 0) / a.length;
  function predict(values, model, step = 1) {
    if (model === 'seasonal') return values[values.length - 12 + (step - 1) % 12];
    const a = values.slice(- (model === 'mean3' ? 3 : 6));
    if (model !== 'trend') return mean(a);
    const xbar = (a.length - 1) / 2, ybar = mean(a);
    const slope = a.reduce((s, v, i) => s + (i - xbar) * (v - ybar), 0) / a.reduce((s, _, i) => s + (i - xbar) ** 2, 0);
    return Math.max(0, ybar + slope * (a.length - 1 + step - xbar));
  }
  function forecast(entries, type) {
    const sorted = entries.filter(e => e.type === type).sort((a, b) => a.month.localeCompare(b.month));
    // Only the latest contiguous sequence is used; a missing month is never a zero.
    let start = sorted.length - 1;
    while (start > 0 && monthIndex(sorted[start].month) - monthIndex(sorted[start - 1].month) === 1) start--;
    const run = sorted.slice(Math.max(0, start));
    if (run.length < 6) return { ready: false, count: run.length, reason: 'Add at least 6 consecutive monthly bills for this resource. Missing months are not estimated.' };
    const values = run.map(e => e.amount / e.days);
    const models = ['mean3', 'mean6', 'trend'];
    if (values.length >= 24) models.push('seasonal');
    const first = models.includes('seasonal') ? Math.max(12, values.length - 6) : Math.max(3, values.length - 6);
    // Rolling-origin validation: each candidate sees only bills before its held-out month.
    const candidates = models.map(model => {
      const errors = values.slice(first).map((v, i) => v - predict(values.slice(0, first + i), model));
      return { model, errors, mae: mean(errors.map(Math.abs)) };
    }).sort((a, b) => a.mae - b.mae);
    const best = candidates[0], spread = Math.max(...best.errors.map(Math.abs));
    const last = monthIndex(run.at(-1).month);
    const points = [1, 2, 3].map(step => {
      const daily = predict(values, best.model, step), uncertainty = spread * Math.sqrt(step);
      return { month: monthName(last + step), amount: daily * 30.44, low: Math.max(0, daily - uncertainty) * 30.44, high: (daily + uncertainty) * 30.44 };
    });
    return { ready: true, count: run.length, model: best.model, mae: best.mae, validationMonths: best.errors.length, points };
  }
  function validGoal(g) {
    return g && typeof g.id === 'string' && ['water', 'electricity'].includes(g.type) &&
      /^\d{4}-(0[1-9]|1[0-2])$/.test(g.month) && Number.isFinite(g.baseline) && g.baseline > 0 &&
      Number.isFinite(g.limit) && g.limit >= 0 && g.limit < g.baseline && typeof g.baselineMonth === 'string';
  }
  function goalProgress(goal, entries) {
    const current = entries.find(e => e.type === goal.type && e.month === goal.month);
    if (!current) return { pending: true, percent: 0 };
    const equivalent = current.amount / current.days * 30.44;
    return { pending: false, equivalent, percent: Math.max(0, Math.min(100, (goal.baseline - equivalent) / (goal.baseline - goal.limit) * 100)), complete: equivalent <= goal.limit };
  }
  root.RipplesData = { bill, parseCSV, csv, mergeBills, forecast, validGoal, goalProgress, monthIndex, monthName };
})(globalThis);
