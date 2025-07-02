import React from 'react';
import './TerminalScreen.css';
import CreditsApp from '../scr-apps/creditsApp/CreditsApp';
import DateApp from '../scr-apps/dateApp/DateApp';
import AgeApp from '../scr-apps/ageApp/AgeApp';
import JobTitleApp from '../scr-apps/jobTitleApp/JobTitleApp';
import ScrAppStore from '../scr-apps/scrAppStore/ScrAppStore';
import ScrAppDragWrapper from '../scr-apps/ScrApp-DragWrapper';
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
        <ScrAppDragWrapper 
          appId="credits"
          onAppClick={() => onAppClick?.('credits', 'Credits Tracker')}
        >
          <CreditsApp credits={credits} />
        </ScrAppDragWrapper>
        <ScrAppDragWrapper 
          appId="jobTitle"
          onAppClick={() => onAppClick?.('jobTitle', 'Job Title')}
        >
          <JobTitleApp gamePhase={gamePhase} />
        </ScrAppDragWrapper>
        <ScrAppDragWrapper 
          appId="age"
          onAppClick={() => onAppClick?.('age', 'Age Tracker')}
        >
          <AgeApp gameTime={gameTime} />
        </ScrAppDragWrapper>
        <ScrAppDragWrapper 
          appId="date"
          onAppClick={() => onAppClick?.('date', 'Date Tracker')}
        >
          <DateApp gameTime={gameTime} gamePhase={gamePhase} />
        </ScrAppDragWrapper>
        <ScrAppDragWrapper 
          appId="appStore"
          onAppClick={() => onAppClick?.('appStore', 'App Store')}
        >
          <ScrAppStore hasNewApps={true} />
        </ScrAppDragWrapper>
      </div>
      <div className="terminal-scanlines"></div>
    </div>
  );
};

export default TerminalScreen; 