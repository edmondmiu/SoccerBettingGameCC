import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { X, Trash2, TrendingUp, DollarSign } from 'lucide-react';
import { GameState, BetslipSelection } from '../App';

interface BetslipDrawerProps {
  gameState: GameState;
  updateGameState: (updates: Partial<GameState>) => void;
  removeFromBetslip: (selectionId: string) => void;
  clearBetslip: () => void;
  placeBetslipBets: () => boolean;
  triggerBetFeedback: (startElement: HTMLElement | null, endElement: HTMLElement | null, betAmount: number) => void;
}

const quickStakeAmounts = [25, 50, 100, 250, 500, 1000];

// Simple currency formatting function
const formatCurrencySimple = (amount: number): string => {
  const num = Math.floor(Number(amount) || 0);
  if (num >= 1000) {
    return `$${num.toLocaleString()}`;
  }
  return `$${num}`;
};

export function BetslipDrawer({ 
  gameState, 
  updateGameState, 
  removeFromBetslip, 
  clearBetslip, 
  placeBetslipBets,
  triggerBetFeedback 
}: BetslipDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { betslipSelections, betslipStake, wallet } = gameState;
  const totalCost = betslipSelections.reduce((total, selection) => total + selection.amount, 0);
  const totalPotentialWin = betslipSelections.reduce((total, selection) => 
    total + (selection.amount * selection.odds), 0
  );
  const totalPotentialProfit = totalPotentialWin - totalCost;

  const updateStake = (amount: number) => {
    updateGameState({ betslipStake: Math.max(1, amount) });
  };

  const handlePlaceBets = () => {
    if (totalCost > wallet) {
      return;
    }

    // Trigger bet feedback animation (only if enabled)
    if (gameState.settings.betAnimations) {
      const placeBetslipButton = document.querySelector('[data-testid="place-betslip-button"]');
      const summaryElement = document.querySelector('[data-testid="betting-summary"]');
      if (placeBetslipButton && summaryElement) {
        triggerBetFeedback(placeBetslipButton, summaryElement, totalCost);
      }
    }

    const success = placeBetslipBets();
    if (success) {
      setIsExpanded(false);
    }
  };

  const getOutcomeLabel = (selection: BetslipSelection) => {
    switch (selection.outcome) {
      case 'home': return selection.homeTeam;
      case 'away': return selection.awayTeam;
      case 'draw': return 'Draw';
      default: return selection.outcomeLabel;
    }
  };

  return (
    <>
      {/* Overlay when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Betslip Drawer */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-120px)]'
      }`}>
        
        {/* Simplified Preview Header (always visible) */}
        <div 
          data-testid="betslip-preview"
          className="backdrop-blur-md bg-gradient-to-r from-sidebar-primary/90 to-sidebar-primary/70 border-t border-sidebar-primary/30 shadow-lg shadow-sidebar-primary/20"
        >
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <TrendingUp size={18} className="text-white" />
                <span className="text-white font-semibold">Betslip</span>
                <Badge className="bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground border-sidebar-primary-foreground/30 text-xs font-bold">
                  {betslipSelections.length}
                </Badge>
                <div 
                  className="ml-2 cursor-pointer hover:bg-white/10 rounded px-2 py-1 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                >
                  <span className="text-sidebar-primary-foreground text-sm font-medium">
                    {formatCurrencySimple(totalCost)} cost • {formatCurrencySimple(totalPotentialWin)} to win
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        <div className="backdrop-blur-md bg-gradient-to-b from-background/95 via-card/95 to-sidebar/95 border-t border-sidebar-primary/20 max-h-[70vh] overflow-hidden shadow-inner shadow-sidebar-primary/10">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-primary/20">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-sidebar-primary/20 rounded-full border border-sidebar-primary/40">
                <TrendingUp size={18} className="text-sidebar-primary" />
              </div>
              <h3 className="text-foreground font-bold bg-gradient-to-r from-sidebar-primary to-foreground bg-clip-text text-transparent">Your Betslip</h3>
              <Badge className="bg-sidebar-primary/20 text-sidebar-primary border-sidebar-primary/40 font-bold">
                {betslipSelections.length} selections
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={clearBetslip}
              >
                <Trash2 size={14} className="mr-1" />
                Clear
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={() => setIsExpanded(false)}
              >
                <X size={16} />
              </Button>
            </div>
          </div>

          {/* Selections */}
          <div className="max-h-48 overflow-y-auto">
            {betslipSelections.map((selection) => (
              <div key={selection.id} className="p-4 border-b border-white/5 hover:bg-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white text-sm font-medium">
                        {selection.homeTeam} v {selection.awayTeam}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                        onClick={() => removeFromBetslip(selection.id)}
                      >
                        <X size={12} />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-xs">
                        {getOutcomeLabel(selection)}
                      </Badge>
                      <span className="text-gray-300 text-xs">@{selection.odds}</span>
                      <span className="text-blue-300 text-xs">${selection.amount} stake</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">
                      {formatCurrencySimple(selection.amount * selection.odds)}
                    </p>
                    <p className="text-gray-400 text-xs">potential win</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Place Bet Section */}
          <div className="p-4 bg-slate-800/60 border-t border-white/10">
            <div className="grid grid-cols-3 gap-3 mb-4 text-center">
              <div>
                <p className="text-gray-400 text-xs">Total Cost</p>
                <p className="text-white font-semibold">{formatCurrencySimple(totalCost)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Potential Win</p>
                <p className="text-green-300 font-semibold">{formatCurrencySimple(totalPotentialWin)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Profit</p>
                <p className="text-green-400 font-bold">{formatCurrencySimple(totalPotentialProfit)}</p>
              </div>
            </div>
            
            <Button
              data-testid="place-betslip-button"
              onClick={handlePlaceBets}
              disabled={totalCost > wallet}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 font-bold py-4 text-lg rounded-xl shadow-lg"
            >
              {totalCost > wallet ? 'Insufficient Funds' : `Place ${betslipSelections.length} Bet${betslipSelections.length > 1 ? 's' : ''} - ${formatCurrencySimple(totalCost)}`}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}