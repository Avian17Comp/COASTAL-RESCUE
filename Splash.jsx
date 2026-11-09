'use client';

export default function Splash({ leaving, onEnter }) {
  return (
    <div
      className={`bathy fixed inset-0 z-[3000] flex flex-col items-center justify-center px-6 text-center transition-all duration-700 ${
        leaving ? 'pointer-events-none scale-105 opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative mb-10 grid place-items-center">
        {[0, 1, 2].map((i) => (
          <span key={i} className="ripple" style={{ animationDelay: `${i * 1.2}s` }} />
        ))}
        <div className="relative rounded-full bg-white p-2 shadow-[0_0_60px_rgba(45,212,191,.35)]">
          {/* >>> SWAP LOGO: put your file at public/assets/team-logo.png */}
          <img src="/assets/team-logo.png" alt="Team Logo" className="w-24 h-24 mx-auto object-contain animate-fade-in" />
        </div>
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-cyan-50 sm:text-6xl">COASTAL-RESCUE</h1>
      <p className="mt-3 max-w-md text-base text-slate-300 sm:text-lg">Platform Geospasial Mitigasi & Evakuasi Pesisir</p>
      <button
        onClick={onEnter}
        className="mt-10 rounded-xl bg-cyan-500 px-7 py-3.5 font-semibold text-navy-950 transition hover:bg-teal-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
      >
        Buka Peta Evakuasi / Enter Dashboard
      </button>
    </div>
  );
}
