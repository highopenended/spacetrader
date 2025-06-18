import React from 'react';
import './ScrApp.css';

interface ScrAppProps {
  children: React.ReactNode;
  onClick?: () => void;
}

const ScrApp: React.FC<ScrAppProps> = ({ children, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`scr-app ${onClick ? 'clickable' : ''}`}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

export default ScrApp; 