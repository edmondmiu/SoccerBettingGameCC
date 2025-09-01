import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Users, User, LogOut, Menu, X, ArrowLeft, Zap, Trophy } from 'lucide-react';
import { GameState } from '../App';

interface HeaderProps {
  gameState: GameState;
  totalPlayersOnline?: number;
  showBackButton?: boolean;
  onBackClick?: () => void;
  onDebugActionBet?: () => void;
  onDebugMatchSummary?: () => void;
  updateGameState?: (updates: Partial<GameState>) => void;
}

export function Header({ gameState, totalPlayersOnline = 0, showBackButton = false, onBackClick, onDebugActionBet, onDebugMatchSummary, updateGameState }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [animatedBalance, setAnimatedBalance] = useState(gameState.wallet);
  const APP_VERSION = (import.meta as any)?.env?.VITE_APP_VERSION || '0.1.0';

  // Animate balance changes
  useEffect(() => {
    if (animatedBalance !== gameState.wallet) {
      const diff = gameState.wallet - animatedBalance;
      const steps = 10;
      const stepAmount = diff / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        if (currentStep <= steps) {
          setAnimatedBalance(prev => prev + stepAmount);
        } else {
          setAnimatedBalance(gameState.wallet);
          clearInterval(interval);
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [gameState.wallet, animatedBalance]);

  const handleAccountClick = () => {
    // Placeholder for account page navigation
    console.log('Navigate to account page');
    setIsMenuOpen(false);
  };

  const handleAnimationToggle = (enabled: boolean) => {
    if (updateGameState) {
      updateGameState({ 
        settings: { 
          ...gameState.settings, 
          betAnimations: enabled 
        } 
      });
    }
  };

  const handleLogoutClick = () => {
    // Placeholder for logout functionality
    console.log('Logout user');
    setIsMenuOpen(false);
  };

  const handleDebugActionBet = () => {
    if (onDebugActionBet) {
      onDebugActionBet();
    }
    setIsMenuOpen(false);
  };

  const handleDebugMatchSummary = () => {
    if (onDebugMatchSummary) {
      onDebugMatchSummary();
    }
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/80 border-b border-white/10">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              {showBackButton && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onBackClick}
                  className="text-white hover:bg-white/10 p-2 -ml-2"
                >
                  <ArrowLeft size={18} />
                </Button>
              )}
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border border-slate-900"></div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-white font-bold text-lg tracking-tight">Next Goal</h1>
                  {/* Inline version badge to guarantee visibility for verification */}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300 border border-white/20">v{APP_VERSION}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  Live Betting
                </div>
              </div>
            </div>

            {/* Center Stats - Hidden on very small screens */}
            <div className="hidden sm:flex items-center gap-4">
              {/* Players Online */}
              <div className="flex items-center gap-1.5 backdrop-blur-sm bg-white/5 rounded-full px-3 py-1.5 border border-white/10">
                <Users size={14} className="text-blue-400" />
                <span className="text-white text-sm font-medium">
                  {totalPlayersOnline.toLocaleString()}
                </span>
                <span className="text-gray-400 text-xs">online</span>
              </div>

              {/* Balance */}
              <div className="flex items-center gap-1.5 backdrop-blur-sm bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-full px-3 py-1.5 border border-emerald-400/20">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-white text-sm font-bold">
                  ${Math.round(animatedBalance).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Right Side - Account Menu */}
            <div className="flex items-center gap-2">
              
              {/* Mobile Stats */}
              <div className="sm:hidden flex items-center gap-2">
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs px-2 py-1 flex items-center gap-1">
                  <Users size={10} />
                  {totalPlayersOnline}
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-xs px-2 py-1">
                  ${Math.round(animatedBalance).toLocaleString()}
                </Badge>
                {gameState.powerUp && (
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30 text-xs px-2 py-1 flex items-center gap-1 animate-pulse">
                    <Zap size={10} />
                    x2
                  </Badge>
                )}
              </div>

              {/* Account Button */}
              <Button
                size="sm"
                variant="ghost"
                className="relative text-white hover:bg-white/10 p-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Account Menu Overlay */}
      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
            onClick={() => setIsMenuOpen(false)}
          />
          
          <div className="fixed top-16 right-4 z-40 backdrop-blur-md bg-slate-900/95 rounded-xl border border-white/20 shadow-2xl w-48">
            
            {/* User Info Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <User size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Player</p>
                  <p className="text-gray-400 text-xs">Level 1 Bettor</p>
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="p-4 border-b border-white/10 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Balance</span>
                <span className="text-white font-bold text-sm">
                  ${Math.round(animatedBalance).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Active Bets</span>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs">
                  {gameState.activeBets.filter(bet => !bet.resolved).length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Players Online</span>
                <span className="text-green-400 text-sm font-medium">
                  {totalPlayersOnline.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-white/10 text-sm"
                onClick={handleAccountClick}
              >
                <User size={16} className="mr-3" />
                My Account
              </Button>
              
              {/* Animation Toggle */}
              <div className="flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded-md">
                <div className="flex items-center">
                  <Zap size={16} className="mr-3 text-emerald-400" />
                  <span className="text-white text-sm">Bet Animations</span>
                </div>
                <Switch
                  checked={gameState.settings.betAnimations}
                  onCheckedChange={handleAnimationToggle}
                  className="ml-2"
                />
              </div>

              {/* Debug Action Bet Button - Only show in match phase */}
              {gameState.phase === 'match' && onDebugActionBet && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-orange-400 hover:bg-orange-500/10 text-sm"
                  onClick={handleDebugActionBet}
                >
                  <Zap size={16} className="mr-3" />
                  <span className="truncate">Debug Action</span>
                </Button>
              )}

              {/* Debug Match Summary Button - Show in match phase */}
              {gameState.phase === 'match' && onDebugMatchSummary && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-yellow-400 hover:bg-yellow-500/10 text-sm"
                  onClick={handleDebugMatchSummary}
                >
                  <Trophy size={16} className="mr-3" />
                  <span className="truncate">Debug Summary</span>
                </Button>
              )}
              
              <div className="border-t border-white/10 mt-2 pt-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-400 hover:bg-red-500/10 text-sm"
                  onClick={handleLogoutClick}
                >
                  <LogOut size={16} className="mr-3" />
                  Sign Out
                </Button>
                <div className="mt-2 px-3 py-1 text-[11px] text-gray-400/90 border-t border-white/10">
                  Version v{APP_VERSION}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
