import { useEffect, useState } from 'react';
import './SplashScreen.css';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    // Fade in (600ms) → hold (1200ms) → fade out (600ms) → done
    const holdTimer  = setTimeout(() => setPhase('hold'), 600);
    const outTimer   = setTimeout(() => setPhase('out'),  1800);
    const doneTimer  = setTimeout(() => onComplete(),     2400);
    return () => {
      clearTimeout(holdTimer);
      clearTimeout(outTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div className={`splash-screen splash-screen--${phase}`}>
      <div className="splash-inner">
        <div className="splash-logo-wrap">
          <img
            src="/wucine_logo.png"
            alt="WU-CINE"
            className="splash-logo"
            draggable={false}
          />
        </div>
        <p className="splash-name">WU-CINE</p>
        <div className="splash-dots">
          <span className="splash-dot" />
          <span className="splash-dot" />
          <span className="splash-dot" />
        </div>
      </div>
    </div>
  );
}
