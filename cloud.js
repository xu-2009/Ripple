/* Supabase adapter. Offline use does not load the SDK or send household data. */
window.RipplesCloud = (() => {
  let client = null;
  const config = window.RIPPLES_CONFIG || {};
  const configured = Boolean(config.supabaseUrl && config.supabaseKey);
  async function init(onAuth) {
    if (!configured) return null;
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.supabaseUrl) ||
        config.supabaseKey.startsWith('sb_secret_')) throw new Error('Use a Supabase HTTPS project URL and publishable/anon key.');
    if (config.supabaseKey.startsWith('eyJ')) {
      try { if (JSON.parse(atob(config.supabaseKey.split('.')[1])).role !== 'anon') throw new Error(); }
      catch { throw new Error('Only the public anon key is allowed in browser configuration.'); }
    }
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.76.1/dist/umd/supabase.js';
      script.onload = resolve; script.onerror = () => reject(new Error('Account service could not load. Local data remains available.'));
      document.head.append(script);
    });
    client = window.supabase.createClient(config.supabaseUrl, config.supabaseKey, {
      auth: { storage: sessionStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    client.auth.onAuthStateChange((event, session) => { setTimeout(() => onAuth(event, session), 0); });
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session;
  }
  function ready() { if (!client) throw new Error('Cloud connection is not configured or is unavailable.'); return client; }
  async function unwrap(result) { const { data, error } = await result; if (error) throw new Error(error.message); return data; }
  const rpc = (name, args) => unwrap(ready().rpc(name, args));
  return {
    configured, init,
    login: (email, password) => unwrap(ready().auth.signInWithPassword({ email, password })),
    signup: (email, password) => unwrap(ready().auth.signUp({ email, password, options: { emailRedirectTo: location.origin + '/' } })),
    reset: email => unwrap(ready().auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/' })),
    password: password => unwrap(ready().auth.updateUser({ password })),
    logout: () => unwrap(ready().auth.signOut({ scope: 'local' })),
    pull: () => unwrap(ready().from('household_snapshots').select('payload,revision,updated_at').maybeSingle()),
    push: (payload, expected) => rpc('save_household', { p_payload: payload, p_expected: expected }),
    aggregate: (month, resource) => rpc('county_report', { p_month: month + '-01', p_resource: resource }),
    submissions: () => unwrap(ready().from('community_bills').select('id,county,resource,month,status,review_note,evidence_path').order('month', { ascending: false })),
    async submit(data, file, userId) {
      const evidence = userId + '/' + crypto.randomUUID() + '.' + ({ 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg' }[file.type] || 'invalid');
      if (!['application/pdf', 'image/png', 'image/jpeg'].includes(file.type) || file.size > 5e6 || !file.size) throw new Error('Use a PDF, PNG or JPEG under 5 MB.');
      await unwrap(ready().storage.from('bill-evidence').upload(evidence, file));
      try { return await rpc('submit_bill', { p_bill: data, p_evidence: evidence }); }
      catch (error) { await ready().storage.from('bill-evidence').remove([evidence]); throw error; }
    },
    async withdraw(id, evidence) {
      await unwrap(ready().from('community_bills').delete().eq('id', id));
      const { error } = await ready().storage.from('bill-evidence').remove([evidence]);
      if (error) throw new Error('Report withdrawn. Evidence deletion failed; retry from your account or contact the operator.');
    },
    communityChallenge: (challenge, county, action) => rpc('community_challenge', { p_challenge: challenge, p_county: county, p_action: action }),
    challengeMine: () => rpc('my_challenges', {}),
    challengeStats: () => rpc('challenge_report', {}),
    async erase() {
      const rows = await unwrap(ready().from('community_bills').select('evidence_path'));
      if (rows.length) await unwrap(ready().storage.from('bill-evidence').remove(rows.map(r => r.evidence_path)));
      await rpc('erase_my_data', {});
    }
  };
})();
