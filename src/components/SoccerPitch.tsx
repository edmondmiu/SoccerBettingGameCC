import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState } from '../App';

interface SoccerPitchProps {
  gameState: GameState;
}

export const SoccerPitch: React.FC<SoccerPitchProps> = ({
  gameState
}) => {
  // Extract values from gameState
  const homeTeam = gameState.currentMatch?.homeTeam || '';
  const awayTeam = gameState.currentMatch?.awayTeam || '';
  const homeScore = gameState.currentMatch?.homeScore || 0;
  const awayScore = gameState.currentMatch?.awayScore || 0;
  const lastEvent = gameState.matchEvents[gameState.matchEvents.length - 1];
  
  // For matchTimer, we'll need to pass it separately or calculate it
  const matchTimer = 45; // Placeholder - will need to be passed from Match component
  const [ballPosition, setBallPosition] = useState({ x: 80, y: 50 });
  const [isAttacking, setIsAttacking] = useState<'home' | 'away' | 'midfield'>('midfield');
  const [showGoalCelebration, setShowGoalCelebration] = useState(false);
  const [possession, setPossession] = useState<'home' | 'away'>('home');
  const [possessionPercentages, setPossessionPercentages] = useState({ home: 50, away: 50 });
  const [attackIntensity, setAttackIntensity] = useState(0);
  const [ballTrail, setBallTrail] = useState<Array<{x: number, y: number, id: number}>>([]);

  // Continuous ball movement with realistic patterns
  useEffect(() => {
    const interval = setInterval(() => {
      setBallPosition(prevPos => {
        let newX = prevPos.x;
        let newY = prevPos.y;
        
        // Determine current game phase based on time and score
        const timePhase = Math.floor(matchTimer / 15) % 6; // 6 different phases
        const scoreDifference = Math.abs(homeScore - awayScore);
        const isCloseGame = scoreDifference <= 1;
        const leadingTeam = homeScore > awayScore ? 'home' : 'away';
        
        // Dynamic movement based on game situation (adjusted for wider field)
        switch (timePhase) {
          case 0: // Early game - cautious play
            newX = 55 + Math.random() * 50; // Central area (wider field)
            newY = 30 + Math.random() * 40;
            setIsAttacking('midfield');
            const earlyPossession = Math.random() > 0.5 ? 'home' : 'away';
            setPossession(earlyPossession);
            setPossessionPercentages({ 
              home: 45 + Math.random() * 10, 
              away: 45 + Math.random() * 10 
            });
            setAttackIntensity(0.3);
            break;
            
          case 1: // Home team building attack
            newX = Math.min(prevPos.x + (Math.random() * 20 - 8), 140); // Move toward away goal
            newY = prevPos.y + (Math.random() * 20 - 10);
            setIsAttacking('home');
            setPossession('home');
            setPossessionPercentages({ 
              home: 55 + Math.random() * 15, 
              away: 30 + Math.random() * 15 
            });
            setAttackIntensity(0.6);
            break;
            
          case 2: // Counter-attack phase
            // Quick movement to opposite end
            if (possession === 'home') {
              newX = Math.max(prevPos.x - (Math.random() * 25 + 15), 20);
              setPossession('away');
              setIsAttacking('away');
              setPossessionPercentages({ 
                home: 35 + Math.random() * 10, 
                away: 55 + Math.random() * 10 
              });
            } else {
              newX = Math.min(prevPos.x + (Math.random() * 25 + 15), 140);
              setPossession('home');
              setIsAttacking('home');
              setPossessionPercentages({ 
                home: 55 + Math.random() * 10, 
                away: 35 + Math.random() * 10 
              });
            }
            newY = 25 + Math.random() * 50;
            setAttackIntensity(0.8);
            break;
            
          case 3: // Midfield battle
            newX = 50 + Math.random() * 60; // Stay in central areas (wider)
            newY = prevPos.y + (Math.random() * 15 - 7.5);
            setIsAttacking('midfield');
            setPossessionPercentages({ 
              home: 48 + Math.random() * 4, 
              away: 48 + Math.random() * 4 
            });
            setAttackIntensity(0.4);
            break;
            
          case 4: // Pressure phase (late game)
            if (isCloseGame) {
              // More aggressive attacking
              const targetEnd = Math.random() > 0.5 ? 140 : 20;
              newX = newX + (targetEnd - newX) * 0.3 + (Math.random() * 15 - 7.5);
              newY = 20 + Math.random() * 60;
              setIsAttacking(targetEnd > 80 ? 'home' : 'away');
              setPossessionPercentages({ 
                home: 45 + Math.random() * 10, 
                away: 45 + Math.random() * 10 
              });
              setAttackIntensity(0.9);
            } else {
              // Leading team defending
              if (leadingTeam === 'home') {
                newX = 25 + Math.random() * 40; // Defensive third
                setIsAttacking('away');
                setPossession('away');
                setPossessionPercentages({ 
                  home: 30 + Math.random() * 10, 
                  away: 60 + Math.random() * 10 
                });
              } else {
                newX = 95 + Math.random() * 40; // Defensive third
                setIsAttacking('home');
                setPossession('home');
                setPossessionPercentages({ 
                  home: 60 + Math.random() * 10, 
                  away: 30 + Math.random() * 10 
                });
              }
              newY = 25 + Math.random() * 50;
              setAttackIntensity(0.7);
            }
            break;
            
          case 5: // Final minutes - desperate attacks
            // Very dynamic movement
            const isDesperateAttack = Math.random() > 0.3;
            if (isDesperateAttack) {
              newX = 15 + Math.random() * 130;
              newY = Math.random() * 100;
              const desperateAttacker = Math.random() > 0.5 ? 'home' : 'away';
              setIsAttacking(desperateAttacker);
              setPossessionPercentages({ 
                home: desperateAttacker === 'home' ? 60 + Math.random() * 20 : 20 + Math.random() * 20, 
                away: desperateAttacker === 'away' ? 60 + Math.random() * 20 : 20 + Math.random() * 20 
              });
              setAttackIntensity(1.0);
            }
            break;
        }
        
        // Add some random variation for realism
        newX += (Math.random() - 0.5) * 8;
        newY += (Math.random() - 0.5) * 6;
        
        // Keep ball within bounds with some margin (adjusted for wider field)
        newX = Math.max(12, Math.min(148, newX));
        newY = Math.max(15, Math.min(85, newY));
        
        // Update ball trail for movement effect
        setBallTrail(prev => {
          const newTrail = [...prev, { x: newX, y: newY, id: Date.now() }].slice(-5);
          return newTrail;
        });

        // Ensure possession percentages add up to 100%
        setPossessionPercentages(prev => {
          const total = prev.home + prev.away;
          if (total !== 100) {
            const diff = 100 - total;
            return {
              home: Math.max(0, Math.min(100, prev.home + diff / 2)),
              away: Math.max(0, Math.min(100, prev.away + diff / 2))
            };
          }
          return prev;
        });
        
        return { x: newX, y: newY };
      });
    }, 800 + Math.random() * 400); // Much more frequent updates (800-1200ms)

    return () => clearInterval(interval);
  }, [matchTimer, homeScore, awayScore, possession]);

  // Additional micro-movements for realism
  useEffect(() => {
    const microInterval = setInterval(() => {
      setBallPosition(prev => ({
        x: prev.x + (Math.random() - 0.5) * 2, // Small random movements
        y: prev.y + (Math.random() - 0.5) * 1.5
      }));
    }, 300); // Very frequent micro-movements

    return () => clearInterval(microInterval);
  }, []);

  // React to match events with dramatic ball movement
  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === 'goal') {
      // Dramatic goal movement (adjusted for wider field)
      const isHomeGoal = lastEvent.scoringTeam === 'home';
      setBallPosition({ 
        x: isHomeGoal ? 145 : 15, 
        y: 48 + Math.random() * 8 
      });
      setShowGoalCelebration(true);
      setAttackIntensity(1.0);
      setTimeout(() => setShowGoalCelebration(false), 4000);
      
      // Reset to center after celebration
      setTimeout(() => {
        setBallPosition({ x: 80, y: 50 });
        setIsAttacking('midfield');
        setAttackIntensity(0.3);
      }, 3000);
    } else if (lastEvent.type === 'action') {
      // Respond to action events with specific movements (adjusted for wider field)
      if (lastEvent.description.includes('penalty')) {
        setBallPosition({ x: Math.random() > 0.5 ? 145 : 15, y: 50 });
        setAttackIntensity(1.0);
      } else if (lastEvent.description.includes('corner')) {
        setBallPosition({ 
          x: Math.random() > 0.5 ? 152 : 8, 
          y: Math.random() > 0.5 ? 18 : 82 
        });
        setAttackIntensity(0.8);
      } else if (lastEvent.description.includes('counter-attack')) {
        // Quick movement across field
        setBallPosition(prev => ({
          x: prev.x > 80 ? 35 : 125,
          y: 30 + Math.random() * 40
        }));
        setAttackIntensity(0.9);
      } else if (lastEvent.description.includes('one-on-one')) {
        setBallPosition({ x: Math.random() > 0.5 ? 125 : 35, y: 45 + Math.random() * 10 });
        setAttackIntensity(1.0);
      }
    }
  }, [lastEvent]);



  return (
    <div className="relative w-full h-52 sm:h-60 md:h-72 bg-gradient-to-br from-green-600 to-green-700 overflow-hidden rounded-lg border border-green-400/30">

      
      {/* Field markings */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 100" preserveAspectRatio="none">
        <defs>
          <pattern id="grass" patternUnits="userSpaceOnUse" width="4" height="4">
            <rect width="4" height="4" fill="none"/>
            <path d="M0,2 L2,0 M2,4 L4,2" stroke="rgba(255,255,255,0.1)" strokeWidth="0.2"/>
          </pattern>
        </defs>
        
        {/* Grass pattern */}
        <rect x="5" y="10" width="150" height="80" fill="url(#grass)" opacity="0.3"/>
        
        {/* Outer boundary */}
        <rect x="5" y="10" width="150" height="80" fill="none" stroke="white" strokeWidth="0.5" opacity="0.9"/>
        
        {/* Center line */}
        <line x1="80" y1="10" x2="80" y2="90" stroke="white" strokeWidth="0.5" opacity="0.9"/>
        
        {/* Center circle */}
        <circle cx="80" cy="50" r="8" fill="none" stroke="white" strokeWidth="0.5" opacity="0.9"/>
        <circle cx="80" cy="50" r="1" fill="white" opacity="0.9"/>
        
        {/* Left penalty area */}
        <rect x="5" y="30" width="20" height="40" fill="none" stroke="white" strokeWidth="0.5" opacity="0.9"/>
        <rect x="5" y="40" width="8" height="20" fill="none" stroke="white" strokeWidth="0.5" opacity="0.9"/>
        <circle cx="20" cy="50" r="8" fill="none" stroke="white" strokeWidth="0.5" opacity="0.9" clipPath="url(#leftBox)"/>
        
        {/* Right penalty area */}
        <rect x="135" y="30" width="20" height="40" fill="none" stroke="white" strokeWidth="0.5" opacity="0.9"/>
        <rect x="147" y="40" width="8" height="20" fill="none" stroke="white" strokeWidth="0.5" opacity="0.9"/>
        <circle cx="140" cy="50" r="8" fill="none" stroke="white" strokeWidth="0.5" opacity="0.9" clipPath="url(#rightBox)"/>
        
        {/* Goals */}
        <rect x="3" y="45" width="2" height="10" fill="white" opacity="0.9"/>
        <rect x="155" y="45" width="2" height="10" fill="white" opacity="0.9"/>
      </svg>



      {/* Enhanced possession indicator with percentages */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
        <motion.div 
          className={`flex items-center space-x-1 ${possession === 'home' ? 'text-blue-400' : 'text-blue-400/60'}`}
          animate={{ scale: possession === 'home' ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div className={`w-2 h-2 rounded-full ${possession === 'home' ? 'bg-blue-400' : 'bg-blue-400/30'}`} />
          <span className="text-xs font-medium">{Math.round(possessionPercentages.home)}%</span>
        </motion.div>
        
        <span className="text-white/60 text-xs">|</span>
        
        <motion.div 
          className={`flex items-center space-x-1 ${possession === 'away' ? 'text-red-400' : 'text-red-400/60'}`}
          animate={{ scale: possession === 'away' ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <span className="text-xs font-medium">{Math.round(possessionPercentages.away)}%</span>
          <div className={`w-2 h-2 rounded-full ${possession === 'away' ? 'bg-red-400' : 'bg-red-400/30'}`} />
        </motion.div>
      </div>

      {/* Ball trail effect */}
      {ballTrail.map((pos, index) => (
        <motion.div
          key={pos.id}
          className="absolute w-2 h-2 bg-white/30 rounded-full"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
          initial={{ opacity: 0.6, scale: 0.8 }}
          animate={{ opacity: 0, scale: 0.3 }}
          transition={{ duration: 1 }}
        />
      ))}

      {/* Main animated ball with enhanced effects */}
      <motion.div
        className="absolute w-3 h-3 bg-white rounded-full shadow-lg border border-gray-300"
        style={{
          left: `${ballPosition.x}%`,
          top: `${ballPosition.y}%`,
          transform: 'translate(-50%, -50%)'
        }}
        animate={{
          scale: [1, 1.1 + attackIntensity * 0.2, 1],
          rotate: matchTimer * 30 + attackIntensity * 180,
          boxShadow: [
            '0 2px 4px rgba(0,0,0,0.3)',
            `0 4px ${8 + attackIntensity * 4}px rgba(255,255,255,${0.2 + attackIntensity * 0.3})`,
            '0 2px 4px rgba(0,0,0,0.3)'
          ]
        }}
        transition={{
          scale: { duration: 0.5, repeat: Infinity },
          rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
          boxShadow: { duration: 1, repeat: Infinity },
          x: { type: "spring", stiffness: 100, damping: 20 },
          y: { type: "spring", stiffness: 100, damping: 20 }
        }}
      />

      {/* Enhanced goal celebration */}
      <AnimatePresence>
        {showGoalCelebration && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  rotate: [0, 360, 720],
                  y: [0, -10, 0]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-6 py-3 rounded-full font-bold text-lg shadow-lg"
              >
                ⚽ GOAL! ⚽
              </motion.div>
            </motion.div>
            
            {/* Celebration particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                style={{
                  left: '50%',
                  top: '50%'
                }}
                initial={{ opacity: 1, scale: 0 }}
                animate={{
                  opacity: 0,
                  scale: 1,
                  x: Math.cos(i * 45 * Math.PI / 180) * 100,
                  y: Math.sin(i * 45 * Math.PI / 180) * 100
                }}
                transition={{ duration: 2, delay: i * 0.1 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>




    </div>
  );
};