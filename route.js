import { MOCK } from '../../../lib/maritime';

export const revalidate = 600;

// >>> SWAP: coordinates of the coast you monitor (default: Padang, West Sumatra)
const LAT = -0.95, LON = 100.35;

// >>> SWAP: endpoints. BMKG autogempa gives "Potensi" (tsunami potential) of the latest quake.
// Wave height / sea level / wind come from Open-Meteo (free, no key) because BMKG's
// maritime forecast is not published as CORS-friendly JSON.
const BMKG_QUAKE = 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json';
const MARINE = `https://marine-api.open-meteo.com/v1/marine?latitude=${LAT}&longitude=${LON}&current=wave_height,sea_level_height_msl`;
const WIND = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=wind_speed_10m`;

export async function GET() {
  try {
    const [q, m, w] = await Promise.all([BMKG_QUAKE, MARINE, WIND].map((u) => fetch(u).then((r) => r.json())));
    const potensi = q.Infogempa.gempa.Potensi || '';
    const tsunami = /berpotensi tsunami/i.test(potensi) && !/tidak/i.test(potensi);
    const sea = m.current.sea_level_height_msl; // metres vs mean sea level; thresholds are tunable
    return Response.json({
      source: 'live',
      wave: m.current.wave_height,
      wind: w.current.wind_speed_10m,
      tide: sea > 0.5 ? 'Tinggi' : sea < -0.5 ? 'Rendah' : 'Sedang',
      alert: tsunami ? 'SIAGA TSUNAMI' : 'AMAN',
    });
  } catch {
    return Response.json(MOCK); // API offline -> fallback red alert box
  }
}
