import React from 'react';
import './TerminalScreen.css';
import CreditsApp from '../scr-apps/creditsApp/CreditsApp';
import DateApp from '../scr-apps/dateApp/DateApp';
import AgeApp from '../scr-apps/ageApp/AgeApp';
import JobTitleApp from '../scr-apps/jobTitleApp/JobTitleApp';
import ScrAppStore from '../scr-apps/scrAppStore/ScrAppStore';
import { GamePhase, GameTime } from '../../types/gameState';

interface TerminalScreenProps {
  credits: number;
  gameTime: GameTime;
  gamePhase: GamePhase;
  isOnline?: boolean;
  onAppClick?: (appType: string, title: string, content?: React.ReactNode) => void;
}

const TerminalScreen: React.FC<TerminalScreenProps> = ({ 
  credits, 
  gameTime, 
  gamePhase, 
  isOnline = true,
  onAppClick
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
        <CreditsApp 
          credits={credits} 
          onAppClick={() => onAppClick?.('credits', 'Credits Tracker')} 
        />
        <JobTitleApp 
          gamePhase={gamePhase} 
          onAppClick={() => onAppClick?.('jobTitle', 'Job Title')} 
        />
        <AgeApp 
          gameTime={gameTime} 
          onAppClick={() => onAppClick?.('age', 'Age Tracker')} 
        />
        <DateApp 
          gameTime={gameTime} 
          gamePhase={gamePhase} 
          onAppClick={() => onAppClick?.('date', 'Date Tracker')} 
        />
        <ScrAppStore 
          hasNewApps={true} 
          onAppClick={() => onAppClick?.('appStore', 'App Store')} 
        />
      </div>
      <div className="terminal-scanlines"></div>
    </div>
  );
};

export default TerminalScreen; 