const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = process.env.RIPPLES_URL || 'http://127.0.0.1:5178/';
const KEY = 'ripples-demo-v1';
const results = [];
let browser;
const profile = { residents: 4, home: 'house', city: 'Provo', lawn: true, irrigation: true, waterGoal: '6000', electricGoal: '900' };
const entry = (month, amount, days = 30, type = 'water') => ({ id: type + month, month, amount, days, type, quantity: amount, unit: type === 'water' ? 'gal' : 'kWh', cost: null });
const saved = p => p.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
const nav = (p, name) => p.locator('.nav-list [data-nav="' + name + '"]').click();
async function setup(p, data) {
  await p.goto(BASE);
  if (data !== undefined) {
    await p.evaluate(({key, data}) => localStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data)), {key: KEY, data});
    await p.reload();
  }
}
async function bill(p, { month = '2026-01', days = 30, quantity = 3, unit = 'kgal', cost = '' } = {}) {
  await p.locator('[name="month"]').fill(month);
  await p.locator('[name="days"]').fill(String(days));
  await p.locator('[name="quantity"]').fill(String(quantity));
  if (await p.locator('select[name="unit"]').count()) await p.locator('select[name="unit"]').selectOption(unit);
  await p.locator('[name="cost"]').fill(String(cost));
  await p.locator('#entry-form [type="submit"]').click();
}
async function openHistory(p) {
  const actions=p.locator('.usage-history .record-actions').first();
  if (!(await actions.isVisible().catch(()=>false))) await p.locator('.usage-history summary').click();
}
async function test(name, action, opts = {}) {
  const context = await browser.newContext({ viewport: { width: 393, height: 852 }, ...opts });
  const p = await context.newPage();
  p.setDefaultTimeout(4000);
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  try { await action(p, context); assert.deepEqual(errors, [], 'No uncaught browser errors'); results.push({name, status:'PASS'}); }
  catch (e) { results.push({name, status:'FAIL', error:e.message}); }
  finally { await context.close(); }
  console.log(results.at(-1).status + ' ' + name + (results.at(-1).error ? ': ' + results.at(-1).error.split('\n')[0] : ''));
}
(async () => {
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox'] });
  await test('Empty state and all five navigation destinations', async p => {
    await setup(p);
    for (const page of ['usage','map','ripple','profile','home']) { await nav(p,page); assert.equal(await p.locator('h1').count(),1); }
    assert.match(await p.locator('body').innerText(), /Add a bill to begin/);
    assert.match(await p.locator('.hero-tank').getAttribute('style'), /--tank-level:50\.00%/);
    assert.equal(await p.locator('.tank-readout').count(), 0);
  });
  await test('Optional 12-month sample loads only into an empty bill store and is labeled fictional', async p => {
    await setup(p); await nav(p,'usage');
    assert.equal(await p.locator('[data-load-sample]').count(),1);
    await p.locator('[data-load-sample]').click();
    let data=await saved(p);
    assert.equal(data.entries.length,24);
    assert.equal(new Set(data.entries.map(e=>e.month)).size,12);
    assert.equal(data.profile.residents,1);
    assert.match(await p.locator('.sample-data-notice').innerText(),/FICTIONAL SAMPLE BILLS/);
    await p.reload(); await nav(p,'usage');
    assert.equal(await p.locator('[data-load-sample]').count(),0);
    assert.equal(await p.locator('.sample-data-notice').count(),1);
    await p.locator('.usage-history summary').click();
    assert.equal(await p.locator('.usage-history [data-edit]').count(),12);
    await p.locator('[data-resource="electricity"]').click();
    assert.equal(await p.locator('.usage-history [data-edit]').count(),12);
  });
  await test('Profile edits persist and affect per-person values', async p => {
    await setup(p, {entries:[entry('2026-01',6000)]}); await nav(p,'profile');
    await p.locator('[name="residents"]').fill('4'); await p.locator('[name="home"]').selectOption('house');
    await p.locator('[name="city"]').fill('Provo'); await p.locator('[name="lawn"]').check();
    await p.locator('[name="irrigation"]').check(); await p.locator('[name="waterGoal"]').fill('6000');
    await p.locator('#profile-form [type="submit"]').click(); await p.reload();
    assert.equal((await saved(p)).profile.residents,4); assert.equal(await p.locator('[name="city"]').inputValue(),'Provo');
    await nav(p,'home'); assert.match(await p.locator('body').innerText(), /50 gal/); assert.match(await p.locator('.hero-tank').getAttribute('style'), /--tank-level:100\.00%/);
    await nav(p,'profile'); await p.locator('[name="residents"]').fill('2'); await p.locator('#profile-form [type="submit"]').click();
    await nav(p,'home'); assert.match(await p.locator('body').innerText(), /100 gal/);
  });
  await test('Water bill add, unit conversions, cost, edit, cancel and reload', async p => {
    await setup(p); await nav(p,'usage'); await bill(p,{cost:42.75});
    let e=(await saved(p)).entries[0]; assert.equal(e.amount,3000); assert.equal(e.cost,42.75);
    await openHistory(p); await p.locator('[data-edit]').click(); await bill(p,{quantity:2,unit:'ccf',cost:30});
    e=(await saved(p)).entries[0]; assert.equal(e.amount,1496.104); assert.equal(e.quantity,2);
    await openHistory(p); await p.locator('[data-edit]').click(); await p.locator('[name="quantity"]').fill('999'); await p.locator('[data-cancel-edit]').click();
    assert.equal((await saved(p)).entries[0].amount,1496.104);
    await p.reload(); await openHistory(p); await p.locator('[data-edit]').click(); assert.equal(await p.locator('[name="quantity"]').inputValue(),'2'); assert.equal(await p.locator('[name="unit"]').inputValue(),'ccf');
  });
  await test('Duplicate same-type month asks before replace; types are independent', async p => {
    await setup(p); await nav(p,'usage'); await bill(p);
    p.once('dialog',d=>d.dismiss()); await bill(p,{quantity:9}); assert.equal((await saved(p)).entries[0].amount,3000);
    p.once('dialog',d=>d.accept()); await bill(p,{quantity:6}); assert.equal((await saved(p)).entries.length,1); assert.equal((await saved(p)).entries[0].amount,6000);
    await p.locator('[data-resource="electricity"]').click(); await bill(p,{quantity:700}); assert.equal((await saved(p)).entries.length,2);
  });
  await test('Changing a bill month into another month confirms replacement', async p => {
    await setup(p,{entries:[entry('2026-01',3000),entry('2026-02',4000)]}); await nav(p,'usage');
    await openHistory(p); await p.locator('[data-edit="water2026-01"]').click();
    p.once('dialog',d=>d.dismiss()); await bill(p,{month:'2026-02',quantity:5000,unit:'gal'}); assert.equal((await saved(p)).entries.length,2);
    p.once('dialog',d=>d.accept()); await bill(p,{month:'2026-02',quantity:5000,unit:'gal'}); const list=(await saved(p)).entries; assert.equal(list.length,1); assert.equal(list[0].amount,5000);
  });
  await test('Delete cancellation, confirmation and persisted deletion', async p => {
    await setup(p,{entries:[entry('2026-01',3000)]}); await nav(p,'usage');
    await openHistory(p); p.once('dialog',d=>d.dismiss()); await p.locator('[data-delete]').click(); assert.equal((await saved(p)).entries.length,1);
    p.once('dialog',d=>d.accept()); await p.locator('[data-delete]').click(); await p.reload(); assert.equal((await saved(p)).entries.length,0); assert.equal(await p.locator('[data-delete]').count(),0);
  });
  await test('Validation blocks negative usage, fractional days and zero residents', async p => {
    await setup(p); await nav(p,'usage');
    for (const values of [{quantity:-1,days:30},{quantity:1,days:0},{quantity:1,days:1.5}]) {
      await bill(p,values); assert.equal((await saved(p)).entries.length,0);
    }
    await nav(p,'profile'); await p.locator('[name="residents"]').fill('0'); await p.locator('#profile-form [type="submit"]').click(); assert.equal((await saved(p)).profile.residents,1);
  });
  await test('Zero-use bill accepted; zero baseline never gives Infinity', async p => {
    await setup(p); await nav(p,'usage'); await bill(p,{quantity:0,unit:'gal'}); assert.equal((await saved(p)).entries.length,1);
    await bill(p,{month:'2026-02',quantity:100,unit:'gal'}); await nav(p,'home'); const text=await p.locator('body').innerText(); assert.doesNotMatch(text,/Infinity|NaN|∞/); assert.match(text,/zero/i);
  });
  await test('Zero bills persist, edit as zero and give zero change against zero',async p=>{
    await setup(p,{profile,entries:[entry('2026-01',0),entry('2026-02',0)]});
    assert.match(await p.locator('body').innerText(),/0%/); assert.equal(await p.locator('.liquid').isVisible(),false);
    await nav(p,'usage'); await openHistory(p); await p.locator('[data-edit]').first().click(); assert.equal(await p.locator('[name="quantity"]').inputValue(),'0');
    await p.reload(); assert.equal((await saved(p)).entries.length,2);
  });
  await test('Application validation rejects blank usage and preserves draft',async p=>{
    await setup(p); await nav(p,'usage'); await p.locator('[name="cost"]').fill('12');
    await p.locator('#entry-form').evaluate(form=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
    assert.equal((await saved(p)).entries.length,0); assert.equal(await p.locator('[name="cost"]').inputValue(),'12'); assert.match(await p.locator('[role="status"]').innerText(),/Check the bill/);
  });
  await test('Monthly water goal normalizes a 60-day bill to the tank scale',async p=>{
    await setup(p,{profile:{...profile,waterGoal:'3044'},entries:[entry('2026-01',6000,60)]});
    assert.equal(await p.evaluate(()=>monthlyEquivalent(state.entries[0])), 3044);
    assert.match(await p.locator('.hero-tank').getAttribute('style'), /--tank-level:100\.00%/);
  });
  await test('Different billing lengths, daily change and chronological sorting', async p => {
    await setup(p,{profile, entries:[entry('2026-03',3600,30),entry('2026-01',3000,30),entry('2026-02',3100,31)]});
    assert.match(await p.locator('body').innerText(), /\+20%/); assert.match(await p.locator('body').innerText(), /30 gal/);
    await nav(p,'usage'); await openHistory(p); assert.match(await p.locator('.record').first().innerText(), /Mar 2026/);
  });
  await test('Electricity comparison uses billing days and sourced 774 kWh reference', async p => {
    await setup(p,{resource:'electricity',entries:[entry('2026-01',774*30/30.44,30,'electricity')]});
    assert.match(await p.locator('body').innerText(), /0%/); assert.equal(await p.locator('.compare-bars .bar-row').count(),2);
    assert.match(await p.locator('.source').innerText(), /2024|774/); assert.equal(await p.locator('.source a').getAttribute('href'),'https://www.eia.gov/electricity/sales_revenue_price/pdf/table_5A.pdf');
    assert.match(await p.locator('.source').innerText(), /not matched by household size/);
  });
  await test('Annual graph available at 12 months and weighted by recorded days', async p => {
    const entries=Array.from({length:12},(_,i)=>entry('2025-'+String(i+1).padStart(2,'0'), i===11?6200:3000,i===11?31:30));
    await setup(p,{entries}); await nav(p,'usage'); await p.locator('[data-span="annual"]').click();
    assert.match(await p.locator('.chart title').last().textContent(), /108\.6/); await p.reload(); assert.equal(await p.locator('[data-span="annual"]').getAttribute('class'),'selected');
  });
  await test('Long phone history keeps readable ticks and all values accessible',async p=>{
    const entries=Array.from({length:24},(_,i)=>entry(`${2024+Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}`,3000+i*100));
    await setup(p,{entries}); await nav(p,'usage');
    assert.ok(await p.locator('.chart text').count()<=6); await p.locator('.chart-values summary').click(); assert.equal(await p.locator('.chart-values tbody tr').count(),24);
    assert.match(await p.locator('.chart-values tbody tr').last().innerText(),/Dec 2025/);
    const font=await p.locator('.chart text').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize)*el.ownerSVGElement.getBoundingClientRect().width/el.ownerSVGElement.viewBox.baseVal.width); assert.ok(font>=10);
  });
  await test('Add a bill after leaving edit mode creates a new entry', async p => {
    await setup(p,{entries:[entry('2026-01',3000)]}); await nav(p,'usage'); await openHistory(p); await p.locator('[data-edit]').click();
    await nav(p,'home'); await p.getByRole('button',{name:'Add a bill'}).click(); assert.equal(await p.locator('[data-cancel-edit]').count(),0);
  });
  await test('Corrupt JSON recovers to a usable empty screen', async p => { await setup(p,'{broken'); assert.equal(await p.locator('h1').count(),1); });
  await test('Invalid persisted navigation/profile/entry fields cannot blank the app', async p => {
    await setup(p,{page:'missing',resource:'gas',profile:{residents:'bad',waterGoal:'bad'},entries:[{type:'water',month:'2026-01',amount:1,days:30}]});
    assert.equal(await p.locator('h1').count(),1); assert.doesNotMatch(await p.locator('body').innerText(), /NaN|undefined|Infinity/); await nav(p,'usage');
  });
  await test('Stored totals are recomputed, duplicate months and invalid records filtered',async p=>{
    await setup(p,{entries:[{...entry('2026-01',3000),amount:9999},{...entry('2026-02',3000),id:'invalid',unit:'bad'},entry('2026-01',4500)]});
    await nav(p,'usage'); const records=(await saved(p)).entries; assert.equal(records.length,1); assert.equal(records[0].amount,3000);
    assert.doesNotMatch(await p.locator('body').innerText(),/NaN|undefined|9,999/);
  });
  await test('Storage failure is surfaced without a false saved message', async p => {
    await setup(p); await nav(p,'usage');
    await p.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError')};});
    await bill(p); assert.match(await p.locator('[role="status"]').innerText(), /could not save/i); assert.doesNotMatch(await p.locator('[role="status"]').innerText(), /Bill saved/);
  });
  await test('User-entered location renders as text, never HTML', async p => {
    await setup(p,{profile:{...profile,city:'<img src=x onerror="alert(1)">'}}); await nav(p,'profile'); assert.equal(await p.locator('main img').count(),0); assert.match(await p.locator('body').innerText(), /<img/);
  });
  await test('Keyboard navigation retains visible focus after rerender', async p => {
    await setup(p); await p.locator('[data-nav="usage"]').first().focus(); await p.keyboard.press('Enter');
    assert.equal(await p.evaluate(()=>document.activeElement.getAttribute('data-nav')),'usage');
    await p.locator('[data-resource="electricity"]').focus(); await p.keyboard.press('Enter'); assert.equal(await p.evaluate(()=>document.activeElement.getAttribute('data-resource')),'electricity');
  });
  await test('Keyboard bill editing/cancel/delete restores an actionable focus',async p=>{
    await setup(p,{entries:[entry('2026-01',3000)]}); await nav(p,'usage'); await openHistory(p); await p.locator('[data-edit]').focus(); await p.keyboard.press('Enter');
    assert.equal(await p.evaluate(()=>document.activeElement.name),'month');
    await p.locator('[data-cancel-edit]').focus(); await p.keyboard.press('Enter'); assert.equal(await p.evaluate(()=>document.activeElement.hasAttribute('data-edit')),true);
    await openHistory(p); p.once('dialog',d=>d.accept()); await p.locator('[data-delete]').click(); assert.equal(await p.evaluate(()=>document.activeElement.name),'month');
  });
  await test('Reduced motion disables looping animations', async p => {
    await setup(p,{profile,entries:[entry('2026-01',3000)]});
    const duration=await p.locator('.hero-tank-water').evaluate(el=>parseFloat(getComputedStyle(el,'::before').animationDuration)); assert.ok(duration <= .001);
  },{reducedMotion:'reduce'});
  await test('Simulator uses household size and estimates stay separate from bills', async p => {
    await setup(p,{profile}); await nav(p,'ripple'); assert.equal(await p.locator('#sim-daily').textContent(),'24'); assert.equal(await p.locator('#sim-monthly').textContent(),'720'); assert.equal(await p.locator('#sim-yearly').textContent(),'8,760'); assert.equal((await saved(p)).entries.length,0);
  });
  for (const width of [320,360,393,430,768,1280]) {
    await test('Responsive navigation and content at '+width+'px',async p=>{
      await setup(p,{profile,entries:[entry('2026-01',12345678),entry('2026-02',12000),entry('2026-02',980,30,'electricity')]});
      for (const page of ['home','usage','map','ripple','profile']) {
        await nav(p,page);
        const size=await p.evaluate(()=>({actual:document.documentElement.scrollWidth,viewport:innerWidth})); assert.ok(size.actual<=size.viewport+1,page+' horizontal overflow: '+JSON.stringify(size));
        const unlabeled=await p.locator('input, select').evaluateAll(nodes=>nodes.filter(n=>!n.labels?.length && !n.getAttribute('aria-label')).length); assert.equal(unlabeled,0);
      }
    },{viewport:{width,height:852}});
  }
  await test('Phone preview loads same app at selected screen sizes',async p=>{
    await p.goto(BASE+'preview.html'); await p.locator('iframe').waitFor(); const f=p.frameLocator('iframe'); assert.equal(await f.locator('h1').count(),1);
    await p.locator('#device').selectOption('360x800'); assert.equal(await p.locator('iframe').evaluate(el=>el.clientWidth),360);
  },{viewport:{width:1280,height:1000}});
  await browser.close();
  const report={date:new Date().toISOString(),url:BASE,passed:results.filter(r=>r.status==='PASS').length,total:results.length,results};
  fs.writeFileSync(process.env.REPORT_PATH || require('node:path').join(__dirname, 'p0-results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:report.passed,total:report.total}));
  if(report.passed!==report.total)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
