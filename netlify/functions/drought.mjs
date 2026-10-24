import { currentUtahDrought } from '../../drought-data.mjs';
export default async () => {
  try { return new Response(JSON.stringify(await currentUtahDrought()),{headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=1800'}}); }
  catch { return new Response(JSON.stringify({error:'Official drought data unavailable'}),{status:503,headers:{'content-type':'application/json; charset=utf-8'}}); }
};
export const config={path:'/api/drought'};
