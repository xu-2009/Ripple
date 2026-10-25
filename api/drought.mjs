import { currentUtahDrought } from '../drought-data.mjs';

export async function GET() {
  try {
    return Response.json(await currentUtahDrought(), {
      headers: { 'Cache-Control': 'public, max-age=1800' }
    });
  } catch {
    return Response.json({ error: 'Official drought data unavailable' }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' }
    });
  }
}
