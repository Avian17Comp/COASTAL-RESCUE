'use client';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { Waves, Wind, MoveVertical, Phone, X, Layers, TriangleAlert, MapPin } from 'lucide-react';
import { SHELTERS, DEFAULT_POS, buildHazardZones, buildRoute } from '../lib/geo';
import { useMaritime } from '../lib/useMaritime';

const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => <div className="h-full bg-navy-900" /> });

const Card = ({ title, children }) => (
  <section className="rounded-xl border border-cyan-400/15 bg-navy-900/85 p-4">
    <h2 className="mb-3 text-sm font-semibold text-slate-400">{title}</h2>
    {children}
  </section>
);

const AlertBox = ({ m }) => {
  const calm = m.alert === 'AMAN' || m.alert === 'MEMUAT';
  return (
    <div role="alert" className={`flex items-center gap-3 rounded-lg border p-3 ${calm ? 'border-green-500/50 bg-green-500/10 text-green-200' : 'border-red-500/60 bg-red-500/15 text-red-200'}`}>
      <TriangleAlert className="h-5 w-5 shrink-0" />
      <div>
        <p className="text-sm font-bold">{m.alert}</p>
        <p className="text-xs opacity-80">{m.source === 'live' ? 'Data langsung BMKG & Open-Meteo' : m.source === 'mock' ? 'Data contoh (API tidak tersedia)' : 'Mengambil data…'}</p>
      </div>
    </div>
  );
};

const Steps = ({ steps }) => (
  <ol className="space-y-2 text-sm text-slate-200">
    {steps.map((s, i) => (
      <li key={i} className="flex gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-500" />{s}</li>
    ))}
  </ol>
);

