import React from 'react';

const DumpsterVisionOverlay: React.FC = () => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        background: 'rgba(0,255,0,0.5)',
        pointerEvents: 'none',
      }}
    />
  );
};

export default DumpsterVisionOverlay;


