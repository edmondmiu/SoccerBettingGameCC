import React, { useState, useEffect, useCallback } from 'react';
import { Lobby } from './components/Lobby';
import { Match } from './components/Match';
import { MatchSummary } from './components/MatchSummary';
import { BetslipDrawer } from './components/BetslipDrawer';
import { BetFeedbackAnimation } from './components/BetFeedbackAnimation';
import { BetWinAnimation } from './components/BetWinAnimation';
import { useBetFeedback } from './components/utils/useBetFeedback';
import { useBetWinAnimation } from './components/utils/useBetWinAnimation';
import { MobileOptimizations, mobileStyles, useMobilePerformance } from './components/MobileOptimizations';
import { QuickChatSystem } from './components/QuickChatSystem';

export interface Bet {
  id: string;
  type: 'full-match' | 'action' | 'lobby';
  outcome: string;
  odds: number;
  amount: number;
  timestamp: number;
  powerUpApplied?: boolean;
  resolved?: boolean;
  won?: boolean;
  payout?: number;
  matchId?: string;
  homeTeam?: string;
  awayTeam?: string;
  eventId?: string; // For action bets, links to the ActionEvent
}

export interface BetslipSelection {
  id: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  outcome: 'home' | 'draw' | 'away';
  odds: number;
  outcomeLabel: string;
  amount: number; // Add stake amount to avoid race conditions
}

export interface MatchData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  homeScore: number;
  awayScore: number;
  status: 'not-started' | 'live' | 'finished';
  timeElapsed: number;
  playerCount: number;
  startTime?: string;
}

export interface ActionEvent {
  id: string;
  time: number;
  type: 'goal' | 'action' | 'commentary';
  description: string;
  bettingOptions?: {
    label: string;
    odds: number;
    outcome: string;
  }[];
  resolved?: boolean;
  result?: string;
  scoringTeam?: 'home' | 'away';
}

export interface PowerUp {
  id: string;
  multiplier: number;
  description: string;
}

export interface GameState {
  phase: 'lobby' | 'match' | 'match-summary';
  wallet: number;
  currentMatch: MatchData | null;
  activeBets: Bet[];
  matchEvents: ActionEvent[];
  powerUp: PowerUp | null;
  lastFullMatchBetAmount: number;
  lastActionBetAmount: number;
  classicMode: boolean;
  betslipSelections: BetslipSelection[];
  betslipStake: number;
  completedMatch?: MatchData;
  completedBets?: Bet[];
  settings: {
    betAnimations: boolean;
  };
}

