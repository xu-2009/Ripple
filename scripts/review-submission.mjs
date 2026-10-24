// Operator-only workflow. Never ship the service key to a browser or commit it.
// SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/review-submission.mjs list
// Commands: list | evidence <id> | approve <id> "review note" | reject <id> "reason"
const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) throw new Error('Set SUPABASE_URL and server-side SUPABASE_SERVICE_ROLE_KEY in your environment.');
const [command, id, note] = process.argv.slice(2);
async function api(path, method='GET', body) {
  const response = await fetch(url+path,{method,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  if(!response.ok) throw new Error('Service returned HTTP '+response.status+'. Check project configuration and request.');
  const text = await response.text(); return text ? JSON.parse(text) : null;
}
if(command==='list') {
  console.log(JSON.stringify(await api('/rest/v1/community_bills?status=eq.pending&select=id,county,resource,month,days,residents,amount,evidence_path&order=consent_at.asc'),null,2));
} else {
  if(!/^[0-9a-f-]{36}$/i.test(id||'')) throw new Error('Provide a submission UUID.');
  if(command==='evidence') {
    const rows=await api('/rest/v1/community_bills?id=eq.'+id+'&select=evidence_path');
    if(!rows.length) throw new Error('Submission not found.');
    const result=await api('/storage/v1/object/sign/bill-evidence/'+rows[0].evidence_path,'POST',{expiresIn:120});
    console.log('Private evidence link (expires in 2 minutes): '+url+'/storage/v1'+result.signedURL);
  } else if(['approve','reject'].includes(command)) {
    if(!note||note.trim().length<5) throw new Error('Provide a meaningful review note after checking the original evidence.');
    await api('/rest/v1/rpc/review_bill','POST',{p_id:id,p_status:command==='approve'?'verified':'rejected',p_note:note});
    console.log('Review recorded.');
  } else throw new Error('Use list, evidence, approve or reject.');
}
