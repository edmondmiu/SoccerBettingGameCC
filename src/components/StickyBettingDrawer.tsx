import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ChevronUp, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { GameState, BetslipSelection } from '../App';
import { RainbowText } from './RainbowText';
import { formatCurrency } from './utils/formatCurrency';

interface StickyBettingDrawerProps {
  gameState: GameState;
  onAddToBetslip: (selection: BetslipSelection) => void;
  updateGameState: (updates: Partial<GameState>) => void;
  triggerBetFeedback?: (startElement: HTMLElement | null, endElement: HTMLElement | null, betAmount: number) => void;
}

export function StickyBettingDrawer({ gameState, onAddToBetslip, updateGameState, triggerBetFeedback }: StickyBettingDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<'home' | 'draw' | 'away' | null>(null);
  const [customStake, setCustomStake] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousOdds, setPreviousOdds] = useState<{home: number, draw: number, away: number} | null>(null);
  const [oddsChanges, setOddsChanges] = useState<{home: 'up' | 'down' | null, draw: 'up' | 'down' | null, away: 'up' | 'down' | null}>({
    home: null, draw: null, away: null
  });

  const { currentMatch, wallet, betslipStake } = gameState;

  // Track odds changes for visual indicators
  useEffect(() => {
    if (currentMatch && previousOdds) {
      const changes = {
        home: currentMatch.homeOdds > previousOdds.home ? 'up' as const : 
              currentMatch.homeOdds < previousOdds.home ? 'down' as const : null,
        draw: currentMatch.drawOdds > previousOdds.draw ? 'up' as const : 
              currentMatch.drawOdds < previousOdds.draw ? 'down' as const : null,
        away: currentMatch.awayOdds > previousOdds.away ? 'up' as const : 
              currentMatch.awayOdds < previousOdds.away ? 'down' as const : null,
      };
      
      setOddsChanges(changes);
      
      // Clear indicators after 3 seconds
      setTimeout(() => {
        setOddsChanges({ home: null, draw: null, away: null });
      }, 3000);
    }
    
    if (currentMatch) {
      setPreviousOdds({
        home: currentMatch.homeOdds,
        draw: currentMatch.drawOdds,
        away: currentMatch.awayOdds
      });
    }
  }, [currentMatch?.homeOdds, currentMatch?.drawOdds, currentMatch?.awayOdds]);
  if (!currentMatch) return null;

  const currentStake = customStake && !isNaN(parseFloat(customStake)) ? parseFloat(customStake) : betslipStake;
  
  const getSelectedOdds = () => {
    if (!selectedOutcome) return 0;
    switch (selectedOutcome) {
      case 'home': return currentMatch.homeOdds;
      case 'draw': return currentMatch.drawOdds;
      case 'away': return currentMatch.awayOdds;
      default: return 0;
    }
  };

  const potentialWin = selectedOutcome ? currentStake * getSelectedOdds() : 0;

  const handleOutcomeSelect = (outcome: 'home' | 'draw' | 'away') => {
    setSelectedOutcome(outcome);
    setIsAnimating(true);
    
    // Smooth expand animation
    setTimeout(() => {
      setIsExpanded(true);
      setIsAnimating(false);
    }, 150);
    
    // Don't automatically place bet when selecting outcome - only when clicking "Place Bet"
  };

  const handleToggleExpanded = () => {
    setIsAnimating(true);
    setIsExpanded(!isExpanded);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleQuickStake = (amount: number) => {
    setCustomStake(amount.toString());
    updateGameState({ betslipStake: amount });
  };

  const handlePlaceBet = () => {
    if (!selectedOutcome || currentStake > wallet || !currentMatch) return;
    
    // Create the bet selection and place it through the onAddToBetslip callback
    const selection: BetslipSelection = {
      id: `${currentMatch.id}-${selectedOutcome}-${Date.now()}`,
      matchId: currentMatch.id,
      homeTeam: currentMatch.homeTeam,
      awayTeam: currentMatch.awayTeam,
      outcome: selectedOutcome,
      odds: getSelectedOdds(),
      outcomeLabel: selectedOutcome === 'home' ? currentMatch.homeTeam : 
                   selectedOutcome === 'draw' ? 'Draw' : currentMatch.awayTeam,
      amount: currentStake // Include the stake amount directly
    };
    
    // Trigger bet feedback animation to the "Your Bets" summary card (only if enabled)
    if (triggerBetFeedback && gameState.settings.betAnimations) {
      const addToBetslipButton = document.querySelector('[data-testid="add-to-betslip-button"]');
      // Target the betting summary (Your Bets card) - try multiple selectors
      let yourBetsElement = document.querySelector('[data-testid="betting-summary"]');
      
      // If betting summary not found, try other selectors as fallback
      if (!yourBetsElement) {
        // Look for the card with betting summary class patterns
        yourBetsElement = document.querySelector('.backdrop-blur-sm.bg-gradient-to-r.from-slate-800\\/40');
        console.log('🔍 Fallback 1 - Found element by class:', yourBetsElement);
      }
      
      if (!yourBetsElement) {
        // Look for any card element in the upper area
        yourBetsElement = document.querySelector('[class*="Card"]') || 
                         document.querySelector('.rounded-xl.border');
        console.log('🔍 Fallback 2 - Found element by card class:', yourBetsElement);
      }
      
      console.log('🎯 StickyBettingDrawer animation elements:', { addToBetslipButton, yourBetsElement });
      if (addToBetslipButton && yourBetsElement) {
        triggerBetFeedback(addToBetslipButton, yourBetsElement, currentStake);
      } else {
        console.log('❌ Could not find animation elements for sticky betting drawer');
      }
    }

    // Place the bet through the callback
    onAddToBetslip(selection);
    
    // Smooth collapse animation
    setIsAnimating(true);
    setIsExpanded(false);
    
    setTimeout(() => {
      setSelectedOutcome(null);
      setCustomStake('');
      setIsAnimating(false);
    }, 300);
  };

  const canAffordBet = currentStake <= wallet && currentStake > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Enhanced shadow layer behind the drawer */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent pointer-events-none"></div>
      <Card 
        data-testid="sticky-betting-drawer"
        className={`relative rounded-t-3xl rounded-b-none backdrop-blur-2xl bg-gradient-to-t from-card via-card/95 to-sidebar/30 border-2 border-sidebar-primary/50 border-b-0 shadow-[0_-20px_80px_-12px] shadow-sidebar-primary/30 ring-1 ring-sidebar-primary/20 transition-all duration-300 ease-out ${
          isExpanded ? 'transform translate-y-0' : ''
        } ${isAnimating ? 'transition-transform duration-300 ease-out' : ''}`}
      >
        {/* Glowing top edge */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary to-transparent opacity-60"></div>
        <div className="absolute top-0 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-sidebar-primary/40 to-transparent blur-sm"></div>
        <CardContent className="p-4">
          {/* Collapsed state - betting options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-foreground font-medium flex items-center gap-2">
                <div className="w-2 h-2 bg-sidebar-primary rounded-full animate-pulse"></div>
                <RainbowText 
                  animated={!selectedOutcome}
                  className="font-bold"
                >
                  Full Match Betting
                </RainbowText>
              </h3>
              {selectedOutcome && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleExpanded}
                  className={`text-muted-foreground hover:text-foreground hover:bg-sidebar-primary/10 border border-transparent hover:border-sidebar-primary/30 transition-all duration-200 ${
                    isAnimating ? 'animate-pulse' : ''
                  }`}
                  disabled={isAnimating}
                >
                  <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronUp size={16} />
                  </div>
                </Button>
              )}
            </div>

            {/* Betting options */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={selectedOutcome === 'home' ? 'default' : undefined}
                className={`h-16 flex flex-col gap-1 transition-all duration-300 transform hover:scale-105 ${
                  selectedOutcome === 'home' 
                    ? 'bg-gradient-to-b from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground border-sidebar-primary shadow-lg shadow-sidebar-primary/30 scale-105' 
                    : '!bg-purple-900/70 !border-purple-600/60 !text-white hover:!bg-purple-800/80 hover:!border-purple-500/70 hover:shadow-lg hover:shadow-purple-600/30 shadow-md shadow-purple-700/15'
                }`}
                onClick={() => handleOutcomeSelect('home')}
                disabled={isAnimating}
              >
                <span className="text-xs truncate font-medium">{currentMatch.homeTeam}</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-lg">{currentMatch.homeOdds}</span>
                  {oddsChanges.home && (
                    <div className={`transition-all duration-300 animate-pulse ${oddsChanges.home === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                      {oddsChanges.home === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    </div>
                  )}
                </div>
              </Button>
              
              <Button
                variant={selectedOutcome === 'draw' ? 'default' : undefined}
                className={`h-16 flex flex-col gap-1 transition-all duration-300 transform hover:scale-105 ${
                  selectedOutcome === 'draw' 
                    ? 'bg-gradient-to-b from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground border-sidebar-primary shadow-lg shadow-sidebar-primary/30 scale-105' 
                    : '!bg-purple-900/70 !border-purple-600/60 !text-white hover:!bg-purple-800/80 hover:!border-purple-500/70 hover:shadow-lg hover:shadow-purple-600/30 shadow-md shadow-purple-700/15'
                }`}
                onClick={() => handleOutcomeSelect('draw')}
                disabled={isAnimating}
              >
                <span className="text-xs font-medium">Draw</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-lg">{currentMatch.drawOdds}</span>
                  {oddsChanges.draw && (
                    <div className={`transition-all duration-300 animate-pulse ${oddsChanges.draw === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                      {oddsChanges.draw === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    </div>
                  )}
                </div>
              </Button>
              
              <Button
                variant={selectedOutcome === 'away' ? 'default' : undefined}
                className={`h-16 flex flex-col gap-1 transition-all duration-300 transform hover:scale-105 ${
                  selectedOutcome === 'away' 
                    ? 'bg-gradient-to-b from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground border-sidebar-primary shadow-lg shadow-sidebar-primary/30 scale-105' 
                    : '!bg-purple-900/70 !border-purple-600/60 !text-white hover:!bg-purple-800/80 hover:!border-purple-500/70 hover:shadow-lg hover:shadow-purple-600/30 shadow-md shadow-purple-700/15'
                }`}
                onClick={() => handleOutcomeSelect('away')}
                disabled={isAnimating}
              >
                <span className="text-xs truncate font-medium">{currentMatch.awayTeam}</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-lg">{currentMatch.awayOdds}</span>
                  {oddsChanges.away && (
                    <div className={`transition-all duration-300 animate-pulse ${oddsChanges.away === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                      {oddsChanges.away === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    </div>
                  )}
                </div>
              </Button>
            </div>
          </div>

          {/* Expanded state - betslip details */}
          <div className={`overflow-hidden transition-all duration-300 ease-out ${
            isExpanded && selectedOutcome ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="mt-4 pt-4 border-t border-sidebar-primary/30 space-y-4">
              {/* Selection details */}
              <div className="bg-gradient-to-r from-sidebar-primary/10 via-sidebar-primary/5 to-sidebar-primary/10 rounded-xl p-4 border border-sidebar-primary/30 shadow-lg shadow-sidebar-primary/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground text-sm">Selection</span>
                  <Badge variant="outline" className="bg-sidebar-primary/30 border-sidebar-primary/50 text-sidebar-primary font-bold px-3 py-1">
                    @{getSelectedOdds()}
                  </Badge>
                </div>
                <div className="text-foreground font-medium">
                  {selectedOutcome === 'home' ? currentMatch.homeTeam : 
                   selectedOutcome === 'draw' ? 'Draw' : currentMatch.awayTeam}
                </div>
                <div className="text-muted-foreground text-sm">
                  {currentMatch.homeTeam} v {currentMatch.awayTeam}
                </div>
              </div>

              {/* Stake input */}
              <div className="space-y-2">
                <label className="text-muted-foreground text-sm">Stake</label>
                <Input
                  type="number"
                  value={customStake || betslipStake}
                  onChange={(e) => setCustomStake(e.target.value)}
                  placeholder="Enter stake"
                  className="bg-background border-sidebar-primary/30 focus:border-sidebar-primary text-foreground placeholder-muted-foreground transition-colors"
                />
              </div>

              {/* Quick stakes */}
              <div className="space-y-2">
                <label className="text-muted-foreground text-sm">Quick Stakes</label>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 100, 250].map((amount) => (
                    <Button
                      key={amount}
                      variant={currentStake === amount ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleQuickStake(amount)}
                      disabled={amount > wallet || isAnimating}
                      className={`transition-all duration-200 transform hover:scale-105 ${
                        currentStake === amount
                          ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary shadow-md shadow-sidebar-primary/20"
                          : "border-sidebar-primary/30 text-foreground hover:bg-sidebar-primary/10 hover:border-sidebar-primary/50"
                      }`}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Potential win */}
              <div className="bg-gradient-to-r from-chart-4/20 via-chart-4/15 to-chart-4/20 rounded-xl p-4 border-2 border-chart-4/40 shadow-lg shadow-chart-4/20">
                <div className="flex items-center justify-between">
                  <span className="text-chart-4 font-bold text-lg">Potential Win</span>
                  <span className="text-foreground font-bold text-2xl bg-chart-4/90 text-white px-4 py-2 rounded-lg shadow-md">
                    ${formatCurrency(potentialWin, true)}
                  </span>
                </div>
                <div className="text-chart-4/90 text-sm mt-3 bg-chart-4/10 rounded-lg px-3 py-2 border border-chart-4/30">
                  Stake: <span className="font-bold text-chart-4">${formatCurrency(currentStake, true)}</span> • Odds: <span className="font-bold text-chart-4">{getSelectedOdds()}</span>
                </div>
                {gameState.powerUp && (
                  <div className="mt-2 text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-400/30 rounded-md px-2 py-1 inline-block">
                    Power-up ready: apply 2x from "Your Bets" after placing
                  </div>
                )}
              </div>

              {/* Place bet button */}
              <Button
                data-testid="add-to-betslip-button"
                onClick={handlePlaceBet}
                disabled={!canAffordBet}
                className={`w-full h-16 font-bold transition-all duration-200 ${
                  canAffordBet
                    ? 'bg-gradient-to-r from-sidebar-primary to-sidebar-primary/90 hover:from-sidebar-primary/90 hover:to-sidebar-primary/80 text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/30 hover:shadow-xl hover:shadow-sidebar-primary/40 animate-shimmer-button'
                    : 'bg-muted text-muted-foreground cursor-not-allowed border border-muted-foreground/20'
                }`}
              >
                {!canAffordBet ? (
                  <span className="text-lg">
                    Insufficient Funds
                  </span>
                ) : (
                  <span className="text-lg">
                    {(() => {
                      const amount = Math.floor(Number(currentStake) || 0);
                      if (amount >= 1000) {
                        return `Place Bet - $${amount.toLocaleString()}`;
                      }
                      return `Place Bet - $${amount}`;
                    })()}
                  </span>
                )}
              </Button>

              {/* Wallet info */}
              <div className="text-center text-muted-foreground text-sm bg-muted/20 border border-muted-foreground/10 rounded-lg py-2 px-4">
                💰 Wallet Balance: <span className="text-foreground font-medium">${formatCurrency(wallet, true)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