const initialGameState: GameState = {
  phase: 'lobby',
  wallet: 10000,
  currentMatch: null,
  activeBets: [],
  matchEvents: [],
  powerUp: null,
  lastFullMatchBetAmount: 25,
  lastActionBetAmount: 25,
  classicMode: false,
  betslipSelections: [],
  betslipStake: 100,
  settings: {
    betAnimations: false, // Default: animations OFF
  },
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const { animations, triggerBetFeedback, removeBetFeedback } = useBetFeedback();
  const { isVisible: isWinAnimationVisible, winDetails, triggerWinAnimation, hideWinAnimation } = useBetWinAnimation();
  
  // Mobile performance optimizations
  useMobilePerformance();

  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...updates }));
  }, []);

  const addBet = useCallback((bet: Bet) => {
    setGameState(prev => ({
      ...prev,
      activeBets: [...prev.activeBets, bet],
      wallet: prev.wallet - bet.amount,
      ...(bet.type === 'full-match' 
        ? { lastFullMatchBetAmount: bet.amount }
        : { lastActionBetAmount: bet.amount }
      )
    }));
  }, []);

  const resolveBet = useCallback((betId: string, won: boolean, payout: number = 0) => {
    setGameState(prev => {
      // Find the bet being resolved to check if it's an action bet and if it won
      const targetBet = prev.activeBets.find(bet => bet.id === betId);
      
      // Trigger win animation for winning action bets
      if (targetBet && won && targetBet.type === 'action' && payout > 0) {
        triggerWinAnimation({
          betId,
          winAmount: Math.round(payout),
          betType: targetBet.type
        });
      }

      return {
        ...prev,
        activeBets: prev.activeBets.map(bet => 
          bet.id === betId 
            ? { ...bet, resolved: true, won, payout }
            : bet
        ),
        wallet: won ? prev.wallet + payout : prev.wallet
      };
    });
  }, [triggerWinAnimation]);

  const awardPowerUp = useCallback(() => {
    setGameState(prev => {
      if (prev.classicMode) return prev;
      
      const powerUp: PowerUp = {
        id: Date.now().toString(),
        multiplier: 2,
        description: '2x Winnings Multiplier!'
      };
      
      return { ...prev, powerUp };
    });
  }, []);

  const usePowerUp = useCallback((betId: string) => {
    setGameState(prev => ({
      ...prev,
      activeBets: prev.activeBets.map(bet => 
        bet.id === betId 
          ? { ...bet, powerUpApplied: true }
          : bet
      ),
      powerUp: null
    }));
  }, []);

  const addToBetslip = useCallback((selection: BetslipSelection) => {
    setGameState(prev => {
      // Remove existing selection for same match if exists
      const filteredSelections = prev.betslipSelections.filter(s => s.matchId !== selection.matchId);
      return {
        ...prev,
        betslipSelections: [...filteredSelections, selection]
      };
    });
  }, []);

  const removeFromBetslip = useCallback((selectionId: string) => {
    setGameState(prev => ({
      ...prev,
      betslipSelections: prev.betslipSelections.filter(s => s.id !== selectionId)
    }));
  }, []);

  const clearBetslip = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      betslipSelections: []
    }));
  }, []);

  const placeBetslipBets = useCallback(() => {
    let success = false;
    
    setGameState(prev => {
      const { betslipSelections, wallet } = prev;
      const totalCost = betslipSelections.reduce((sum, selection) => sum + selection.amount, 0);
      
      if (totalCost > wallet) {
        success = false;
        return prev;
      }

      const newBets: Bet[] = betslipSelections.map(selection => ({
        id: Date.now().toString() + Math.random(),
        type: 'lobby' as const,
        outcome: selection.outcome,
        odds: selection.odds,
        amount: selection.amount, // Use amount from selection
        timestamp: Date.now(),
        matchId: selection.matchId,
        homeTeam: selection.homeTeam,
        awayTeam: selection.awayTeam
      }));

      success = true;
      return {
        ...prev,
        activeBets: [...prev.activeBets, ...newBets],
        wallet: prev.wallet - totalCost,
        betslipSelections: []
      };
    });

    return success;
  }, []);

  const showMatchSummary = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      completedMatch: prev.currentMatch,
      completedBets: prev.activeBets,
      phase: 'match-summary'
    }));
  }, []);

  const resetForNewMatch = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentMatch: null,
      activeBets: [],
      matchEvents: [],
      powerUp: null,
      completedMatch: undefined,
      completedBets: undefined,
      phase: 'lobby'
    }));
  }, []);

  return (
    <div className="dark min-h-screen bg-background mobile-optimized">
      {/* Inject mobile optimization styles */}
      <style dangerouslySetInnerHTML={{ __html: mobileStyles }} />
      
      {/* Mobile optimization component */}
      <MobileOptimizations />
      
      {gameState.phase === 'lobby' ? (
        <Lobby 
          gameState={gameState}
          updateGameState={updateGameState}
        />
      ) : gameState.phase === 'match-summary' ? (
        <MatchSummary
          gameState={gameState}
          resetForNewMatch={resetForNewMatch}
        />
      ) : (
        <Match 
          gameState={gameState}
          updateGameState={updateGameState}
          addBet={addBet}
          resolveBet={resolveBet}
          awardPowerUp={awardPowerUp}
          usePowerUp={usePowerUp}
          showMatchSummary={showMatchSummary}
          addToBetslip={addToBetslip}
          triggerBetFeedback={triggerBetFeedback}
        />
      )}
      
      {gameState.phase === 'match' && gameState.betslipSelections.length > 0 && (
        <BetslipDrawer
          gameState={gameState}
          updateGameState={updateGameState}
          removeFromBetslip={removeFromBetslip}
          clearBetslip={clearBetslip}
          placeBetslipBets={placeBetslipBets}
          triggerBetFeedback={triggerBetFeedback}
        />
      )}
      
      {/* Bet feedback animations */}
      {animations.map((animation) => (
        <BetFeedbackAnimation
          key={animation.id}
          isVisible={animation.isVisible}
          startPosition={animation.startPosition}
          endPosition={animation.endPosition}
          betAmount={animation.betAmount}
          animationId={animation.id}
          onComplete={() => removeBetFeedback(animation.id)}
        />
      ))}
      
      {/* Action bet win animation */}
      <BetWinAnimation
        isVisible={isWinAnimationVisible}
        winAmount={winDetails?.winAmount || 0}
        onAnimationComplete={hideWinAnimation}
      />

      {/* Quick Chat System - Positioned outside containers for proper fixed positioning */}
      <QuickChatSystem
        isVisible={gameState.phase === 'match' || gameState.phase === 'lobby'}
        onChatToggle={() => {}}
      />
      
    </div>
  );
}