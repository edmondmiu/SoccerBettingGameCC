import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, TrendingDown, Users, DollarSign, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

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

interface LiveBettingFeedProps {
  recentBets: BettingActivity[];
  playerCount: number;
  isVisible: boolean;
}

export function LiveBettingFeed({ recentBets, playerCount, isVisible }: LiveBettingFeedProps) {
  const [isMinimized, setIsMinimized] = useState(true);
  const [visibleBets, setVisibleBets] = useState<BettingActivity[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Update visible bets with smooth transitions
  useEffect(() => {
    if (recentBets.length > 0) {
      setVisibleBets(recentBets.slice(0, isMinimized ? 3 : 10));
    }
  }, [recentBets, isMinimized]);

  if (!isVisible) return null;

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return '1h+ ago';
  };

  const formatAmount = (amount: number) => {
    return amount >= 1000 ? `$${(amount / 1000).toFixed(1)}k` : `$${amount}`;
  };

  const getBetResultIcon = (bet: BettingActivity) => {
    if (bet.won === undefined) return <Clock className="w-3 h-3 text-yellow-400" />;
    return bet.won ? 
      <TrendingUp className="w-3 h-3 text-green-400" /> : 
      <TrendingDown className="w-3 h-3 text-red-400" />;
  };

  const getBetResultColor = (bet: BettingActivity) => {
    if (bet.won === undefined) return 'bg-yellow-500/20 border-yellow-400/30';
    return bet.won ? 'bg-green-500/20 border-green-400/30' : 'bg-red-500/20 border-red-400/30';
  };

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-40"
      initial={{ y: isMinimized ? 60 : 0 }}
      animate={{ y: isMinimized ? 60 : 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Drag handle and header */}
      <div 
        className="bg-black/60 backdrop-blur-md border-t border-white/10 cursor-pointer touch-manipulation"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-white text-sm font-medium">Live Activity</span>
            <Badge variant="outline" className="bg-blue-500/20 border-blue-400/30 text-blue-300 text-xs">
              {playerCount} players
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {visibleBets.length > 0 && (
              <Badge variant="outline" className="bg-green-500/20 border-green-400/30 text-green-300 text-xs">
                {visibleBets.length} bets
              </Badge>
            )}
            {isMinimized ? 
              <ChevronUp className="w-4 h-4 text-gray-400" /> : 
              <ChevronDown className="w-4 h-4 text-gray-400" />
            }
          </div>
        </div>

        {/* Minimized preview */}
        {isMinimized && visibleBets.length > 0 && (
          <div className="px-4 pb-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {visibleBets.slice(0, 2).map((bet, index) => (
                <motion.div
                  key={bet.playerId + bet.timestamp}
                  className={`flex-shrink-0 px-2 py-1 rounded-md border ${getBetResultColor(bet)}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-1 text-xs text-white/80">
                    <span className="font-medium">{bet.playerName}</span>
                    <span>bet {formatAmount(bet.amount)}</span>
                    {getBetResultIcon(bet)}
                  </div>
                </motion.div>
              ))}
              {visibleBets.length > 2 && (
                <div className="flex-shrink-0 px-2 py-1 rounded-md bg-white/10 border border-white/20">
                  <span className="text-xs text-white/60">+{visibleBets.length - 2} more</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expanded feed */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            className="bg-black/60 backdrop-blur-md border-t border-white/10 max-h-64 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div 
              ref={scrollRef}
              className="overflow-y-auto max-h-60 scrollbar-hide"
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitScrollbar: { display: 'none' }
              }}
            >
              <div className="p-4 space-y-2">
                <AnimatePresence>
                  {visibleBets.map((bet, index) => (
                    <motion.div
                      key={bet.playerId + bet.timestamp}
                      className={`p-3 rounded-lg border backdrop-blur-sm ${getBetResultColor(bet)}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium text-sm">{bet.playerName}</span>
                            <span className="text-white/60 text-xs">•</span>
                            <span className="text-white/60 text-xs">{formatTimeAgo(bet.timestamp)}</span>
                          </div>
                          
                          <div className="text-white/80 text-sm">
                            <span className="font-medium">{formatAmount(bet.amount)}</span>
                            <span className="text-white/60"> on </span>
                            <span className="font-medium">
                              {bet.teamName ? `${bet.teamName} Win` : bet.outcome}
                            </span>
                            <span className="text-white/60"> @ </span>
                            <span className="text-green-400 font-medium">{bet.odds.toFixed(1)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getBetResultIcon(bet)}
                          {bet.won !== undefined && (
                            <span className={`text-xs font-medium ${
                              bet.won ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {bet.won ? `+${formatAmount(Math.round(bet.amount * bet.odds - bet.amount))}` : `-${formatAmount(bet.amount)}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {visibleBets.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No recent betting activity</p>
                    <p className="text-gray-500 text-xs mt-1">Bets will appear here as players place them</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}