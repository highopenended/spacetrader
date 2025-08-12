import React from 'react';
import { subscribe, getAnchors } from '../anchors/AnchorsStore';
import { Anchor } from '../anchors/types';

const DumpsterVisionOverlay: React.FC = () => {
  const [anchors, setAnchorsState] = React.useState<Anchor[]>(() => getAnchors());

  React.useEffect(() => {
    return subscribe(setAnchorsState);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        pointerEvents: 'none',
      }}
    >
      {/* Placeholder green overlay for testing */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,255,0,0.15)' }} />
      {anchors.map((a) => (
        <div
          key={a.id}
          style={{
            position: 'absolute',
            left: `${a.xVw}vw`,
            bottom: `${a.bottomVh}vh`,
            transform: 'translate(-50%, 0) perspective(400px) rotateX(12deg)',
            color: '#9f9',
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
            fontSize: 10,
            textShadow: '0 0 4px rgba(144,255,144,0.8)',
            pointerEvents: 'none',
          }}
          aria-hidden
        >
          {a.label}
        </div>
      ))}
    </div>
  );
};

export default DumpsterVisionOverlay;


