'use client';
import { useState } from 'react';
import Splash from '../components/Splash';
import Dashboard from '../components/Dashboard';

export default function Page() {
  const [phase, setPhase] = useState('splash'); // splash -> leaving -> app
  const enter = () => {
    setPhase('leaving'); // dashboard mounts under the fading splash
    setTimeout(() => setPhase('app'), 700);
  };
  return (
    <>
      {phase !== 'splash' && <Dashboard />}
      {phase !== 'app' && <Splash leaving={phase === 'leaving'} onEnter={enter} />}
    </>
  );
}
