import assert from 'node:assert/strict';
import test from 'node:test';
import '../data-core.js';
const d = globalThis.RipplesData;
const b = (month, quantity, type='water') => d.bill({month,quantity,type,days:30,unit:type==='water'?'gal':'kWh'});
test('CSV handles BOM, CRLF, quoted commas and explicit unit conversions',()=>{
  const rows=d.parseCSV('\uFEFFtype,month,days,quantity,unit,cost,note\r\nwater,2026-01,31,2,CCF,,"hello, world"\r\n');
  assert.equal(rows.length,1); assert.equal(rows[0].amount,1496.104); assert.equal(rows[0].cost,null);
});
test('CSV rejects invalid records atomically, duplicate months and bad quotes',()=>{
  for(const row of ['water,2026-01,30,,gal,','water,2026-13,30,2,gal,','water,2026-01,1.5,2,gal,','electricity,2026-01,30,2,gal,','water,2026-01,30,NaN,gal,']) assert.throws(()=>d.parseCSV('type,month,days,quantity,unit,cost\n'+row));
  assert.throws(()=>d.parseCSV('type,month,days,quantity,unit\nwater,2026-01,30,2,gal\nwater,2026-01,30,3,gal'));
  assert.throws(()=>d.parseCSV('type,month,days,quantity,unit\n"water,2026-01,30,2,gal'));
});
test('Merge skips duplicates by default and preserves identity when replacing',()=>{
  const old=b('2026-01',5), added=b('2026-02',8), incoming=b('2026-01',9);
  const skip=d.mergeBills([old],[incoming,added],false); assert.equal(skip.skipped,1); assert.equal(skip.entries[0].quantity,5);
  const replace=d.mergeBills([old],[incoming],true); assert.equal(replace.entries[0].id,old.id); assert.equal(replace.entries[0].quantity,9);
});
test('Export round trips zero quantities and optional costs',()=>{
  const rows=d.parseCSV(d.csv([b('2026-01',0),b('2026-02',50,'electricity')]));
  assert.equal(rows[0].amount,0); assert.equal(rows[1].type,'electricity');
});
test('Forecast refuses short and gapped histories without manufacturing bills',()=>{
  assert.equal(d.forecast([b('2026-01',100)],'water').ready,false);
  const rows=[1,2,3,4,6,7].map(n=>b('2026-'+String(n).padStart(2,'0'),100));
  assert.equal(d.forecast(rows,'water').count,2);
});
test('Forecast uses historical validation and recognizes a stable trend',()=>{
  const rows=Array.from({length:12},(_,i)=>b('2025-'+String(i+1).padStart(2,'0'),(10+i)*30));
  const before=JSON.stringify(rows), result=d.forecast(rows,'water');
  assert.equal(result.ready,true); assert.equal(result.model,'trend'); assert.equal(result.points[0].month,'2026-01');
  assert.ok(Math.abs(result.points[0].amount-22*30.44)<.0001); assert.equal(JSON.stringify(rows),before);
});
test('Seasonality candidate requires two full years; ranges remain nonnegative',()=>{
  const rows=Array.from({length:24},(_,i)=>b(d.monthName(d.monthIndex('2024-01')+i),(100+(i%12)*40)));
  const result=d.forecast(rows,'water'); assert.equal(result.model,'seasonal');
  for(const p of result.points) assert.ok(p.low>=0 && p.high>=p.amount);
});
test('Goal compares normalized target-month bills and ignores other months',()=>{
  const g={id:'goal',type:'water',month:'2026-02',baseline:3044,limit:2739.6,baselineMonth:'2026-01'};
  assert.equal(d.validGoal(g),true); assert.equal(d.goalProgress(g,[b('2026-01',0)]).pending,true);
  assert.equal(d.goalProgress(g,[b('2026-02',2700)]).complete,true);
});
