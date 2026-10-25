// Runs the production SQL against disposable PGlite with small Supabase auth/storage shims.
// This validates SQL and permissions, not Supabase's hosted Auth or Storage services.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {PGlite}=await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db=new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role;
create schema auth; create schema storage;
create table auth.users(id uuid primary key,email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to anon,authenticated,service_role;
grant execute on function auth.uid() to anon,authenticated,service_role;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
create function storage.foldername(text) returns text[] language sql as $$select string_to_array($1,'/')$$;
alter table storage.objects enable row level security;`);
await db.exec(await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8'));
console.log('PASS production schema compiles');
const ids=Array.from({length:11},(_,i)=>`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`);
for(const id of ids) await db.query('insert into auth.users values($1,now())',[id]);
async function asUser(id,fn) {
  await db.exec('set role authenticated'); await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
  try{return await fn();} finally {await db.exec('reset role');}
}
await asUser(ids[0],async()=>{
  const row=await db.query("select public.save_household('{\"entries\":[]}',0) as revision"); assert.equal(row.rows[0].revision,1);
  await assert.rejects(db.query("select public.save_household('{}',0)"),/SYNC_CONFLICT/);
  await assert.rejects(db.query("update household_snapshots set payload='{}'"),/permission denied/);
});
await asUser(ids[1],async()=>{assert.equal((await db.query('select * from household_snapshots')).rows.length,0);});
console.log('PASS snapshot isolation and optimistic concurrency');
await asUser(ids[0],async()=>{
  await assert.rejects(db.query("select public.review_bill(gen_random_uuid(),'verified','looks good')"),/permission denied/);
  await assert.rejects(db.query("insert into community_bills(user_id) values(auth.uid())"),/permission denied/);
});
console.log('PASS users cannot forge verified status');
for(const [i,id] of ids.entries()) {
  await db.query("insert into storage.objects(bucket_id,name) values('bill-evidence',$1)",[id+'/proof.pdf']);
  for(const month of ['2025-01','2025-02']) {
    const result=await asUser(id,()=>db.query('select public.submit_bill($1::jsonb,$2) as id',[JSON.stringify({consent:true,type:'water',unit:'gal',quantity:month.endsWith('01')?3000:2700,days:30,residents:2,county:'Salt Lake',month}),id+'/proof.pdf']));
    if(i<9) await db.query("select public.review_bill($1,'verified','Reviewed original bill totals')",[result.rows[0].id]);
  }
}
assert.equal((await db.query("select * from public.county_report('2025-02-01','water')")).rows.length,0);
await db.query("update community_bills set status='verified' where user_id=$1",[ids[9]]);
const report=(await db.query("select * from public.county_report('2025-02-01','water')")).rows[0];
assert.equal(report.participant_band,'10+'); assert.equal(Number(report.reduction_percent),10); assert.equal(Number(report.daily_per_person),45);
await db.query("delete from community_bills where user_id=$1",[ids[9]]);
assert.equal((await db.query("select * from public.county_report('2025-02-01','water')")).rows.length,0);
console.log('PASS pending exclusion, paired cohort normalization, 10-account suppression, withdrawal');
await asUser(ids[0],async()=>{
  await db.query("select community_challenge('water-week','Salt Lake','join')");
  await db.query("select community_challenge('water-week','Salt Lake','checkin')");
  await db.query("select community_challenge('water-week','Salt Lake','checkin')");
  assert.equal((await db.query('select * from my_challenges()')).rows[0].checkins.length,1);
  await db.query("select community_challenge('water-week','Salt Lake','undo')");
  assert.equal((await db.query('select * from my_challenges()')).rows[0].checkins.length,0);
  await db.query('select erase_my_data()');
  assert.equal((await db.query('select * from household_snapshots')).rows.length,0);
  assert.equal((await db.query('select * from community_bills')).rows.length,0);
});
console.log('PASS server-day check-in deduplication, undo, user data erasure');
const showcaseSql=await readFile(new URL('../supabase/showcase-users.sql',import.meta.url),'utf8');
await db.exec(showcaseSql);
await db.exec(showcaseSql);
assert.equal((await db.query('select count(*)::integer as n from public.showcase_users')).rows[0].n,1059);
await db.exec('set role anon');
try {
  const report=await db.query('select * from public.showcase_county_report()');
  assert.equal(report.rows.length,58);
  assert.equal(report.rows.reduce((n,row)=>n+Number(row.participants),0),1059);
  await assert.rejects(db.query('select * from public.showcase_users'),/permission denied/);
} finally { await db.exec('reset role'); }
console.log('PASS fictional showcase seed is idempotent, aggregated, and table-private');
await db.close();
