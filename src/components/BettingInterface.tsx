import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Zap, DollarSign, Minus, Plus } from 'lucide-react';
import { GameState, Bet } from '../App';

interface BettingInterfaceProps {
  gameState: GameState;
  addBet: (bet: Bet) => void;
  usePowerUp: (betId: string) => void;
  isMatchRunning: boolean;
  triggerBetFeedback: (startElement: HTMLElement | null, endElement: HTMLElement | null, betAmount: number) => void;
}

export function BettingInterface({ gameState, addBet, usePowerUp, isMatchRunning, triggerBetFeedback }: BettingInterfaceProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState(gameState.lastFullMatchBetAmount.toString());
  const [showBetSlip, setShowBetSlip] = useState(false);

  const { currentMatch } = gameState;
  if (!currentMatch) return null;

  const handleOutcomeClick = (outcome: string) => {
    setSelectedOutcome(outcome);
    setShowBetSlip(true);
  };

  const getOddsForOutcome = (outcome: string): number => {
    switch (outcome) {
      case 'home': return currentMatch.homeOdds;
      case 'draw': return currentMatch.drawOdds;
      case 'away': return currentMatch.awayOdds;
      default: return 1;
    }
  };

  const getOutcomeLabel = (outcome: string): string => {
    switch (outcome) {
      case 'home': return currentMatch.homeTeam;
      case 'draw': return 'Draw';
      case 'away': return currentMatch.awayTeam;
      default: return '';
    }
  };

  const adjustBetAmount = (change: number) => {
    const currentAmount = parseFloat(betAmount) || 0;
    const newAmount = Math.max(1, Math.min(gameState.wallet, currentAmount + change));
    setBetAmount(newAmount.toString());
  };

  const setQuickBet = (amount: number) => {
    setBetAmount(Math.min(amount, gameState.wallet).toString());
  };

  const placeBet = () => {
    if (!selectedOutcome || !betAmount) return;

    const amount = parseFloat(betAmount);
    if (amount <= 0 || amount > gameState.wallet) {
      // Invalid bet amount
      return;
    }

    const odds = getOddsForOutcome(selectedOutcome);
    const bet: Bet = {
      id: `full-match-${Date.now()}`,
      type: 'full-match',
      outcome: selectedOutcome,
      odds,
      amount,
      timestamp: Date.now()
    };

    // Trigger bet feedback animation (only if enabled)
    if (gameState.settings.betAnimations) {
      const placeBetButton = document.querySelector('[data-testid="place-bet-button"]');
      const summaryElement = document.querySelector('[data-testid="betting-summary"]');
      if (placeBetButton && summaryElement) {
        triggerBetFeedback(placeBetButton, summaryElement, amount);
      }
    }

    addBet(bet);
    setShowBetSlip(false);
    setSelectedOutcome(null);
    
    // Bet placed successfully
  };

  const cancelBet = () => {
    setShowBetSlip(false);
    setSelectedOutcome(null);
  };

  const activeBets = gameState.activeBets.filter(bet => bet.type === 'full-match' && !bet.resolved);
  const totalStaked = activeBets.reduce((sum, bet) => sum + bet.amount, 0);
  const potentialWinnings = activeBets.reduce((sum, bet) => {
    const multiplier = bet.powerUpApplied ? 2 : 1;
    return sum + (bet.amount * bet.odds * multiplier);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Mobile Betting Stats - Compact */}


      {/* Full match betting card */}
      <Card className="backdrop-blur-sm bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/30">
        <CardContent className="p-4 space-y-4">
          {/* Header */}
          <div>
            <h3 className="font-medium text-base mb-1">Full Match Betting</h3>
            <p className="text-sm text-muted-foreground">Bet anytime during the match</p>
          </div>
          
          {/* Betting options */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={selectedOutcome === 'home' ? 'default' : 'outline'}
              className={`h-12 flex flex-col justify-center items-center px-2 py-1 ${
                selectedOutcome === 'home' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' 
                  : 'hover:bg-blue-500/10'
              }`}
              onClick={() => handleOutcomeClick('home')}
              disabled={!isMatchRunning}
            >
              <span className="text-sm truncate w-full text-center leading-tight">{currentMatch.homeTeam}</span>
              <span className="text-base leading-none mt-0.5">{currentMatch.homeOdds}</span>
            </Button>
            
            <Button
              variant={selectedOutcome === 'draw' ? 'default' : 'outline'}
              className={`h-12 flex flex-col justify-center items-center px-2 py-1 ${
                selectedOutcome === 'draw' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' 
                  : 'hover:bg-blue-500/10'
              }`}
              onClick={() => handleOutcomeClick('draw')}
              disabled={!isMatchRunning}
            >
              <span className="text-sm leading-tight">Draw</span>
              <span className="text-base leading-none mt-0.5">{currentMatch.drawOdds}</span>
            </Button>
            
            <Button
              variant={selectedOutcome === 'away' ? 'default' : 'outline'}
              className={`h-12 flex flex-col justify-center items-center px-2 py-1 ${
                selectedOutcome === 'away' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' 
                  : 'hover:bg-blue-500/10'
              }`}
              onClick={() => handleOutcomeClick('away')}
              disabled={!isMatchRunning}
            >
              <span className="text-sm truncate w-full text-center leading-tight">{currentMatch.awayTeam}</span>
              <span className="text-base leading-none mt-0.5">{currentMatch.awayOdds}</span>
            </Button>
          </div>

          {/* Bet slip */}
          {showBetSlip && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Bet Slip</h4>
                  <Badge className="bg-blue-500/20 border-blue-400/30 text-blue-300">{getOutcomeLabel(selectedOutcome!)}</Badge>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Odds:</span>
                  <span className="font-medium">{getOddsForOutcome(selectedOutcome!)}</span>
                </div>
                
                {/* Quick bet buttons */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quick Bet:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 25, 50, 100].map(amount => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickBet(amount)}
                        disabled={amount > gameState.wallet}
                        className="hover:bg-blue-500/10"
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Bet amount controls */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bet Amount:</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => adjustBetAmount(-5)}
                      disabled={parseFloat(betAmount) <= 5}
                      className="hover:bg-blue-500/10"
                    >
                      <Minus size={14} />
                    </Button>
                    <Input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      className="text-center"
                      min="1"
                      max={gameState.wallet}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => adjustBetAmount(5)}
                      disabled={parseFloat(betAmount) + 5 > gameState.wallet}
                      className="hover:bg-blue-500/10"
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                </div>
                
                {/* Potential win display */}
                <div className="bg-background/50 rounded-lg p-3">
                  <div className="flex justify-between font-medium">
                    <span>Potential Win:</span>
                    <span className="text-green-600">
                      ${(parseFloat(betAmount) * getOddsForOutcome(selectedOutcome!)).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    data-testid="place-bet-button"
                    onClick={placeBet} 
                    className="h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    Place Bet
                  </Button>
                  <Button variant="outline" onClick={cancelBet} className="h-12 hover:bg-blue-500/10">
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Active bets */}
      {activeBets.length > 0 && (
        <Card className="backdrop-blur-sm bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/30">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign size={18} />
              <h3 className="font-medium text-base">Active Bets ({activeBets.length})</h3>
            </div>
            
            <div className="space-y-3">
              {activeBets.map((bet) => (
                <div key={bet.id} className="border rounded-lg p-3 space-y-2 bg-background/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{getOutcomeLabel(bet.outcome)}</p>
                      <p className="text-xs text-muted-foreground">
                        ${bet.amount} @ {bet.odds} 
                        {bet.powerUpApplied && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            <Zap size={10} className="mr-1" />
                            2x
                          </Badge>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Win</p>
                      <p className="font-medium text-green-600 text-sm">
                        ${(bet.amount * bet.odds * (bet.powerUpApplied ? 2 : 1)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  {gameState.powerUp && !bet.powerUpApplied && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => usePowerUp(bet.id)}
                      className="w-full h-10 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 hover:from-yellow-500/20 hover:to-orange-500/20 border-yellow-400/30"
                    >
                      <Zap size={14} className="mr-2" />
                      Use Power-Up (2x Winnings)
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}