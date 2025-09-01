import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { TrendingUp, TrendingDown, DollarSign, Target, Zap, ChevronDown, ChevronRight } from 'lucide-react';
import { Bet } from '../App';
import { useCountingAnimation } from './utils/useCountingAnimation';

interface BettingSummaryProps {
  activeBets: Bet[];
  powerUpAvailable?: boolean;
  onUsePowerUp?: (betId: string) => void;
}

export function BettingSummary({ activeBets, powerUpAvailable = false, onUsePowerUp }: BettingSummaryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [previousBetCount, setPreviousBetCount] = useState(0);
  const [showPulse, setShowPulse] = useState(false);

  // Detect new bets and trigger animation (but don't auto-expand)
  useEffect(() => {
    if (activeBets.length > previousBetCount) {
      setShowPulse(true);
      // Keep collapsed - user must manually expand
      setTimeout(() => setShowPulse(false), 1000);
    }
    setPreviousBetCount(activeBets.length);
  }, [activeBets.length, previousBetCount]);

  // Calculate betting statistics
  const totalBets = activeBets.length;
  const totalStaked = activeBets.reduce((sum, bet) => sum + bet.amount, 0);
  const potentialWin = activeBets.reduce((sum, bet) => {
    if (!bet.resolved) {
      const multiplier = bet.powerUpApplied ? 2 : 1;
      return sum + (bet.amount * bet.odds * multiplier);
    }
    return sum;
  }, 0);
  
  const resolvedBets = activeBets.filter(bet => bet.resolved);
  const wonBets = resolvedBets.filter(bet => bet.won);
  const actualWins = wonBets.reduce((sum, bet) => sum + (bet.payout || 0), 0);
  const actualLosses = resolvedBets.filter(bet => !bet.won).reduce((sum, bet) => sum + bet.amount, 0);

  // Animated values for smooth counting transitions
  const animatedTotalBets = useCountingAnimation(totalBets, 'fast');
  const animatedTotalStaked = useCountingAnimation(totalStaked, 'fast');
  const animatedPotentialWin = useCountingAnimation(potentialWin, 'fast');
  const animatedActualWins = useCountingAnimation(actualWins, 'fast');
  const animatedNetPL = useCountingAnimation(actualWins - actualLosses, 'fast');

  // Get recent bets for collapsed view
  const recentBets = activeBets
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 3);

  if (totalBets === 0) return null;

  return (
    <Card 
      data-testid="betting-summary"
      className={`backdrop-blur-sm bg-gradient-to-r from-slate-800/40 to-slate-700/40 border-white/10 transition-all duration-300 ${
        showPulse ? 'animate-pulse ring-2 ring-green-400/50 shadow-lg shadow-green-400/20' : ''
      }`}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="cursor-pointer hover:bg-white/5 transition-colors p-3">
            {isOpen ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-green-400" />
                  <span className="text-sm text-white">Your Bets ({animatedTotalBets})</span>
                </div>
                <ChevronDown size={14} className="text-gray-400" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm flex-1">
                  <div className="flex items-center gap-1">
                    <DollarSign size={14} className="text-blue-400" />
                    <span className="text-white">${animatedTotalStaked.toLocaleString()}</span>
                    <span className="text-gray-400">staked</span>
                  </div>
                  {potentialWin > 0 && (
                    <div className="flex items-center gap-1">
                      <TrendingUp size={14} className="text-yellow-400" />
                      <span className="text-white">${animatedPotentialWin.toLocaleString()}</span>
                      <span className="text-gray-400">potential</span>
                    </div>
                  )}
                  {actualWins > 0 && (
                    <div className="flex items-center gap-1">
                      <Zap size={14} className="text-green-400" />
                      <span className="text-green-300">${animatedActualWins.toLocaleString()}</span>
                      <span className="text-gray-400">won</span>
                    </div>
                  )}
                </div>
                <ChevronRight size={14} className="text-gray-400" />
              </div>
            )}
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 px-3 pb-3">
            <div className="space-y-3">
              {/* All Bets in Chronological Order */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-sm text-white">All Bets</span>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{activeBets.filter(bet => !bet.resolved).length} active</span>
                    <span>{resolvedBets.length} resolved</span>
                  </div>
                </div>
                
                {activeBets
                  .sort((a, b) => b.timestamp - a.timestamp) // Most recent first
                  .map((bet, index) => (
                    <div key={bet.id} className="bg-gradient-to-r from-slate-800/20 to-slate-700/20 rounded-lg p-2 border border-white/10">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              bet.type === 'action' ? 'bg-purple-500/20 border-purple-400/30 text-purple-300' :
                              bet.type === 'full-match' ? 'bg-blue-500/20 border-blue-400/30 text-blue-300' :
                              'bg-gray-500/20 border-gray-400/30 text-gray-300'
                            }`}
                          >
                            {bet.type === 'action' ? 'Action' : bet.type === 'full-match' ? 'Match' : 'Lobby'}
                          </Badge>
                          
                          {bet.powerUpApplied && (
                            <Badge variant="outline" className="bg-yellow-500/20 border-yellow-400/30 text-yellow-300 text-xs">
                              2x
                            </Badge>
                          )}
                          
                          {bet.resolved && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                bet.won 
                                  ? 'bg-green-500/20 border-green-400/30 text-green-300' 
                                  : 'bg-red-500/20 border-red-400/30 text-red-300'
                              }`}
                            >
                              {bet.won ? 'Won' : 'Lost'}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-400">
                          {new Date(bet.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <div className="text-sm text-white mb-1">{bet.outcome}</div>
                          <div className="text-xs text-gray-400">
                            ${bet.amount} @ {bet.odds} = {(bet.amount * bet.odds * (bet.powerUpApplied ? 2 : 1)).toFixed(0)} potential
                          </div>
                        </div>
                        {/* Use Power-Up action on mobile summary */}
                        {!bet.resolved && powerUpAvailable && !bet.powerUpApplied && onUsePowerUp && (
                          <button
                            onClick={() => onUsePowerUp(bet.id)}
                            className="shrink-0 text-xs px-2 py-1 rounded-md border border-yellow-400/40 bg-yellow-500/15 text-yellow-300 hover:bg-yellow-500/25 transition-colors"
                            aria-label="Use Power-Up"
                          >
                            2x
                          </button>
                        )}
                        
                        {bet.resolved && (
                          <div className="text-right">
                            {bet.won ? (
                              <div className="flex items-center gap-1">
                                <TrendingUp size={12} className="text-green-400" />
                                <span className="text-sm text-green-300">+${bet.payout?.toFixed(0)}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <TrendingDown size={12} className="text-red-400" />
                                <span className="text-sm text-red-300">-${bet.amount}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                
                {activeBets.length === 0 && (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    No bets placed yet
                  </div>
                )}
              </div>

              {/* Quick Summary Stats */}
              {resolvedBets.length > 0 && (
                <div className="border-t border-white/10 pt-3">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-xs text-gray-400">Total Staked</div>
                      <div className="text-sm text-white">${animatedTotalStaked.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Total Won</div>
                      <div className="text-sm text-green-300">${animatedActualWins.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Net P&L</div>
                      <div className={`text-sm ${animatedNetPL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {animatedNetPL >= 0 ? '+' : ''}${Math.abs(animatedNetPL).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
