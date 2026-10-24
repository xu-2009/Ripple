const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE=process.env.RIPPLES_URL || 'http://127.0.0.1:5178/';
const KEY='ripples-demo-v1', results=[];
let browser;
const nav=(p,id)=>p.locator('.nav-list [data-nav="'+id+'"]').click();
async function test(name,fn,width=393) {
  const context=await browser.newContext({viewport:{width,height:852}}), p=await context.newPage(), errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.route('https://fonts.googleapis.com/**',r=>r.abort());
  await p.route('https://fonts.gstatic.com/**',r=>r.abort());
  await p.goto(BASE,{waitUntil:'domcontentloaded'});
  try {await fn(p);assert.deepEqual(errors,[]);results.push({name,status:'PASS'});}
  catch(e){results.push({name,status:'FAIL',error:e.message});}
  await context.close();console.log(results.at(-1).status+' '+name+(results.at(-1).error?': '+results.at(-1).error:''));
}
const seed=async(p,raw)=>{await p.evaluate(({KEY,raw})=>localStorage.setItem(KEY,JSON.stringify(raw)),{KEY,raw});await p.reload({waitUntil:'domcontentloaded'});};
const b=(month,n)=>({id:month,type:'water',month,days:30,quantity:n,amount:n,unit:'gal',cost:null});
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args:['--no-sandbox']});
 await test('CSV preview, duplicate skip, confirmed import and reload',async p=>{
  await seed(p,{entries:[b('2026-01',100)]});await nav(p,'usage');await p.locator('.usage-import summary').click();
  await p.locator('[data-import-csv]').setInputFiles({name:'bills.csv',mimeType:'text/csv',buffer:Buffer.from('type,month,days,quantity,unit\nwater,2026-01,30,9,gal\nwater,2026-02,30,2,kgal')});
  await p.locator('[data-extra="import-confirm"]').waitFor();
  assert.equal(await p.evaluate(()=>state.entries.length),1);
  await p.locator('[data-extra="import-confirm"]').click();assert.equal(await p.evaluate(()=>state.entries.length),2);
  assert.equal(await p.evaluate(()=>state.entries[0].quantity),100);
  await p.reload();assert.equal(await p.evaluate(()=>state.entries[1].amount),2000);
 });
 await test('Invalid import is rejected without changing bills',async p=>{
  await nav(p,'usage');
  await p.locator('.usage-import summary').click();
  await p.locator('[data-import-csv]').setInputFiles({name:'bad.csv',mimeType:'text/csv',buffer:Buffer.from('type,month,days,quantity,unit\nwater,2026-13,30,9,gal')});
  await p.locator('.notice').waitFor();assert.equal(await p.evaluate(()=>state.entries.length),0);assert.equal(await p.locator('.import-review').count(),0);
 });
 await test('Water comparison uses the sourced 2015 Utah residential reference',async p=>{
  await seed(p,{profile:{residents:2},entries:[b('2026-01',10140)]});await nav(p,'home');
  const comparison=p.locator('.grid.two .card').filter({hasText:'Know the context'});
  assert.match(await comparison.innerText(),/169 gal\/person\/day/);
  assert.match(await comparison.innerText(),/2015/);
  assert.match(await comparison.innerText(),/season-matched/);
  assert.match(await comparison.innerText(),/0%/);
 });
 await test('Reduction goal reaches completion using target month and persists',async p=>{
  await seed(p,{entries:[b('2026-01',3000)]});await nav(p,'ripple');
  await p.locator('.measured-goal-details > summary').click();const form=p.locator('#conservation-goal-form');await form.locator('[name="month"]').fill('2026-02');await form.locator('[name="reduction"]').fill('10');await form.locator('button').click();
  assert.equal(await p.evaluate(()=>state.conservationGoals.length),1);await p.locator('.measured-goal-details > summary').click();assert.match(await p.locator('.measured-goal').first().innerText(),/Waiting/);
  await p.evaluate(()=>{state.entries.push({id:'feb',type:'water',month:'2026-02',days:30,quantity:2600,amount:2600,unit:'gal',cost:null});saveState();});
  await p.reload();await nav(p,'ripple');await p.locator('.measured-goal-details > summary').click();assert.match(await p.locator('.measured-goal').first().innerText(),/Goal reached/);
 });
 await test('Forecast renders from sufficient history without adding synthetic bills',async p=>{
  await seed(p,{entries:Array.from({length:8},(_,i)=>b('2025-'+String(i+1).padStart(2,'0'),3000-i*100))});await nav(p,'usage');
  assert.equal(await p.locator('.forecast-stat').count(),0);assert.doesNotMatch(await p.locator('body').innerText(),/Your next three months/);assert.equal(await p.evaluate(()=>state.entries.length),8);
 });
 await test('Irrigation inclusion advice is correct in both settings',async p=>{
  await seed(p,{profile:{lawn:true,irrigation:false}});await nav(p,'ripple');assert.match(await p.locator('.tip').filter({hasText:'Inspect outdoor watering'}).innerText(),/separate meter/);
  await p.evaluate(()=>{state.profile.irrigation=true;saveState();renderShell();});assert.doesNotMatch(await p.locator('.tip').filter({hasText:'Inspect outdoor watering'}).innerText(),/profile says irrigation uses a separate/);
 });
 await test('Reduced motion preference survives reload',async p=>{
  await nav(p,'profile');await p.locator('[data-reduce-motion]').check();await p.reload();assert.equal(await p.locator('html').getAttribute('class'),'reduce-motion');await nav(p,'home');assert.equal(await p.locator('[data-tilt]').isDisabled(),true);
 });
 await test('Bar charts expose values to keyboard and return to line view',async p=>{
  await seed(p,{entries:[b('2026-01',3000),b('2026-02',2700)]});await nav(p,'usage');
  await p.locator('[data-chart-style="bar"]').click();assert.equal(await p.locator('.chart rect').count(),2);
  await p.locator('.chart rect').last().focus();assert.match(await p.locator('.chart-tooltip').innerText(),/90 gal\/day/);
  await p.locator('[data-chart-style="line"]').click();assert.equal(await p.locator('.chart polyline').count(),1);
 });
 await test('Fixture estimate uses flow difference and never reports negative savings',async p=>{
  await nav(p,'ripple');await p.locator('[data-estimate-panel="efficient-fixtures"] summary').click();
  for(const [field,value] of [['oldFlow','3'],['newFlow','2'],['minutes','10']]) await p.locator('[data-estimate-action="efficient-fixtures"][data-estimate-field="'+field+'"]').fill(value);
  assert.match(await p.locator('[data-estimate-output="efficient-fixtures"]').innerText(),/300/);
  await p.locator('[data-estimate-action="efficient-fixtures"][data-estimate-field="newFlow"]').fill('4');
  assert.match(await p.locator('[data-estimate-output="efficient-fixtures"]').innerText(),/about 0 /);
 });
 await test('Official snapshot fallback is dated and separated from demo leaderboard',async p=>{
  await p.route('**/api/drought',r=>r.abort());await nav(p,'map');await p.locator('details.feature-section summary').click();await p.locator('[data-extra="environment"]').click();
  await p.getByText(/Saved official snapshot/).waitFor();assert.match(await p.locator('body').innerText(),/2026-10-13/);assert.match(await p.locator('body').innerText(),/FICTIONAL/);
 });
 await test('Simulated cloud transport isolates guest data and detects a conflicting version',async p=>{
  await seed(p,{entries:[b('2026-01',777)]});
  await p.evaluate(async()=>{RipplesCloud.configured=true;cloudAvailable=true;RipplesCloud.pull=async()=>({revision:3,payload:{entries:[]}});await acceptSession('SIGNED_IN',{user:{id:'test-account-a',email:'test@example.com'}});});
  assert.equal(await p.evaluate(()=>state.entries.length),0);
  await p.evaluate(async()=>{RipplesCloud.push=async()=>{throw new Error('SYNC_CONFLICT');};state.profile.city='Provo';saveState();await syncCloud();renderShell();});
  assert.equal(await p.evaluate(()=>cloudConflict),true);assert.match(await p.locator('body').innerText(),/hidden until they pass a multi-account/);assert.equal(await p.locator('[data-extra="use-cloud"]').count(),0);
  await p.evaluate(async()=>{await acceptSession('SIGNED_OUT',null);});assert.equal(await p.evaluate(()=>state.entries[0].quantity),777);
 });
 await test('Cloud changes on another device cannot overwrite unsent local data',async p=>{
  await p.evaluate(async()=>{RipplesCloud.pull=async()=>({revision:1,payload:{profile:{city:'Initial'}}});await acceptSession('SIGNED_IN',{user:{id:'test-account-b',email:'test@example.com'}});});
  await p.evaluate(async()=>{
    RipplesCloud.pull=async()=>{state.profile.city='Unsent';saveState();return {revision:2,payload:{profile:{city:'Remote'}}};};
    await syncCloud();
  });
  assert.equal(await p.evaluate(()=>state.profile.city),'Unsent');assert.equal(await p.evaluate(()=>cloudConflict),true);
 });
 for(const width of [320,393,1280]) await test('All five pages fit width '+width,async p=>{
  for(const id of ['home','usage','map','ripple','profile']) {await nav(p,id);if(id==='map')await p.locator('.utah-map').waitFor();assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+' overflows');}
  if(width===393){await nav(p,'usage');await p.screenshot({path:__dirname+'/p2-mobile-usage.png',fullPage:true});}
 },width);
 fs.writeFileSync(__dirname+'/p2-results.json',JSON.stringify({at:new Date().toISOString(),results},null,2));
 await browser.close();console.log(results.filter(r=>r.status==='PASS').length+'/'+results.length+' passed');if(results.some(r=>r.status==='FAIL'))process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
