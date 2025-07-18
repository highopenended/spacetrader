import React from 'react';
import './ScrAppItem.css';

interface ScrAppProps {
  children: React.ReactNode;
}

const ScrApp: React.FC<ScrAppProps> = ({ children }) => {
  return (
    <div className="scr-app">
      {children}
    </div>
  );
};

export default ScrApp; 