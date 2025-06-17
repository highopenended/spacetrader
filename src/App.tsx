import React, { useState, useEffect } from 'react';
import TerminalScreen from './components/terminalScreen/TerminalScreen';
import AdminToolbar from './components/adminToolbar/AdminToolbar';
import GameAlert from './components/gameAlert/GameAlert';
import { useGameState_Credits } from './hooks/useGameState_Credits';
import { useGameState_Phases } from './hooks/useGameState_Phases';
import { useGameState_Time } from './hooks/useGameState_Time';

function App() {
  const { credits, updateCredits, setCredits, resetCredits } = useGameState_Credits();
  const { gamePhase, setGamePhase, advanceGamePhase, resetGamePhase } = useGameState_Phases();
  const { gameTime, setGameTime, isPaused, pauseTime, resumeTime, resetGameTime } = useGameState_Time();
  
  const [showStartupAlert, setShowStartupAlert] = useState(true);

  const resetGame = () => {
    resetCredits();
    resetGamePhase();
    resetGameTime();
    setShowStartupAlert(true); // Show startup alert again after reset
  };

  const startupMessage = `FROM: hr-assignments@scraptech-corp.net
TO: linerats-all@scraptech-corp.net
SUBJECT: MANDATORY - Work Assignment Notification
DATE: AR-242.LC-08.G-01
CLASSIFICATION: INTERNAL USE ONLY

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

Dear Employee,

You have been assigned to Position Classification: LINE RAT (Level 1)
Employee ID: [AUTOMATICALLY GENERATED]
Shift Assignment: Perpetual
Department: Scrap Processing Division - Bay 7-Alpha

JOB RESPONSIBILITIES:
• Retrieve scrap materials from intake conveyor system
• Process materials through designated scrap grinder unit
• Maintain continuous workflow until shift termination
• Report efficiency metrics to Bay Supervisor at end of each grind

PERFORMANCE EXPECTATIONS:
Your productivity is continuously monitored via embedded surveillance systems. Quota compliance is mandatory. Any deviation from assigned duties will result in disciplinary action per Corporate Policy 247-B.

EMPLOYEE BENEFITS:
As a valued member of the ScrapTech Corporation family, you should take pride in contributing to our mission of industrial efficiency. Remember: The Corporation values dedicated workers.

This is an automated message. Do not reply to this address.

Best regards,
ScrapTech Human Resources Department
"Building Tomorrow's Scrap, Today"

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

ACKNOWLEDGMENT REQUIRED - Please close this message to confirm receipt.`;

  return (
    <div className="App">
      <TerminalScreen 
        credits={credits}
        gameTime={gameTime}
        gamePhase={gamePhase}
        isOnline={!isPaused}
      />
      <AdminToolbar 
        credits={credits}
        gamePhase={gamePhase}
        gameTime={gameTime}
        updateCredits={updateCredits}
        setCredits={setCredits}
        setGamePhase={setGamePhase}
        setGameTime={setGameTime}
        advanceGamePhase={advanceGamePhase}
        isPaused={isPaused}
        pauseTime={pauseTime}
        resumeTime={resumeTime}
        resetGame={resetGame}
      />
      <GameAlert 
        message={startupMessage}
        isVisible={showStartupAlert}
        onClose={() => setShowStartupAlert(false)}
        pauseTime={pauseTime}
        resumeTime={resumeTime}
      />
    </div>
  );
}

export default App;
