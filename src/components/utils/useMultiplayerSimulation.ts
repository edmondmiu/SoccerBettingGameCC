import { useState, useEffect, useCallback } from 'react';
import { FloatingEmojiData } from '../FloatingEmoji';
import { GameState } from '../../App';

interface PlayerReaction {
  playerId: string;
  emoji: string;
  timestamp: number;
}

interface BettingActivity {
  playerId: string;
  playerName: string;
  betType: string;
  amount: number;
  outcome: string;
  odds: number;
  timestamp: number;
  won?: boolean;
  teamName?: string;
}

interface MultiplayerData {
  playerCount: number;
  recentReactions: PlayerReaction[];
  recentBets: BettingActivity[];
  emojiQueue: FloatingEmojiData[];
}

const PLAYER_NAMES = [
  'Alex', 'Sam', 'Jordan', 'Casey', 'Taylor', 'Morgan',
  'Riley', 'Avery', 'Cameron', 'Blake', 'Quinn', 'Sage',
  'Phoenix', 'River', 'Skyler', 'Emery', 'Rowan', 'Finley'
];

const EMOJIS = ['😠', '😄', '😂', '😢'];

export function useMultiplayerSimulation(gameState: GameState) {
  const [multiplayerData, setMultiplayerData] = useState<MultiplayerData>({
    playerCount: Math.floor(Math.random() * 50) + 20, // 20-70 players
    recentReactions: [],
    recentBets: [],
    emojiQueue: []
  });

  const generateRandomPosition = useCallback(() => {
    const padding = 60;
    const maxWidth = typeof window !== 'undefined' ? window.innerWidth - padding * 2 : 300;
    const maxHeight = typeof window !== 'undefined' ? window.innerHeight - padding * 2 : 600;
    
    return {
      x: padding + Math.random() * maxWidth,
      y: padding + Math.random() * maxHeight * 0.6
    };
  }, []);

  const generatePlayerReaction = useCallback(() => {
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    const playerId = Math.random().toString(36).substring(7);
    const position = generateRandomPosition();
    
    const reaction: PlayerReaction = {
      playerId,
      emoji,
      timestamp: Date.now()
    };

    const floatingEmoji: FloatingEmojiData = {
      id: `mp-${playerId}-${Date.now()}`,
      emoji,
      x: position.x,
      y: position.y,
      isOwn: false
    };

    setMultiplayerData(prev => ({
      ...prev,
      recentReactions: [reaction, ...prev.recentReactions.slice(0, 19)], // Keep last 20
      emojiQueue: [floatingEmoji, ...prev.emojiQueue]
    }));

    return floatingEmoji;
  }, [generateRandomPosition]);

  const generateBettingActivity = useCallback(() => {
    const playerName = PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)];
    const playerId = Math.random().toString(36).substring(7);
    
    // Generate realistic betting activity based on current game state
    let betType: string;
    let outcome: string;
    let odds: number;
    let amount: number;
    
    if (gameState.phase === 'match' && gameState.currentMatch) {
      // During match - mix of full match bets and action bets
      if (Math.random() < 0.7) {
        // Full match bet
        betType = 'Match Result';
        const outcomes = ['home', 'draw', 'away'];
        const outcomeIndex = Math.floor(Math.random() * outcomes.length);
        outcome = outcomes[outcomeIndex];
        
        if (outcome === 'home') {
          odds = gameState.currentMatch.homeOdds;
        } else if (outcome === 'draw') {
          odds = gameState.currentMatch.drawOdds;
        } else {
          odds = gameState.currentMatch.awayOdds;
        }
      } else {
        // Action bet
        betType = 'Quick Bet';
        const actionOutcomes = ['Yes', 'No', 'Home Team', 'Away Team'];
        outcome = actionOutcomes[Math.floor(Math.random() * actionOutcomes.length)];
        odds = 1.8 + Math.random() * 1.2; // 1.8 to 3.0
      }
      amount = Math.floor(Math.random() * 200) + 25; // $25-$225
    } else {
      // Lobby betting
      betType = 'Match Result';
      const outcomes = ['Home Win', 'Draw', 'Away Win'];
      outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      odds = 1.5 + Math.random() * 2.5; // 1.5 to 4.0
      amount = Math.floor(Math.random() * 150) + 50; // $50-$200
    }

    const activity: BettingActivity = {
      playerId,
      playerName,
      betType,
      amount,
      outcome,
      odds: Math.round(odds * 10) / 10,
      timestamp: Date.now(),
      teamName: gameState.currentMatch ? 
        (outcome === 'home' ? gameState.currentMatch.homeTeam : 
         outcome === 'away' ? gameState.currentMatch.awayTeam : undefined) : undefined
    };

    setMultiplayerData(prev => ({
      ...prev,
      recentBets: [activity, ...prev.recentBets.slice(0, 19)] // Keep last 20
    }));

    return activity;
  }, [gameState]);

  const clearEmojiQueue = useCallback(() => {
    setMultiplayerData(prev => ({
      ...prev,
      emojiQueue: []
    }));
  }, []);

  // Simulate realistic emoji reactions based on game events
  useEffect(() => {
    if (gameState.phase !== 'match') return;

    const handleGameEvents = () => {
      // Check for recent goals or important events
      const recentEvents = gameState.matchEvents.slice(-2);
      
      recentEvents.forEach(event => {
        if (event.type === 'goal') {
          // Goal scored - burst of reactions
          const reactionCount = Math.floor(Math.random() * 8) + 3; // 3-10 reactions
          for (let i = 0; i < reactionCount; i++) {
            setTimeout(() => {
              generatePlayerReaction();
            }, i * 200 + Math.random() * 300);
          }
        } else if (event.type === 'action') {
          // Action betting event - some excited reactions
          const reactionCount = Math.floor(Math.random() * 4) + 1; // 1-4 reactions
          for (let i = 0; i < reactionCount; i++) {
            setTimeout(() => {
              generatePlayerReaction();
            }, i * 150 + Math.random() * 200);
          }
        }
      });
    };

    handleGameEvents();
  }, [gameState.matchEvents, generatePlayerReaction, gameState.phase]);

  // Random reactions and betting activity
  useEffect(() => {
    if (gameState.phase === 'lobby') return;

    const intervals = {
      reactions: setInterval(() => {
        if (Math.random() < 0.3) { // 30% chance every 3 seconds
          generatePlayerReaction();
        }
      }, 3000),

      betting: setInterval(() => {
        if (Math.random() < 0.4) { // 40% chance every 4 seconds
          generateBettingActivity();
        }
      }, 4000),

      playerCount: setInterval(() => {
        // Slight fluctuation in player count
        setMultiplayerData(prev => ({
          ...prev,
          playerCount: Math.max(15, prev.playerCount + Math.floor(Math.random() * 6) - 2)
        }));
      }, 10000)
    };

    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval));
    };
  }, [generatePlayerReaction, generateBettingActivity, gameState.phase]);

  // Simulate betting wins/losses resolution
  useEffect(() => {
    const resolveInterval = setInterval(() => {
      setMultiplayerData(prev => ({
        ...prev,
        recentBets: prev.recentBets.map(bet => {
          if (bet.won === undefined && Date.now() - bet.timestamp > 5000) {
            // Resolve bet after 5 seconds
            return {
              ...bet,
              won: Math.random() < 0.45 // 45% win rate
            };
          }
          return bet;
        })
      }));
    }, 2000);

    return () => clearInterval(resolveInterval);
  }, []);

  return {
    ...multiplayerData,
    clearEmojiQueue,
    generatePlayerReaction,
    generateBettingActivity
  };
}