function SosModal({ pos, onClose }) {
  const link = `https://maps.google.com/?q=${pos.lat},${pos.lon}`;
  const msg = encodeURIComponent(`DARURAT! Saya butuh bantuan. Posisi saya: ${link}`);
  // >>> SWAP: add your regional BPBD number (117 is the BNPB national call center)
  const lines = [['BPBD / BNPB', '117'], ['Basarnas', '115'], ['Polisi', '110'], ['Ambulans', '119']];
  return (
    <div className="fixed inset-0 z-[2000] grid place-items-end bg-black/70 sm:place-items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Kontak darurat" onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-2xl border border-red-500/40 bg-navy-900 p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-red-300">Tombol Darurat</h2>
          <button onClick={onClose} aria-label="Tutup" className="rounded-lg p-1 hover:bg-white/10"><X /></button>
        </div>
        <div className="space-y-2">
          {lines.map(([n, num]) => (
            <a key={n} href={`tel:${num}`} className="flex items-center justify-between rounded-lg bg-navy-950 px-4 py-3 hover:bg-red-500/20">
              <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-red-400" />{n}</span>
              <b>{num}</b>
            </a>
          ))}
        </div>
        <p className="mb-2 mt-4 text-sm text-slate-400">Bagikan posisi Anda sekarang</p>
        <div className="grid grid-cols-2 gap-2">
          <a href={`https://wa.me/?text=${msg}`} target="_blank" rel="noreferrer" className="rounded-lg bg-green-500 py-2.5 text-center font-semibold text-navy-950">WhatsApp</a>
          <a href={`sms:?&body=${msg}`} className="rounded-lg bg-cyan-500 py-2.5 text-center font-semibold text-navy-950">SMS</a>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [pos, setPos] = useState(DEFAULT_POS);
  const [live, setLive] = useState(false);
  const [elev, setElev] = useState(null);
  const [base, setBase] = useState('sat');
  const [layers, setLayers] = useState({ hazard: true, route: true });
  const [navigating, setNavigating] = useState(false);
  const [focus, setFocus] = useState(0);
  const [sos, setSos] = useState(false);
  const m = useMaritime();

  const hazard = useMemo(buildHazardZones, []);
  const route = useMemo(() => buildRoute(pos, SHELTERS), [pos]);

  // Live position (HTML5 Geolocation); falls back to DEFAULT_POS if denied
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => { setPos({ lat: p.coords.latitude, lon: p.coords.longitude }); setLive(true); },
      () => setLive(false),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Elevation at the user's position (for elevation gain); refetched only on ~100 m moves
  const key = `${pos.lat.toFixed(3)},${pos.lon.toFixed(3)}`;
  useEffect(() => {
    fetch(`https://api.open-meteo.com/v1/elevation?latitude=${pos.lat}&longitude=${pos.lon}`)
      .then((r) => r.json()).then((d) => setElev(d.elevation?.[0] ?? null)).catch(() => setElev(null));
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const gain = elev == null ? null : Math.max(0, Math.round(route.shelter.elev - elev));

  const toggleNav = () => { setNavigating((n) => !n); setFocus((f) => f + 1); };
  const tabs = [
    { label: 'Peta Interaktif', on: layers.hazard && layers.route, act: () => setLayers({ hazard: true, route: true }) },
    { label: 'Zona Bahaya', on: layers.hazard, act: () => setLayers((l) => ({ ...l, hazard: !l.hazard })) },
    { label: 'Jalur Evakuasi', on: layers.route, act: () => setLayers((l) => ({ ...l, route: !l.route })) },
  ];
  const stats = [
    [Waves, 'Tinggi gelombang', `${m.wave} m`],
    [Wind, 'Kecepatan angin', `${m.wind} km/h`],
    [MoveVertical, 'Pasang surut', m.tide],
  ];

  return (
    <div className="flex h-dvh flex-col bg-navy-950 text-slate-100">
      {/* Desktop header */}
      <header className="hidden h-14 shrink-0 items-center gap-6 border-b border-cyan-400/15 bg-navy-900 px-5 lg:flex">
        {/* >>> SWAP LOGO */}
        <img src="/assets/team-logo.png" alt="Team Logo" className="h-9 w-9 rounded-full bg-white object-contain" />
        <span className="text-lg font-bold tracking-tight">COASTAL-RESCUE</span>
        <nav className="flex h-full flex-1 items-stretch gap-1">
          {tabs.map((t) => (
            <button key={t.label} aria-pressed={t.on} onClick={t.act} className={`border-b-2 px-4 text-sm font-medium ${t.on ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>{t.label}</button>
          ))}
          <button onClick={() => setSos(true)} className="border-b-2 border-transparent px-4 text-sm font-medium text-slate-400 hover:text-slate-200">Edukasi & Kontak</button>
        </nav>
        <button onClick={() => setSos(true)} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold hover:bg-red-400">Tombol Darurat</button>
      </header>

      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[28%_72%]">
        {/* Desktop sidebar (28%) */}
        <aside className="bathy hidden flex-col gap-3 overflow-y-auto p-4 lg:flex">
          <Card title="Posisi Anda">
            <p className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-blue-400" />{live ? 'Posisi Anda Saat Ini' : 'Lokasi contoh (izin lokasi belum aktif)'}</p>
            <p className="mt-1 text-xs text-slate-400">{pos.lat.toFixed(5)}, {pos.lon.toFixed(5)}</p>
          </Card>
          <Card title="Status maritim">
            <div className="mb-3 space-y-2">
              {stats.map(([Icon, l, v]) => (
                <div key={l} className="flex items-center gap-3"><Icon className="h-5 w-5 text-cyan-300" /><span className="flex-1 text-sm text-slate-300">{l}</span><b className="text-teal-300">{v}</b></div>
              ))}
            </div>
            <AlertBox m={m} />
          </Card>
          <Card title="Legenda risiko">
            {[['#EF4444', 'Risiko tinggi, 0–500 m dari pantai'], ['#F59E0B', 'Risiko sedang, 500 m–1 km'], ['#22C55E', 'Titik evakuasi dan jalur aman'], ['#3B82F6', 'Posisi Anda']].map(([c, t]) => (
              <p key={t} className="mb-1.5 flex items-center gap-2 text-sm text-slate-300"><span className="h-3 w-3 rounded-sm" style={{ background: c }} />{t}</p>
            ))}
          </Card>
          <Card title="Rekomendasi evakuasi">
            <p className="mb-3 text-sm text-slate-300">Titik terdekat: <b className="text-green-400">{route.shelter.name}</b></p>
            <div className="mb-3 grid grid-cols-3 gap-2 text-center">
              {[[route.km.toFixed(1), 'km'], [route.minutes, 'menit jalan'], [gain == null ? '–' : `+${gain}`, 'm naik']].map(([v, u]) => (
                <div key={u} className="rounded-lg bg-navy-950 py-2"><p className="text-lg font-bold text-cyan-300">{v}</p><p className="text-[11px] text-slate-400">{u}</p></div>
              ))}
            </div>
            <div className="mb-3"><Steps steps={route.steps} /></div>
            <button onClick={toggleNav} className="w-full rounded-lg bg-orange-500 py-2.5 font-bold text-white hover:bg-orange-400">{navigating ? 'Hentikan Evakuasi' : 'Mulai Evakuasi'}</button>
          </Card>
        </aside>

        {/* Map (72%) + mobile overlays */}
        <main className="relative h-full">
          <MapView pos={pos} base={base} hazard={hazard} shelters={SHELTERS} route={route} showHazard={layers.hazard} showRoute={layers.route} focus={focus} />

          <button onClick={() => setBase((b) => (b === 'sat' ? 'osm' : 'sat'))} className="absolute right-3 top-32 z-[1000] flex items-center gap-2 rounded-lg bg-navy-900/90 px-3 py-2 text-sm lg:right-16 lg:top-3">
            <Layers className="h-4 w-4 text-cyan-300" />{base === 'sat' ? 'Satelit' : 'Peta jalan'}
          </button>

          {/* Mobile floating top bar */}
          <div className="absolute inset-x-0 top-0 z-[1000] space-y-2 bg-gradient-to-b from-navy-950/95 to-transparent p-3 lg:hidden">
            <div className="flex items-center gap-2">
              <img src="/assets/team-logo.png" alt="Team Logo" className="h-8 w-8 rounded-full bg-white object-contain" />
              <span className="flex-1 font-bold">COASTAL-RESCUE</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${m.alert === 'AMAN' || m.alert === 'MEMUAT' ? 'bg-green-500 text-navy-950' : 'bg-red-500'}`}>{m.alert}</span>
              <button onClick={() => setSos(true)} className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-bold">SOS</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {tabs.map((t) => (
                <button key={t.label} aria-pressed={t.on} onClick={t.act} className={`rounded-lg py-2 text-xs font-medium ${t.on ? 'bg-cyan-500/25 text-cyan-200' : 'bg-navy-900/90 text-slate-400'}`}>{t.label}</button>
              ))}
            </div>
          </div>

          {/* Mobile bottom sheet */}
          <div className={`absolute inset-x-0 bottom-0 z-[1000] space-y-3 overflow-y-auto rounded-t-2xl border-t border-cyan-400/20 bg-navy-900/95 p-4 backdrop-blur transition-[max-height] duration-300 lg:hidden ${navigating ? 'max-h-[70%]' : 'max-h-60'}`}>
            <div className="mx-auto h-1 w-10 rounded-full bg-slate-500" />
            <button onClick={toggleNav} className="w-full rounded-lg bg-orange-500 py-3 text-lg font-bold text-white">{navigating ? 'Hentikan Evakuasi' : 'Mulai Evakuasi'}</button>
            <p className="text-center text-sm text-slate-300">{route.km.toFixed(1)} km ke Area Aman, sekitar {route.minutes} menit jalan kaki{gain != null && `, naik ${gain} m`}</p>
            <AlertBox m={m} />
            {navigating && <Steps steps={route.steps} />}
          </div>
        </main>
      </div>

      {sos && <SosModal pos={pos} onClose={() => setSos(false)} />}
    </div>
  );
}
