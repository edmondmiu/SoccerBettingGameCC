import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ArrowLeft, Clock, Pause, Play, Zap, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { Header } from './Header';
import { GameState, Bet, ActionEvent, PowerUp, BetslipSelection } from '../App';
import { ActionBettingModal } from './ActionBettingModal';
import { MatchEvents } from './MatchEvents';
import { BettingSummary } from './BettingSummary';
import { SoccerPitchWithSocial } from './SoccerPitchWithSocial';
import { StickyBettingDrawer } from './StickyBettingDrawer';
import { LiveBettingFeed } from './LiveBettingFeed';
import { useMultiplayerSimulation } from './utils/useMultiplayerSimulation';

interface MatchProps {
  gameState: GameState;
  updateGameState: (updates: Partial<GameState>) => void;
  addBet: (bet: Bet) => void;
  resolveBet: (betId: string, won: boolean, payout?: number) => void;
  awardPowerUp: () => void;
  usePowerUp: (betId: string) => void;
  showMatchSummary: () => void;
  addToBetslip: (selection: BetslipSelection) => void;
  triggerBetFeedback: (startElement: HTMLElement | null, endElement: HTMLElement | null, betAmount: number) => void;
}

export function Match({
  gameState,
  updateGameState,
  addBet,
  resolveBet,
  awardPowerUp,
  usePowerUp,
  showMatchSummary,
  addToBetslip,
  triggerBetFeedback
}: MatchProps) {
  const [matchTimer, setMatchTimer] = useState(0);
  const [isMatchRunning, setIsMatchRunning] = useState(true);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [currentActionEvent, setCurrentActionEvent] = useState<ActionEvent | null>(null);
  const [actionBettingTimer, setActionBettingTimer] = useState(15);
  const [commentaryExpanded, setCommentaryExpanded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const actionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingScore = useRef(false);

  // Social features state
  const [showEmojiReactions, setShowEmojiReactions] = useState(true);
  const [showLiveBetting, setShowLiveBetting] = useState(true);

  // Store initial odds to calculate changes from
  const [initialOdds, setInitialOdds] = useState<{home: number, draw: number, away: number} | null>(null);

  // Multiplayer simulation hook
  const { 
    playerCount, 
    recentBets, 
    emojiQueue, 
    clearEmojiQueue,
    generatePlayerReaction 
  } = useMultiplayerSimulation(gameState);

  // Set initial odds when match starts
  useEffect(() => {
    if (gameState.currentMatch && !initialOdds) {
      setInitialOdds({
        home: gameState.currentMatch.homeOdds,
        draw: gameState.currentMatch.drawOdds,
        away: gameState.currentMatch.awayOdds
      });
    }
  }, [gameState.currentMatch, initialOdds]);

  // Dynamic odds calculation based on match state
  const calculateDynamicOdds = useCallback((time: number, homeScore: number, awayScore: number) => {
    if (!initialOdds || !gameState.currentMatch || isUpdatingScore.current || !isMatchRunning) return;

    const timeRemaining = Math.max(0, 90 - time);
    const scoreDifference = homeScore - awayScore;
    const totalGoals = homeScore + awayScore;
    
    // Base odds adjustment factors
    let homeMultiplier = 1;
    let drawMultiplier = 1;
    let awayMultiplier = 1;
    
    // Score-based adjustments
    if (scoreDifference > 0) {
      // Home team leading
      homeMultiplier *= Math.max(0.4, 1 - (scoreDifference * 0.3));
      awayMultiplier *= 1 + (scoreDifference * 0.4);
      drawMultiplier *= 1 + (scoreDifference * 0.2);
    } else if (scoreDifference < 0) {
      // Away team leading
      awayMultiplier *= Math.max(0.4, 1 - (Math.abs(scoreDifference) * 0.3));
      homeMultiplier *= 1 + (Math.abs(scoreDifference) * 0.4);
      drawMultiplier *= 1 + (Math.abs(scoreDifference) * 0.2);
    }
    
    // Time-based adjustments (less time = harder to come back)
    const timeWeight = timeRemaining / 90;
    if (scoreDifference !== 0) {
      const leadingMultiplier = Math.max(0.3, 0.8 + (1 - timeWeight) * 0.5);
      const trailingMultiplier = 1 + (1 - timeWeight) * 0.8;
      
      if (scoreDifference > 0) {
        homeMultiplier *= leadingMultiplier;
        awayMultiplier *= trailingMultiplier;
      } else {
        awayMultiplier *= leadingMultiplier;
        homeMultiplier *= trailingMultiplier;
      }
    }
    
    // High-scoring game adjustments (less likely for draws)
    if (totalGoals >= 3) {
      drawMultiplier *= 1 + (totalGoals - 2) * 0.15;
    }
    
    // Late game draw adjustments
    if (scoreDifference === 0 && time > 75) {
      drawMultiplier *= Math.max(0.7, 1 - (time - 75) / 30 * 0.3);
    }

    // Recent goal momentum (if last event was a goal within 5 minutes)
    const recentGoalEvent = gameState.matchEvents
      .filter(event => event.type === 'goal' && time - event.time <= 5)
      .sort((a, b) => b.time - a.time)[0];
    
    if (recentGoalEvent) {
      const momentumBoost = Math.max(0, (5 - (time - recentGoalEvent.time)) / 5 * 0.15);
      if (recentGoalEvent.scoringTeam === 'home') {
        homeMultiplier *= (1 - momentumBoost);
        awayMultiplier *= (1 + momentumBoost * 0.5);
      } else {
        awayMultiplier *= (1 - momentumBoost);
        homeMultiplier *= (1 + momentumBoost * 0.5);
      }
    }

    // Calculate new odds (ensure minimums)
    const newHomeOdds = Math.max(1.1, Math.round((initialOdds.home * homeMultiplier) * 10) / 10);
    const newDrawOdds = Math.max(1.8, Math.round((initialOdds.draw * drawMultiplier) * 10) / 10);
    const newAwayOdds = Math.max(1.1, Math.round((initialOdds.away * awayMultiplier) * 10) / 10);

    // Update odds if they've changed significantly (by at least 0.1)
    if (Math.abs(newHomeOdds - gameState.currentMatch.homeOdds) >= 0.1 ||
        Math.abs(newDrawOdds - gameState.currentMatch.drawOdds) >= 0.1 ||
        Math.abs(newAwayOdds - gameState.currentMatch.awayOdds) >= 0.1) {
      
      updateGameState({
        currentMatch: {
          ...gameState.currentMatch,
          homeOdds: newHomeOdds,
          drawOdds: newDrawOdds,
          awayOdds: newAwayOdds
        }
      });
    }
  }, [initialOdds, gameState.currentMatch, gameState.matchEvents, updateGameState]);

  useEffect(() => {
    if (isMatchRunning && matchTimer < 90) {
      intervalRef.current = setInterval(() => {
        setMatchTimer(prev => {
          const newTime = prev + 1;
          
          // Generate kick-off event
          if (newTime === 1) {
            generateKickOffEvent();
          }
          
          // Generate additional early excitement events
          if (newTime === 3) {
            const earlyEvent: ActionEvent = {
              id: Date.now().toString(),
              time: newTime,
              type: 'commentary',
              description: `🏃‍♂️ Both teams look sharp in these opening exchanges!`
            };
            updateGameState({
              matchEvents: [...gameState.matchEvents, earlyEvent]
            });
          }
          
          if (newTime === 8) {
            const earlyEvent: ActionEvent = {
              id: Date.now().toString(),
              time: newTime,
              type: 'commentary',
              description: `⚡ The pace is picking up - this promises to be an exciting match!`
            };
            updateGameState({
              matchEvents: [...gameState.matchEvents, earlyEvent]
            });
          }
          
          // Generate random events with higher frequency for excitement
          const eventChance = newTime < 15 ? 0.15 : // 15% chance in first 15 seconds for initial excitement
                             newTime > 75 ? 0.12 : // 12% chance in final 15 minutes for drama
                             0.08; // 8% chance normally (much higher than before)
          
          if (Math.random() < eventChance) {
            generateRandomEvent(newTime);
          }
          
          // Update dynamic odds every 20 seconds (less frequent to avoid conflicts)
          if (newTime % 20 === 0 && !isUpdatingScore.current) {
            // Direct call without setTimeout to avoid stale closures
            calculateDynamicOdds(newTime, gameState.currentMatch?.homeScore || 0, gameState.currentMatch?.awayScore || 0);
          }
          
          // Check if match is finished
          if (newTime >= 90) {
            setIsMatchRunning(false);
            resolveAllBets(newTime);
            return 90;
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMatchRunning, matchTimer, calculateDynamicOdds]);

  const generateKickOffEvent = useCallback(() => {
    const kickOffEvent: ActionEvent = {
      id: Date.now().toString(),
      time: 0,
      type: 'commentary',
      description: `⚽ The match is underway! ${gameState.currentMatch!.homeTeam} vs ${gameState.currentMatch!.awayTeam} kicks off!`
    };
    
    updateGameState({
      matchEvents: [...gameState.matchEvents, kickOffEvent]
    });
  }, [gameState.currentMatch, gameState.matchEvents, updateGameState]);

  const generateRandomEvent = useCallback((time: number) => {
    // Weight the event types for more excitement - more commentary and action betting
    const eventTypes = ['goal', 'action', 'action', 'commentary', 'commentary', 'commentary'];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)] as ActionEvent['type'];
    
    let newEvent: ActionEvent;
    
    if (eventType === 'goal') {
      const scoringTeam = Math.random() < 0.5 ? 'home' : 'away';
      newEvent = {
        id: Date.now().toString(),
        time,
        type: 'goal',
        description: `GOAL! ${scoringTeam === 'home' ? gameState.currentMatch!.homeTeam : gameState.currentMatch!.awayTeam} scores!`,
        scoringTeam
      };
      
      // Set flag to prevent odds calculation during score update
      isUpdatingScore.current = true;
      
      // Update score and match events together
      const newHomeScore = scoringTeam === 'home' ? gameState.currentMatch!.homeScore + 1 : gameState.currentMatch!.homeScore;
      const newAwayScore = scoringTeam === 'away' ? gameState.currentMatch!.awayScore + 1 : gameState.currentMatch!.awayScore;
      
      // Update both score and events in a single state update
      updateGameState({
        currentMatch: {
          ...gameState.currentMatch!,
          homeScore: newHomeScore,
          awayScore: newAwayScore
        },
        matchEvents: [...gameState.matchEvents, newEvent]
      });
      
      // Update odds after a brief delay, then clear the flag
      setTimeout(() => {
        calculateDynamicOdds(time, newHomeScore, newAwayScore);
        isUpdatingScore.current = false;
      }, 100);
      
      // Don't update events again below since we already did it
      return;
    } else if (eventType === 'action') {
      // Enhanced variety of action betting opportunities
      const actionBettingTypes = [
        // Card-related bets
        {
          description: "Will there be a card in the next 30 seconds?",
          options: [
            { label: 'Yes', odds: 2.1, outcome: 'yes' },
            { label: 'No', odds: 1.8, outcome: 'no' }
          ]
        },
        {
          description: "Will the next card be shown to the home team?",
          options: [
            { label: 'Home Team', odds: 2.0, outcome: 'home' },
            { label: 'Away Team', odds: 2.0, outcome: 'away' }
          ]
        },
        
        // Corner kick bets
        {
          description: "Will there be a corner kick in the next 45 seconds?",
          options: [
            { label: 'Yes', odds: 2.3, outcome: 'yes' },
            { label: 'No', odds: 1.6, outcome: 'no' }
          ]
        },
        {
          description: "Which team will win the next corner kick?",
          options: [
            { label: gameState.currentMatch!.homeTeam, odds: 1.9, outcome: 'home' },
            { label: gameState.currentMatch!.awayTeam, odds: 1.9, outcome: 'away' }
          ]
        },
        
        // Shot attempts
        {
          description: "Will there be a shot on target in the next 60 seconds?",
          options: [
            { label: 'Yes', odds: 1.7, outcome: 'yes' },
            { label: 'No', odds: 2.2, outcome: 'no' }
          ]
        },
        {
          description: "Which team will have the next shot attempt?",
          options: [
            { label: gameState.currentMatch!.homeTeam, odds: 1.8, outcome: 'home' },
            { label: gameState.currentMatch!.awayTeam, odds: 2.1, outcome: 'away' }
          ]
        },
        
        // Possession and play style
        {
          description: "Will the ball go out of play in the next 20 seconds?",
          options: [
            { label: 'Yes', odds: 1.9, outcome: 'yes' },
            { label: 'No', odds: 1.9, outcome: 'no' }
          ]
        },
        {
          description: "Will there be a throw-in in the next 30 seconds?",
          options: [
            { label: 'Yes', odds: 2.0, outcome: 'yes' },
            { label: 'No', odds: 1.8, outcome: 'no' }
          ]
        },
        
        // Goalkeeper actions
        {
          description: "Will the goalkeeper make a save in the next 45 seconds?",
          options: [
            { label: 'Home GK', odds: 2.5, outcome: 'home' },
            { label: 'Away GK', odds: 2.5, outcome: 'away' },
            { label: 'Neither', odds: 1.5, outcome: 'neither' }
          ]
        },
        {
          description: "Will there be a goalkeeper kick in the next 30 seconds?",
          options: [
            { label: 'Yes', odds: 1.6, outcome: 'yes' },
            { label: 'No', odds: 2.3, outcome: 'no' }
          ]
        },
        
        // Free kicks and fouls
        {
          description: "Will there be a free kick awarded in the next 40 seconds?",
          options: [
            { label: 'Yes', odds: 2.0, outcome: 'yes' },
            { label: 'No', odds: 1.8, outcome: 'no' }
          ]
        },
        {
          description: "Which half of the pitch will the next foul occur in?",
          options: [
            { label: 'Home Half', odds: 1.9, outcome: 'home-half' },
            { label: 'Away Half', odds: 1.9, outcome: 'away-half' }
          ]
        },
        
        // Substitution bets (later in the match)
        ...(time > 60 ? [{
          description: "Will there be a substitution in the next 2 minutes?",
          options: [
            { label: 'Yes', odds: 2.8, outcome: 'yes' },
            { label: 'No', odds: 1.4, outcome: 'no' }
          ]
        }] : []),
        
        // Offside calls
        {
          description: "Will there be an offside call in the next 50 seconds?",
          options: [
            { label: 'Yes', odds: 2.4, outcome: 'yes' },
            { label: 'No', odds: 1.6, outcome: 'no' }
          ]
        },
        
        // Next goal scorer (if match is active)
        ...(time > 15 && time < 80 && (gameState.currentMatch!.homeScore + gameState.currentMatch!.awayScore) < 4 ? [{
          description: "Who will score the next goal?",
          options: [
            { label: gameState.currentMatch!.homeTeam, odds: 2.1, outcome: 'home' },
            { label: gameState.currentMatch!.awayTeam, odds: 2.3, outcome: 'away' },
            { label: 'No Goal', odds: 1.8, outcome: 'no-goal' }
          ]
        }] : []),
        
        // Time-based events
        {
          description: "Will the referee check his watch in the next 25 seconds?",
          options: [
            { label: 'Yes', odds: 2.6, outcome: 'yes' },
            { label: 'No', odds: 1.5, outcome: 'no' }
          ]
        },
        
        // Crowd and atmosphere
        {
          description: "Will there be a notable crowd reaction in the next 35 seconds?",
          options: [
            { label: 'Yes', odds: 1.9, outcome: 'yes' },
            { label: 'No', odds: 1.9, outcome: 'no' }
          ]
        }
      ];
      
      // Select random action betting type
      const selectedActionBet = actionBettingTypes[Math.floor(Math.random() * actionBettingTypes.length)];
      
      newEvent = {
        id: Date.now().toString(),
        time,
        type: 'action',
        description: selectedActionBet.description,
        bettingOptions: selectedActionBet.options
      };
      
      // Pause match and open action betting modal
      setIsMatchRunning(false);
      setCurrentActionEvent(newEvent);
      setActionModalOpen(true);
      setActionBettingTimer(15);
      
      // Start action betting countdown
      actionTimerRef.current = setInterval(() => {
        setActionBettingTimer(prev => {
          if (prev <= 1) {
            setActionModalOpen(false);
            setCurrentActionEvent(null);
            setIsMatchRunning(true);
            if (actionTimerRef.current) {
              clearInterval(actionTimerRef.current);
            }
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Time-based commentary for more excitement
      const earlyGameCommentary = [
        `⚡ Fast-paced start to this match!`,
        `🏃‍♂️ ${gameState.currentMatch!.homeTeam} pressing high early on!`,
        `🔥 ${gameState.currentMatch!.awayTeam} looking to settle into their rhythm.`,
        `👏 Great energy from both sides in these opening minutes!`,
        `⚽ Early chances being created here!`,
        `🎯 Both teams testing each other out.`,
        `🚀 The tempo is electric from the start!`
      ];
      
      const midGameCommentary = [
        `💪 Great play by ${gameState.currentMatch!.homeTeam}!`,
        `⚡ ${gameState.currentMatch!.awayTeam} looking dangerous on the counter-attack!`,
        `🙌 The crowd is on their feet!`,
        `🥅 What a save by the goalkeeper!`,
        `👨‍⚖️ Close call from the referee there.`,
        `🔥 Both teams giving their all in this intense match!`,
        `🏃‍♂️ End-to-end action here!`,
        `⚽ Brilliant ball control on display!`,
        `🎯 The pressure is building!`,
        `💥 What a tackle!`,
        `🚀 Quick passing move there!`,
        `👏 The quality of play is impressive!`,
        `⚡ Lightning-fast counter attack!`,
        `🔥 The intensity is rising!`,
        `🎭 Skillful play from both sides!`
      ];
      
      const lateGameCommentary = [
        `⏰ Time is running out!`,
        `🔥 The tension is palpable!`,
        `💥 Every second counts now!`,
        `🚨 Desperate defending here!`,
        `⚡ Final push from both teams!`,
        `🎯 This could be decisive!`,
        `💪 Last-ditch effort!`,
        `🙏 Nerves of steel required!`,
        `⏳ The clock is ticking!`,
        `🔥 All or nothing now!`,
        `🎭 Drama in the final minutes!`,
        `💥 What a crucial moment!`
      ];
      
      const commentaryPool = time < 15 ? earlyGameCommentary :
                           time > 75 ? lateGameCommentary :
                           midGameCommentary;
      
      newEvent = {
        id: Date.now().toString(),
        time,
        type: 'commentary',
        description: commentaryPool[Math.floor(Math.random() * commentaryPool.length)]
      };
    }
    
    // Only update match events if we haven't already done so (for non-goal events)
    updateGameState({
      matchEvents: [...gameState.matchEvents, newEvent]
    });
  }, [gameState.currentMatch, gameState.matchEvents, updateGameState, calculateDynamicOdds]);

  const resolveAllBets = (finalTime: number) => {
    const finalScore = gameState.currentMatch!;
    let winner: 'home' | 'draw' | 'away';
    
    if (finalScore.homeScore > finalScore.awayScore) {
      winner = 'home';
    } else if (finalScore.awayScore > finalScore.homeScore) {
      winner = 'away';
    } else {
      winner = 'draw';
    }
    
    gameState.activeBets.forEach(bet => {
      if (bet.type === 'full-match' && !bet.resolved) {
        const won = bet.outcome === winner;
        const payout = won ? bet.amount * bet.odds : 0;
        resolveBet(bet.id, won, payout);
        
        if (won) {
          // Match bet won
        } else {
          // Match bet lost
        }
      }
    });
    
    // Show match finished message and transition to summary
    setTimeout(() => {
      // Match finished
      setTimeout(() => {
        showMatchSummary();
      }, 2000);
    }, 1000);
  };

  const handleActionBet = (outcome: string, odds: number, amount: number) => {
    if (amount > gameState.wallet) {
      // Insufficient funds
      return;
    }
    
    const bet: Bet = {
      id: Date.now().toString(),
      type: 'action',
      outcome,
      odds,
      amount,
      timestamp: Date.now(),
      powerUpApplied: gameState.powerUp !== null,
      eventId: currentActionEvent?.id
    };
    
    // Trigger bet feedback animation from modal to betting summary (only if enabled)
    if (gameState.settings.betAnimations) {
      const modalElement = document.querySelector('[data-testid="action-betting-modal"]');
      const summaryElement = document.querySelector('[data-testid="betting-summary"]');
      console.log('🔍 Action bet elements:', { modalElement, summaryElement });
      if (modalElement && summaryElement) {
        triggerBetFeedback(modalElement, summaryElement, amount);
      } else {
        console.log('❌ Could not find animation elements for action bet');
      }
    }
    
    addBet(bet);
    
    // Exciting bet placement feedback
    const potentialWin = amount * odds * (gameState.powerUp ? 2 : 1);
    // Action bet placed
    
    if (gameState.powerUp) {
      usePowerUp(bet.id);
      // Power-up applied
    }
    
    // Resolve action bet after a short delay
    setTimeout(() => {
      const won = Math.random() < 0.6; // 60% chance to win
      const multiplier = bet.powerUpApplied ? 2 : 1;
      const basePayout = won ? bet.amount * bet.odds : 0;
      const finalPayout = basePayout * multiplier;
      
      resolveBet(bet.id, won, finalPayout);
      
      // Also resolve the action event with the result
      if (currentActionEvent) {
        const result = won ? bet.outcome : (bet.outcome === 'yes' ? 'no' : 'yes');
        updateGameState({
          matchEvents: gameState.matchEvents.map(event => 
            event.id === currentActionEvent.id 
              ? { ...event, resolved: true, result }
              : event
          )
        });
      }
      
      if (won) {
        // Action bet won
        if (!gameState.classicMode) {
          awardPowerUp();
        }
      } else {
        // Action bet lost
      }
    }, 3000);
  };

  // Direct bet placement function for StickyBettingDrawer
  const handleDirectBetPlacement = (selection: BetslipSelection) => {
    // Use the amount from the selection to avoid race conditions
    const betAmount = selection.amount;
    
    if (betAmount > gameState.wallet) {
      toast.error('💸 Insufficient funds', {
        description: `You need ${betAmount} but only have ${gameState.wallet.toFixed(2)}`,
        duration: 3000,
      });
      return;
    }

    if (betAmount <= 0) {
      // Invalid bet amount
      return;
    }

    const bet: Bet = {
      id: Date.now().toString(),
      type: 'full-match',
      outcome: selection.outcome,
      odds: selection.odds,
      amount: betAmount,
      timestamp: Date.now(),
      matchId: selection.matchId,
      homeTeam: selection.homeTeam,
      awayTeam: selection.awayTeam
    };

    // Animation is already handled by StickyBettingDrawer itself
    // No need to trigger another animation here

    addBet(bet);
    
    // Exciting bet placement feedback
    const potentialWin = betAmount * selection.odds;
    // Match bet placed
  };

  const handleAddToBetslip = (selection: BetslipSelection) => {
    // Use the amount from the selection to avoid race conditions
    const betAmount = selection.amount;
    
    if (betAmount > gameState.wallet) {
      toast.error('💸 Insufficient funds', {
        description: `You need ${betAmount} but only have ${gameState.wallet.toFixed(2)}`,
        duration: 3000,
      });
      return;
    }

    if (betAmount <= 0) {
      // Invalid bet amount
      return;
    }

    const bet: Bet = {
      id: Date.now().toString(),
      type: 'full-match',
      outcome: selection.outcome,
      odds: selection.odds,
      amount: betAmount,
      timestamp: Date.now(),
      matchId: selection.matchId,
      homeTeam: selection.homeTeam,
      awayTeam: selection.awayTeam
    };

    addBet(bet);
    
    // Exciting bet placement feedback
    const potentialWin = betAmount * selection.odds;
    // Match bet placed
  };

  if (!gameState.currentMatch) return null;

  const formatMatchTime = (minutes: number): string => {
    // Convert 0-based timer to 1-based display (0 becomes 1, 89 becomes 90)
    const displayMinutes = Math.min(minutes + 1, 90);
    return `${displayMinutes}'`;
  };

  const progressPercentage = (matchTimer / 90) * 100;

  // Debug functions for manually triggering events
  const handleDebugActionBet = () => {
    if (isMatchRunning) {
      const debugEvent: ActionEvent = {
        id: `debug-${Date.now()}`,
        time: matchTimer,
        type: 'action',
        description: '🧪 Debug Action Event - Manual trigger for testing betting interface',
        bettingOptions: [
          { label: 'Yes', odds: 2.1, outcome: 'yes' },
          { label: 'No', odds: 1.8, outcome: 'no' }
        ]
      };
      
      updateGameState({
        matchEvents: [...gameState.matchEvents, debugEvent]
      });
      
      setIsMatchRunning(false);
      setCurrentActionEvent(debugEvent);
      setActionModalOpen(true);
      setActionBettingTimer(15);
      
      // Start countdown timer for this action
      actionTimerRef.current = setInterval(() => {
        setActionBettingTimer(prev => {
          if (prev <= 1) {
            setActionModalOpen(false);
            setCurrentActionEvent(null);
            setIsMatchRunning(true);
            if (actionTimerRef.current) {
              clearInterval(actionTimerRef.current);
            }
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleDebugMatchSummary = () => {
    // Manually trigger match summary (end match early)
    showMatchSummary();
  };

  // Social features handlers
  const handleEmojiSent = useCallback((emoji: string) => {
    // Trigger reactions from other players based on your emoji
    const reactionChance = 0.3; // 30% chance others react
    const reactionCount = Math.floor(Math.random() * 3) + 1; // 1-3 reactions
    
    for (let i = 0; i < reactionCount; i++) {
      if (Math.random() < reactionChance) {
        setTimeout(() => {
          generatePlayerReaction();
        }, (i + 1) * 500 + Math.random() * 1000);
      }
    }
  }, [generatePlayerReaction]);


  // Clear emoji queue when component unmounts or match changes
  useEffect(() => {
    return () => {
      clearEmojiQueue();
    };
  }, [clearEmojiQueue]);

  // Trigger emoji reactions for exciting match moments
  useEffect(() => {
    if (gameState.matchEvents.length > 0) {
      const lastEvent = gameState.matchEvents[gameState.matchEvents.length - 1];
      
      if (lastEvent.type === 'goal') {
        // Generate excited reactions for goals
        setTimeout(() => {
          const reactionCount = Math.floor(Math.random() * 6) + 2; // 2-7 reactions
          for (let i = 0; i < reactionCount; i++) {
            setTimeout(() => {
              generatePlayerReaction();
            }, i * 200);
          }
        }, 500);
      }
    }
  }, [gameState.matchEvents, generatePlayerReaction]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative pb-32">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>

      {/* Header */}
      <Header 
        gameState={gameState} 
        showBackButton 
        onBackClick={() => showMatchSummary()}
        onDebugActionBet={handleDebugActionBet}
        onDebugMatchSummary={handleDebugMatchSummary}
        updateGameState={updateGameState}
      />

      <div className="max-w-md mx-auto space-y-4 relative z-10 p-3">
        {/* Betting summary at the top */}
        <BettingSummary 
          activeBets={gameState.activeBets}
          powerUpAvailable={!!gameState.powerUp}
          onUsePowerUp={(betId) => usePowerUp(betId)}
        />

        {/* Match info card */}
        <Card className="backdrop-blur-md bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/30 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <Badge variant="outline" className="bg-red-500/20 border-red-400/30 text-red-300 text-xs">
                  LIVE
                </Badge>
                <div className="flex items-center gap-1 text-gray-300 text-xs">
                  <Clock size={12} />
                  {formatMatchTime(matchTimer)}
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-gray-400 text-xs">{gameState.currentMatch.homeTeam}</p>
                  <p className="text-white text-3xl font-bold">{gameState.currentMatch.homeScore}</p>
                </div>
                <div className="text-gray-400 text-xl">-</div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs">{gameState.currentMatch.awayTeam}</p>
                  <p className="text-white text-3xl font-bold">{gameState.currentMatch.awayScore}</p>
                </div>
              </div>

              <Progress value={progressPercentage} className="w-full h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Soccer pitch with integrated social features */}
        <SoccerPitchWithSocial 
          gameState={gameState}
          matchTimer={matchTimer}
          onEmojiSent={handleEmojiSent}
          otherPlayersEmojis={emojiQueue}
        />

        {/* Live Commentary section */}
        <Collapsible open={commentaryExpanded} onOpenChange={setCommentaryExpanded}>
          <CollapsibleTrigger asChild>
            <Card className={`cursor-pointer hover:bg-card/80 transition-colors backdrop-blur-md bg-card/60 border-border/50 ${commentaryExpanded ? 'rounded-b-none border-b-0' : ''}`}>
              <CardContent className="p-4">
                {commentaryExpanded ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-foreground font-medium">Live Commentary</span>
                      <Badge variant="outline" className="bg-green-500/20 border-green-400/30 text-green-300 text-xs">
                        {gameState.matchEvents.length} events
                      </Badge>
                    </div>
                    <div className="text-muted-foreground">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mt-1.5 shrink-0"></div>
                    <div className="flex-1 text-foreground text-sm leading-snug line-clamp-2">
                      {gameState.matchEvents.length > 0 
                        ? gameState.matchEvents[gameState.matchEvents.length - 1]?.description || "Match in progress..."
                        : "Match starting soon..."}
                    </div>
                    <div className="text-muted-foreground shrink-0 ml-2">
                      <ChevronRight size={16} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <MatchEvents 
              events={gameState.matchEvents} 
              currentTime={matchTimer}
              activeBets={gameState.activeBets}
              simplified={true}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Action betting modal */}
      <ActionBettingModal
        isOpen={actionModalOpen}
        onClose={() => {
          setActionModalOpen(false);
          setCurrentActionEvent(null);
          setIsMatchRunning(true);
          if (actionTimerRef.current) {
            clearInterval(actionTimerRef.current);
          }
        }}
        event={currentActionEvent}
        gameState={gameState}
        onPlaceBet={handleActionBet}
        timeLeft={actionBettingTimer}
      />

      {/* Sticky betting drawer at bottom */}
      <StickyBettingDrawer 
        gameState={gameState}
        onAddToBetslip={handleDirectBetPlacement}
        updateGameState={updateGameState}
        triggerBetFeedback={triggerBetFeedback}
      />

      {/* Live Betting Feed - Keep this as it's not part of the pitch */}
      <LiveBettingFeed
        recentBets={recentBets}
        playerCount={playerCount}
        isVisible={showLiveBetting && !actionModalOpen}
      />

    </div>
  );
}
