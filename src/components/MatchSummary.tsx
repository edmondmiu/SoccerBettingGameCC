import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Header } from './Header';
import { GameState, Bet, MatchData } from '../App';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Zap, 
  PartyPopper,
  ArrowRight,
  DollarSign
} from 'lucide-react';

interface MatchSummaryProps {
  gameState: GameState;
  resetForNewMatch: () => void;
}

interface ConfettiBlast {
  id: string;
  x: number;
  y: number;
  particles: {
    id: string;
    color: string;
    shape: string;
    size: string;
    angle: number;
    velocity: number;
  }[];
}

export function MatchSummary({ gameState, resetForNewMatch }: MatchSummaryProps) {
  const { completedMatch, completedBets, wallet } = gameState;
  const [confettiBlasts, setConfettiBlasts] = useState<ConfettiBlast[]>([]);

  if (!completedMatch || !completedBets) {
    return null;
  }

  // Calculate summary statistics
  const totalBets = completedBets.length;
  const wonBets = completedBets.filter(bet => bet.won).length;
  const lostBets = completedBets.filter(bet => !bet.won).length;
  const totalStaked = completedBets.reduce((sum, bet) => sum + bet.amount, 0);
  const totalWinnings = completedBets.reduce((sum, bet) => sum + (bet.payout || 0), 0);
  const netResult = totalWinnings - totalStaked;
  const hadWins = wonBets > 0;

  const formatMatchResult = () => {
    if (completedMatch.homeScore > completedMatch.awayScore) {
      return `${completedMatch.homeTeam} won ${completedMatch.homeScore}-${completedMatch.awayScore}`;
    } else if (completedMatch.awayScore > completedMatch.homeScore) {
      return `${completedMatch.awayTeam} won ${completedMatch.awayScore}-${completedMatch.homeScore}`;
    } else {
      return `Draw ${completedMatch.homeScore}-${completedMatch.awayScore}`;
    }
  };

  const getBetTypeIcon = (type: string) => {
    switch (type) {
      case 'full-match':
        return <Target size={14} className="text-blue-400" />;
      case 'action':
        return <Zap size={14} className="text-orange-400" />;
      default:
        return <DollarSign size={14} className="text-gray-400" />;
    }
  };

  const getBetDescription = (bet: Bet) => {
    if (bet.type === 'full-match') {
      return `${bet.outcome.charAt(0).toUpperCase() + bet.outcome.slice(1)} to win`;
    } else if (bet.type === 'action') {
      return `Action bet: ${bet.outcome}`;
    }
    return bet.outcome;
  };

  const handleTapConfetti = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    // Only show confetti gun if user won money
    if (!hadWins || netResult <= 0) return;

    event.preventDefault();
    
    let clientX, clientY;
    
    if ('touches' in event) {
      clientX = event.touches[0]?.clientX || event.changedTouches[0]?.clientX;
      clientY = event.touches[0]?.clientY || event.changedTouches[0]?.clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    // Calculate position as percentage of viewport for fixed positioning
    const x = (clientX / window.innerWidth) * 100;
    const y = (clientY / window.innerHeight) * 100;
    
    const colors = ['bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-purple-400', 'bg-pink-400', 'bg-red-400', 'bg-orange-400'];
    const shapes = ['rounded-full', 'rounded-sm', 'rounded-none'];
    const sizes = ['w-1.5 h-1.5', 'w-2 h-2', 'w-2.5 h-2.5', 'w-1 h-3', 'w-3 h-1'];
    
    const particles = Array.from({ length: 15 }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      size: sizes[Math.floor(Math.random() * sizes.length)],
      angle: (360 / 15) * i + Math.random() * 24 - 12, // Spread evenly with some randomness
      velocity: 150 + Math.random() * 100, // Pixels to travel
    }));
    
    const blast: ConfettiBlast = {
      id: Date.now().toString(),
      x,
      y,
      particles,
    };
    
    setConfettiBlasts(prev => [...prev, blast]);
    
    // Remove blast after animation completes
    setTimeout(() => {
      setConfettiBlasts(prev => prev.filter(b => b.id !== blast.id));
    }, 1500);
  }, [hadWins, netResult]);

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden"
      onClick={handleTapConfetti}
      onTouchStart={handleTapConfetti}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>

      {/* Header */}
      <Header 
        gameState={gameState} 
        showBackButton={false}
      />
      
      <div className="max-w-md mx-auto space-y-4 relative z-10 p-4">
        {/* Match Result Header */}
        <Card className="backdrop-blur-sm bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/30">
          <CardContent className="p-5 text-center">
            <h2 className="text-white text-lg mb-2">Match Finished</h2>
            <div className="flex items-center justify-center gap-4 mb-3">
              <div className="text-center">
                <p className="text-white font-medium">{completedMatch.homeTeam}</p>
                <div className="text-3xl font-bold text-white bg-blue-500/20 rounded-lg px-3 py-2 border border-blue-400/30 mt-1">
                  {completedMatch.homeScore}
                </div>
              </div>
              <div className="text-gray-400">-</div>
              <div className="text-center">
                <p className="text-white font-medium">{completedMatch.awayTeam}</p>
                <div className="text-3xl font-bold text-white bg-red-500/20 rounded-lg px-3 py-2 border border-red-400/30 mt-1">
                  {completedMatch.awayScore}
                </div>
              </div>
            </div>
            <p className="text-gray-300 text-sm">{formatMatchResult()}</p>
          </CardContent>
        </Card>

        {/* Celebration/Results Summary */}
        {hadWins && netResult > 0 ? (
          <Card className="backdrop-blur-sm bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-green-400/50 shadow-lg shadow-green-500/20">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <PartyPopper className="text-green-400 animate-bounce" size={28} />
                <h3 className="text-green-300 text-2xl font-bold">You Won!</h3>
                <PartyPopper className="text-green-400 animate-bounce" size={28} />
              </div>
              <p className="text-green-200 mb-4">You won {wonBets} out of {totalBets} bets!</p>
              <div className="text-4xl font-bold text-green-300 mb-2 animate-pulse">
                +${netResult.toFixed(2)}
              </div>
              <p className="text-green-400 font-medium">Net Winnings</p>
            </CardContent>
          </Card>
        ) : hadWins ? (
          <Card className="backdrop-blur-sm bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-orange-400/30">
            <CardContent className="p-5 text-center">
              <h3 className="text-orange-300 text-xl font-medium mb-3">Some Wins!</h3>
              <p className="text-orange-200 mb-3">You won {wonBets} out of {totalBets} bets</p>
              <div className="text-2xl font-bold text-orange-300">
                {netResult >= 0 ? '+' : ''}${netResult.toFixed(2)}
              </div>
              <p className="text-orange-400 text-sm mt-1">Net Result</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="backdrop-blur-sm bg-gradient-to-r from-gray-500/20 to-slate-500/20 border-gray-400/30">
            <CardContent className="p-5 text-center">
              <h3 className="text-gray-300 text-lg font-medium mb-3">Better Luck Next Time</h3>
              <p className="text-gray-400 mb-3">No winning bets this match</p>
              <div className="text-2xl font-bold text-red-300">
                -${totalStaked.toFixed(2)}
              </div>
              <p className="text-gray-400 text-sm mt-1">Total Staked</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <Card className="backdrop-blur-sm bg-gradient-to-r from-white/10 to-white/5 border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Trophy size={18} className="text-yellow-400" />
              Match Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-white">{totalBets}</div>
                <div className="text-xs text-gray-400">Total Bets</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-300">{wonBets}</div>
                <div className="text-xs text-gray-400">Won</div>
              </div>
              <div>
                <div className="text-xl font-bold text-red-300">{lostBets}</div>
                <div className="text-xs text-gray-400">Lost</div>
              </div>
            </div>
            
            <Separator className="my-4 bg-white/20" />
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-white">${totalStaked.toFixed(2)}</div>
                <div className="text-xs text-gray-400">Total Staked</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-300">${totalWinnings.toFixed(2)}</div>
                <div className="text-xs text-gray-400">Total Winnings</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bet Details */}
        <Card className="backdrop-blur-sm bg-gradient-to-r from-white/10 to-white/5 border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base">Your Bets</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {completedBets.map((bet) => (
                <div key={bet.id} className="border border-white/10 rounded-lg p-3 bg-white/5">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getBetTypeIcon(bet.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={bet.type === 'full-match' ? 'default' : 'secondary'} className="text-xs">
                            {bet.type === 'full-match' ? 'MATCH' : 'ACTION'}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            ${bet.amount} @ {bet.odds}
                          </span>
                          {bet.powerUpApplied && (
                            <Badge variant="outline" className="bg-yellow-500/20 border-yellow-400/30 text-yellow-300 text-xs">
                              2x
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {bet.won ? (
                            <>
                              <TrendingUp size={12} className="text-green-400" />
                              <Badge variant="outline" className="bg-green-500/20 border-green-400/30 text-green-300 text-xs">
                                +${bet.payout?.toFixed(2)}
                              </Badge>
                            </>
                          ) : (
                            <>
                              <TrendingDown size={12} className="text-red-400" />
                              <Badge variant="outline" className="bg-red-500/20 border-red-400/30 text-red-300 text-xs">
                                Lost
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-300">
                        {getBetDescription(bet)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Spacer for sticky button */}
        <div className="h-20"></div>
      </div>

      {/* Sticky Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent backdrop-blur-sm z-20">
        <div className="max-w-md mx-auto">
          <Button 
            onClick={resetForNewMatch}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-4 text-base shadow-lg"
          >
            <span>Continue to Lobby</span>
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>
      </div>

      {/* Automatic Confetti Animation for Wins */}
      {hadWins && netResult > 0 && (
        <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
          {[...Array(60)].map((_, i) => {
            const colors = ['bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-purple-400', 'bg-pink-400', 'bg-red-400', 'bg-orange-400'];
            const shapes = ['rounded-full', 'rounded-sm', 'rounded-none'];
            const sizes = ['w-1.5 h-1.5', 'w-2 h-2', 'w-2.5 h-2.5', 'w-1 h-3', 'w-3 h-1'];
            
            return (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 4}s`,
                  animationDuration: `${2.5 + Math.random() * 2.5}s`,
                }}
              >
                <div
                  className={`${colors[Math.floor(Math.random() * colors.length)]} ${shapes[Math.floor(Math.random() * shapes.length)]} ${sizes[Math.floor(Math.random() * sizes.length)]}`}
                  style={{
                    transform: `rotate(${Math.random() * 360}deg)`,
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Confetti Gun */}
      {confettiBlasts.map((blast) => (
        <div key={blast.id} className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
          {blast.particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute animate-confetti-blast"
              style={{
                left: `${blast.x}%`,
                top: `${blast.y}%`,
                '--blast-angle': `${particle.angle}deg`,
                '--blast-distance': `${particle.velocity}px`,
                animationDuration: '1.5s',
              } as React.CSSProperties}
            >
              <div
                className={`${particle.color} ${particle.shape} ${particle.size}`}
                style={{
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}