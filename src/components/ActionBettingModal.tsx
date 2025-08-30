import React, { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerTitle } from './ui/drawer';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Clock, Zap, Pause } from 'lucide-react';
import { ActionEvent, PowerUp, GameState } from '../App';
import { formatCurrencyForButton } from './utils/formatCurrency';

interface ActionBettingDrawerProps {
  event: ActionEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onPlaceBet: (outcome: string, odds: number, amount: number) => void;
  timeLeft: number;
  gameState: GameState;
}

export function ActionBettingModal({ 
  event, 
  isOpen, 
  onClose, 
  onPlaceBet, 
  timeLeft, 
  gameState 
}: ActionBettingDrawerProps) {
  const [selectedOption, setSelectedOption] = useState<{ label: string; odds: number; outcome: string } | null>(null);
  const [betAmount, setBetAmount] = useState(gameState.lastActionBetAmount.toString());
  const [showBetSlip, setShowBetSlip] = useState(false);

  // Don't render if event is null
  if (!event) return null;

  const handleQuickStake = (amount: number) => {
    setBetAmount(amount.toString());
  };

  const handleSkip = () => {
    // Betting opportunity skipped
    onClose();
  };

  const handleOptionSelect = (option: { label: string; odds: number; outcome: string }) => {
    setSelectedOption(option);
    setShowBetSlip(true);
  };

  const handleBackToOptions = () => {
    setShowBetSlip(false);
    setSelectedOption(null);
  };

  const placeBet = () => {
    if (!selectedOption || !betAmount) return;

    const amount = parseFloat(betAmount);
    if (amount <= 0 || amount > gameState.wallet) {
      // Invalid bet amount
      return;
    }

    onPlaceBet(selectedOption.outcome, selectedOption.odds, amount);
    // Action bet placed
    onClose();
  };

  const progressPercentage = (timeLeft / 15) * 100;

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent 
        data-testid="action-betting-modal"
        className="max-h-[96vh] h-[96vh] dark bg-background border-t-2 border-sidebar-primary/50 shadow-[0_-20px_80px_-12px] shadow-sidebar-primary/30 ring-1 ring-sidebar-primary/20 [&>button]:hidden [&>[data-vaul-drag-handle]]:hidden flex flex-col" 
        aria-describedby={undefined}
      >
        {/* Visually hidden title for accessibility */}
        <DrawerTitle className="sr-only">
          Action Betting Opportunity
        </DrawerTitle>
        {/* Glowing top edge */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary to-transparent opacity-60"></div>
        <div className="absolute top-0 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-sidebar-primary/40 to-transparent blur-sm"></div>

        
        <div className="flex flex-col flex-1 min-h-0">
          {/* Scrollable content area */}
          <div className="px-4 space-y-4 overflow-y-auto flex-1 min-h-0">
            {/* Timer */}
            <div className={`bg-gradient-to-r from-red-500/10 via-orange-500/5 to-red-500/10 border border-red-400/30 rounded-xl p-4 shadow-lg shadow-red-500/10 transition-all duration-300 ${
              timeLeft <= 3 ? 'shadow-red-500/30 border-red-400/60' : ''
            }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-foreground">
                <div className={`p-1.5 bg-red-500/20 rounded-full border border-red-400/40 transition-all duration-300 ${
                  timeLeft <= 3 ? 'animate-pulse bg-red-500/40 border-red-400/80' : ''
                }`}>
                  <Clock size={14} className="text-red-400" />
                </div>
                <span className="font-medium">Time Remaining</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-mono text-red-400 font-bold bg-red-500/20 px-3 py-1 rounded-lg border border-red-400/40 shadow-lg shadow-red-500/20">
                  {timeLeft}s
                </span>
              </div>
            </div>
            <div className="relative">
              <Progress 
                value={progressPercentage} 
                className={`h-4 rounded-full overflow-hidden transition-all duration-300 ${
                  timeLeft <= 3 ? 'animate-pulse' : ''
                }`}
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500/80 via-orange-400/80 to-red-600/80 opacity-90"></div>
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-400 via-orange-300 to-yellow-400 rounded-full transition-all duration-150 ease-out shadow-lg"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse rounded-full"></div>
              </div>
              {timeLeft <= 3 && (
                <div className="absolute -inset-1 bg-red-500/40 rounded-full blur-sm animate-pulse"></div>
              )}
            </div>
          </div>

          {/* Event Description */}
          <div className="text-center py-3 px-4 bg-sidebar-primary/15 border border-sidebar-primary/40 rounded-xl shadow-lg shadow-sidebar-primary/10">
            <p className="text-lg text-foreground font-medium bg-gradient-to-r from-chart-2 via-chart-3/80 to-foreground bg-clip-text text-transparent">
              {event.description}
            </p>
          </div>

          {!showBetSlip ? (
            /* Betting Options */
            <div className="space-y-4">
              <h4 className="font-medium text-foreground flex items-center gap-2 text-lg">
                <div className="w-3 h-3 bg-sidebar-primary rounded-full animate-pulse shadow-lg"></div>
                Choose your bet:
              </h4>
              <div className="space-y-3">
                {event.bettingOptions?.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full h-20 flex justify-between items-center p-6 border-2 border-sidebar-primary/40 hover:bg-sidebar-primary/20 text-foreground hover:border-sidebar-primary/70 transition-all duration-300 bg-gradient-to-r from-sidebar-primary/10 to-sidebar-primary/5 hover:shadow-2xl hover:shadow-sidebar-primary/30 hover:scale-[1.02] transform"
                    onClick={() => handleOptionSelect(option)}
                    disabled={timeLeft === 0}
                  >
                    <span className="font-semibold text-lg">{option.label}</span>
                    <Badge variant="secondary" className="bg-gradient-to-r from-sidebar-primary/60 to-sidebar-primary/80 text-sidebar-primary-foreground border-sidebar-primary/70 font-bold px-4 py-2 shadow-lg text-lg">
                      @{option.odds}
                    </Badge>
                  </Button>
                ))}
              </div>
              
              <Button
                variant="ghost"
                className="w-full h-12 text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-muted-foreground/30 hover:border-muted-foreground/50 transition-all duration-200 mt-4"
                onClick={handleSkip}
                disabled={timeLeft === 0}
              >
                Skip Betting Opportunity
              </Button>
            </div>
          ) : (
            /* Bet Slip */
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Bet Slip</h4>
              
              <div className="border border-sidebar-primary/30 rounded-xl p-4 bg-sidebar-primary/10">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Selection:</span>
                    <Badge variant="secondary" className="bg-sidebar-primary/20 text-sidebar-primary border-sidebar-primary/30">
                      {selectedOption?.label}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Odds:</span>
                    <span className="font-bold text-foreground">{selectedOption?.odds}</span>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">Bet Amount:</label>
                    
                    {/* Quick stake buttons */}
                    <div className="grid grid-cols-4 gap-2">
                      {[25, 50, 100, 250].map((amount) => (
                        <Button
                          key={amount}
                          variant={parseInt(betAmount) === amount ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleQuickStake(amount)}
                          disabled={amount > gameState.wallet || timeLeft === 0}
                          className={parseInt(betAmount) === amount 
                            ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary text-xs hover:bg-sidebar-primary/90" 
                            : "border-border text-foreground hover:bg-accent text-xs"
                          }
                        >
                          ${amount}
                        </Button>
                      ))}
                    </div>
                    
                    {/* Custom stake input with better styling */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-muted-foreground text-sm">$</span>
                      </div>
                      <Input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        placeholder="Custom amount"
                        min="1"
                        max={gameState.wallet}
                        disabled={timeLeft === 0}
                        className="pl-8 bg-input border border-border focus:border-sidebar-primary text-foreground placeholder-muted-foreground transition-colors"
                      />
                    </div>
                    
                    {/* Wallet balance indicator */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Available:</span>
                      <span className="text-foreground font-medium">${gameState.wallet.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-chart-4/20 via-chart-4/15 to-chart-4/20 rounded-xl p-4 border-2 border-chart-4/40 shadow-lg shadow-chart-4/20">
                    <div className="flex items-center justify-between">
                      <span className="text-chart-4 font-bold text-lg">Potential Win</span>
                      <span className="text-foreground font-bold text-2xl bg-chart-4/90 text-white px-4 py-2 rounded-lg shadow-md">
                        ${(parseFloat(betAmount || '0') * (selectedOption?.odds || 1)).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-chart-4/90 text-sm mt-3 bg-chart-4/10 rounded-lg px-3 py-2 border border-chart-4/30">
                      Stake: <span className="font-bold text-chart-4">${parseFloat(betAmount || '0').toFixed(2)}</span> • Odds: <span className="font-bold text-chart-4">{selectedOption?.odds}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

            {/* Power-up Notice */}
            {gameState.powerUp && (
              <div className="bg-sidebar-primary/15 border border-sidebar-primary/40 rounded-xl p-4 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-sidebar-primary/5 animate-pulse"></div>
                <div className="flex items-center justify-center gap-2 text-sidebar-primary relative z-10">
                  <div className="p-1.5 bg-sidebar-primary/20 rounded-full border border-sidebar-primary/40">
                    <Zap size={16} className="animate-pulse" />
                  </div>
                  <span className="font-bold bg-gradient-to-r from-chart-2 via-chart-3/80 to-foreground bg-clip-text text-transparent">
                    Power-up active! Win this bet for 2x multiplier!
                  </span>
                </div>
              </div>
            )}


          </div>

          {/* Sticky Action Buttons - Only show when in bet slip mode */}
          {showBetSlip && (
            <div className="border-t border-sidebar-primary/30 bg-gradient-to-b from-background via-background to-background/95 backdrop-blur-sm px-4 py-4 flex-shrink-0 space-y-3">
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={placeBet} 
                  className="flex-1 h-12 bg-gradient-to-r from-sidebar-primary to-sidebar-primary/80 hover:from-sidebar-primary/90 hover:to-sidebar-primary/70 text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/30 hover:shadow-xl hover:shadow-sidebar-primary/40 font-bold transition-all duration-200"
                  disabled={timeLeft === 0 || !betAmount || parseFloat(betAmount) <= 0 || parseFloat(betAmount) > gameState.wallet}
                >
                  {!betAmount || parseFloat(betAmount) <= 0 ? 'Enter Amount' : 
                   parseFloat(betAmount) > gameState.wallet ? 'Insufficient Funds' : 
                   `Confirm Bet - ${formatCurrencyForButton(parseFloat(betAmount))}`}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleBackToOptions}
                  disabled={timeLeft === 0}
                  className="px-4 border-border text-foreground hover:bg-accent"
                >
                  Back
                </Button>
              </div>
              
              {/* Wallet Balance in sticky footer */}
              <div className="text-center text-muted-foreground text-sm bg-muted/30 border border-muted-foreground/20 rounded-lg py-2 px-4">
                💰 Wallet Balance: <span className="text-foreground font-medium">${gameState.wallet.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}