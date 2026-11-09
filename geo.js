import * as turf from '@turf/turf';

// Fallback position if geolocation is denied (Pantai Padang, sample)
export const DEFAULT_POS = { lat: -0.944, lon: 100.3565 };

// >>> SWAP: your real coastline ([lon, lat], north -> south). Or skip buildHazardZones()
// entirely and load your own inundation GeoJSON (e.g. fetch('/data/hazard.geojson')).
const COAST = [[100.346, -0.9], [100.35, -0.93], [100.3525, -0.955], [100.358, -0.98]];

// >>> SWAP: real shelters (elev > 15 m). Sample data only.
export const SHELTERS = [
  { id: 's1', name: 'Shelter Bukit Timur 1', lat: -0.933, lon: 100.372, elev: 32, capacity: 1200, contact: '0751-000-001' },
  { id: 's2', name: 'Gedung Evakuasi Vertikal 2', lat: -0.956, lon: 100.37, elev: 21, capacity: 800, contact: '0751-000-002' },
  { id: 's3', name: 'Lapangan Tinggi 3', lat: -0.97, lon: 100.378, elev: 45, capacity: 2000, contact: '0751-000-003' },
].filter((s) => s.elev > 15);

// Land-side buffers of the coastline: 0-500 m (high) and 500 m-1 km (moderate)
export function buildHazardZones() {
  const line = turf.lineString(COAST);
  const sea = turf.polygon([[...COAST, [100.3, -0.98], [100.3, -0.9], COAST[0]]]);
  const land = (km) => turf.difference(turf.buffer(line, km, { units: 'kilometers' }), sea);
  const high = land(0.5);
  const moderate = turf.difference(land(1), high);
  return turf.featureCollection([
    { ...high, properties: { risk: 'high', label: 'Risiko Tinggi (0–500 m)' } },
    { ...moderate, properties: { risk: 'moderate', label: 'Risiko Sedang (500 m–1 km)' } },
  ]);
}

const DIRS = ['utara', 'timur laut', 'timur', 'tenggara', 'selatan', 'barat daya', 'barat', 'barat laut'];

// Nearest shelter by Turf great-circle distance; straight-line path.
// >>> SWAP: for road-following routes, replace `path` with an OSRM/Valhalla/GraphHopper geometry.
export function buildRoute(pos, shelters) {
  const from = turf.point([pos.lon, pos.lat]);
  let best = null;
  for (const s of shelters) {
    const km = turf.distance(from, turf.point([s.lon, s.lat]));
    if (!best || km < best.km) best = { s, km };
  }
  const { s, km } = best;
  const b = (turf.bearing(from, turf.point([s.lon, s.lat])) + 360) % 360;
  const dir = DIRS[Math.round(b / 45) % 8];
  return {
    shelter: s,
    km,
    minutes: Math.max(1, Math.round((km / 5) * 60)), // 5 km/h walking
    path: [[pos.lat, pos.lon], [s.lat, s.lon]],
    steps: [
      `Segera menjauh dari garis pantai ke arah ${dir}`,
      `Ikuti jalan menuju ${s.name} (${km.toFixed(1)} km)`,
      'Tiba di titik evakuasi, lapor ke petugas',
    ],
  };
}
