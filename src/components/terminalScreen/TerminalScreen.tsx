import React from 'react';
import './TerminalScreen.css';
import CreditsTracker from '../creditsTracker/CreditsTracker';
import GameTimeTracker from '../gameTimeTracker/GameTimeTracker';
import AgeTracker from '../ageTracker/AgeTracker';
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
        <div className="terminal-window">
          <CreditsTracker credits={credits} />
        </div>      
        <div className="terminal-window">
          <AgeTracker gameTime={gameTime} />
        </div>
        <div className="terminal-window">
          <GameTimeTracker gameTime={gameTime} gamePhase={gamePhase} />
        </div>
      </div>
      <div className="terminal-scanlines"></div>
    </div>
  );
};

export default TerminalScreen; 