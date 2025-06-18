import React from 'react';
import './TerminalScreen.css';
import CreditsApp from '../scr-apps/creditsApp/CreditsApp';
import DateApp from '../scr-apps/dateApp/DateApp';
import AgeApp from '../scr-apps/ageApp/AgeApp';
import JobTitleApp from '../scr-apps/jobTitleApp/JobTitleApp';
import { GamePhase, GameTime } from '../../types/gameState';

interface TerminalScreenProps {
  credits: number;
  gameTime: GameTime;
  gamePhase: GamePhase;
  isOnline?: boolean;
}

const TerminalScreen: React.FC<TerminalScreenProps> = ({ 
  credits, 
  gameTime, 
  gamePhase, 
  isOnline = true
}) => {
  return (
    <div className="terminal-screen">
      <div className="terminal-header">
        <div className="terminal-title">SCRAPCOM TERMINAL</div>
        <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
          <div className="status-light"></div>
          <div className="status-text">{isOnline ? 'ONLINE' : 'OFFLINE'}</div>
        </div>
      </div>
      <div className="terminal-content">  
        <CreditsApp credits={credits} />
        <JobTitleApp gamePhase={gamePhase} />
        <AgeApp gameTime={gameTime} />
        <DateApp gameTime={gameTime} gamePhase={gamePhase} />
      </div>
      <div className="terminal-scanlines"></div>
    </div>
  );
};

export default TerminalScreen; 