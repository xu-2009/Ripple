// Fetch only the documented, fixed Utah U.S. Drought Monitor endpoint.
let cached;
export async function currentUtahDrought() {
  if (cached && Date.now()-cached.savedAt < 6*60*60*1000) return cached.value;
  const end = new Date(), start = new Date(end.getTime()-35*86400000);
  const fmt = d => `${d.getUTCMonth()+1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
  const url='https://usdmdataservices.unl.edu/api/StateStatistics/GetDroughtSeverityStatisticsByAreaPercent?'+new URLSearchParams({aoi:'49',startdate:fmt(start),enddate:fmt(end),statisticsType:'1'});
  const response = await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)});
  if(!response.ok) throw new Error('Official drought service returned HTTP '+response.status);
  const rows=await response.json();
  if(!Array.isArray(rows)) throw new Error('Unexpected official drought data');
  const r=rows.filter(r=>String(r.stateAbbreviation || r.StateAbbreviation)==='UT').sort((a,b)=>String(b.mapDate||b.MapDate).localeCompare(String(a.mapDate||a.MapDate)))[0];
  if(!r) throw new Error('No recent Utah drought report');
  const value={date:String(r.mapDate||r.MapDate).slice(0,10),retrievedAt:new Date().toISOString().slice(0,10),mode:'Live official data',source:url};
  for(const k of ['D1','D2','D3']) {const n=Number(r[k]??r[k.toLowerCase()]);if(!Number.isFinite(n)||n<0||n>100)throw new Error('Invalid drought percentage');value[k]=n;}
  cached={savedAt:Date.now(),value}; return value;
}
