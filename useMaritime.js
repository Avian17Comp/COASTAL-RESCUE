'use client';
import { useEffect, useState } from 'react';
import { MOCK, LOADING } from './maritime';

// Polls /api/maritime every 10 min; falls back to MOCK if the call fails.
export function useMaritime() {
  const [data, setData] = useState(LOADING);
  useEffect(() => {
    let off = false;
    const load = () =>
      fetch('/api/maritime')
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((j) => !off && setData(j))
        .catch(() => !off && setData(MOCK));
    load();
    const t = setInterval(load, 600000);
    return () => { off = true; clearInterval(t); };
  }, []);
  return data;
}
