const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE=process.env.RIPPLES_URL || 'http://127.0.0.1:5178/';
const PHONE=process.env.RIPPLES_PHONE_URL;
const KEY='ripples-demo-v1';
const results=[];
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || undefined});
 async function test(name,fn,options={}){
  const context=await browser.newContext({viewport:{width:393,height:852},...options});
  const page=await context.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  try{await page.goto(BASE);await fn(page,context);assert.deepEqual(errors,[]);results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',error:e.message});}
  await context.close(); console.log(results.at(-1).status+' '+name+(results.at(-1).error?': '+results.at(-1).error.split('\n')[0]:''));
 }
 const nav=(p,name)=>p.locator('.nav-list [data-nav="'+name+'"]').click();
 await test('Official 29 county geometry loads and source is visible',async p=>{
  await nav(p,'map');await p.locator('.utah-map .county').first().waitFor();
  assert.equal(await p.locator('.utah-map .county').count(),29);
  assert.equal(await p.locator('[data-county-select] option').count(),29);
  assert.match(await p.locator('.map-art .source').innerText(),/State of Utah SGID/);
  assert.match(await p.locator('.map-key').innerText(),/Not utility usage/);
  assert.match(await p.locator('.map-banner').innerText(),/FICTIONAL EXAMPLE/);
  await p.locator('[data-map-layer="official"]').click();
  assert.match(await p.locator('.map-details').innerText(),/no data yet/);
  await p.screenshot({path:process.env.P1_SCREENSHOT_PATH || require('node:path').join(__dirname,'p1-map-mobile.png')});
 });
 await test('Map selects any county by dropdown and path and persists selection',async p=>{
  await nav(p,'map');await p.locator('.utah-map .county').first().waitFor();
  await p.locator('[data-county-select]').selectOption('Daggett');assert.match(await p.locator('.map-details h2').innerText(),/Daggett/);
  await p.locator('.utah-map [data-region="Salt Lake"]').click();assert.match(await p.locator('.map-details h2').innerText(),/Salt Lake/);
  await p.reload();await p.locator('.utah-map .county').first().waitFor();assert.equal(await p.locator('[data-county-select]').inputValue(),'Salt Lake');
 });
 await test('County map supports keyboard selection and keeps focus',async p=>{
  await nav(p,'map');await p.locator('.utah-map .county').first().waitFor();
  await p.locator('.utah-map [data-region="Weber"]').focus();await p.keyboard.press('Enter');
  assert.equal(await p.locator('[data-county-select]').inputValue(),'Weber');
  assert.equal(await p.evaluate(()=>document.activeElement.getAttribute('data-region')),'Weber');
 });
 await test('Electricity toggle labels statewide context without inventing county figures',async p=>{
  await nav(p,'map');await p.locator('.utah-map .county').first().waitFor();
  await p.locator('.map-head [data-resource="electricity"]').click();
  assert.match(await p.locator('.map-details').innerText(),/774 kWh per residential account/);
  assert.match(await p.locator('.map-details').innerText(),/does not describe Salt Lake County specifically/);
  await p.locator('[data-map-layer="official"]').click();
  assert.match(await p.locator('.map-details').innerText(),/no data yet/);
 });
 await test('Action recommendations reflect lawn and can be saved completed reset and removed',async p=>{
  await p.evaluate(key=>localStorage.setItem(key,JSON.stringify({profile:{residents:3,lawn:true,irrigation:false}})),KEY);await p.reload();
  await nav(p,'ripple');assert.match(await p.locator('.tip').last().innerText(),/separate meter/);
  await p.locator('[data-action-add="outdoor-watering"]').click();
  assert.deepEqual(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).actionGoals,KEY),[{id:'outdoor-watering',done:false}]);
  await p.locator('[data-action-toggle="outdoor-watering"]').click();assert.match(await p.locator('.action-progress').innerText(),/1 of 1/);
  await p.reload();assert.match(await p.locator('.action-progress').innerText(),/1 of 1/);
  await p.locator('[data-action-toggle="outdoor-watering"]').click();assert.match(await p.locator('.action-progress').innerText(),/0 of 1/);
  await p.locator('[data-action-remove="outdoor-watering"]').click();assert.match(await p.locator('.action-progress').innerText(),/0 of 0/);
 });
 await test('Simulator household input updates estimates without creating measured bills',async p=>{
  await nav(p,'ripple');await p.locator('[data-sim="household"]').evaluate(el=>{el.value='2';el.dispatchEvent(new Event('input',{bubbles:true}))});
  assert.equal(await p.locator('#sim-daily').innerText(),'12');assert.equal(await p.locator('#sim-monthly').innerText(),'360');
  assert.equal(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).entries.length,KEY),0);
 });
 await test('Water reacts to pointer and ripple press in regular motion mode',async p=>{
  const tank=p.locator('.hero-flow-demo');const box=await tank.boundingBox();
  await p.mouse.move(box.x+box.width*.85,box.y+box.height*.7);
  const angle=await p.locator('.hero-tank').evaluate(el=>el.style.getPropertyValue('--tank-angle'));assert.notEqual(angle,'0.00deg');
  await p.locator('.hero-copy h1').click();assert.equal(await p.locator('.hero-tank').evaluate(el=>el.classList.contains('pulse')),true);
 });
 await test('Secure-context tilt permission and orientation events move the water',async p=>{
  await p.evaluate(()=>{
    class FakeOrientationEvent extends Event {}
    FakeOrientationEvent.requestPermission=async()=> 'granted';
    Object.defineProperty(window,'DeviceOrientationEvent',{value:FakeOrientationEvent,configurable:true});
  });
  assert.equal(await p.locator('[data-tilt]').isDisabled(),false);
  await p.locator('[data-tilt]').click();assert.match(await p.locator('#tilt-status').innerText(),/enabled/i);
  await p.evaluate(()=>{
    for(const [gamma,beta] of [[0,0],[15,10]]){
      const e=new Event('deviceorientation');Object.defineProperties(e,{gamma:{value:gamma},beta:{value:beta}});window.dispatchEvent(e);
    }
  });
  assert.notEqual(await p.locator('.hero-tank').evaluate(el=>el.style.getPropertyValue('--tank-angle')),'0.00deg');
  await p.locator('[data-tilt]').click();assert.ok(['','0.00deg'].includes(await p.locator('.hero-tank').evaluate(el=>el.style.getPropertyValue('--tank-angle'))));
 });
 await test('Reduced motion prevents pointer movement animation',async p=>{
  const tank=p.locator('.hero-flow-demo');const box=await tank.boundingBox();
  await p.mouse.move(box.x+box.width*.85,box.y+box.height*.7);
  assert.equal(await p.locator('.hero-tank').evaluate(el=>el.style.getPropertyValue('--tank-angle')),'');
  assert.equal(await p.locator('[data-tilt]').isDisabled(),true);
 },{reducedMotion:'reduce'});
 if(PHONE) await test('Phone HTTP explains why device tilt needs HTTPS',async p=>{
  await p.goto(PHONE);
  assert.equal(await p.evaluate(()=>window.isSecureContext),false);
  assert.equal(await p.locator('[data-tilt]').isDisabled(),true);
  assert.match(await p.locator('#tilt-status').innerText(),/HTTPS/);
 });
 for(const width of [320,393,1280]) await test('P1 map and action pages have no horizontal overflow at '+width,async p=>{
  await p.setViewportSize({width,height:852});
  for(const name of ['map','ripple']){
   await nav(p,name);if(name==='map')await p.locator('.utah-map .county').first().waitFor();
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' page overflows');
  }
 });
 await browser.close();
 const report={time:new Date().toISOString(),passed:results.filter(r=>r.status==='PASS').length,total:results.length,results};
 fs.writeFileSync(process.env.P1_REPORT_PATH || require('node:path').join(__dirname,'p1-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,total:report.total}));
 if(report.passed!==report.total)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
