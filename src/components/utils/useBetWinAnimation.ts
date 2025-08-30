import { useState, useCallback } from 'react';

export interface BetWinDetails {
  betId: string;
  winAmount: number;
  betType: 'action' | 'full-match' | 'lobby';
}

export function useBetWinAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const [winDetails, setWinDetails] = useState<BetWinDetails | null>(null);

  const triggerWinAnimation = useCallback((details: BetWinDetails) => {
    // Only show animation for action bets
    if (details.betType === 'action') {
      setWinDetails(details);
      setIsVisible(true);
    }
  }, []);

  const hideWinAnimation = useCallback(() => {
    setIsVisible(false);
    setWinDetails(null);
  }, []);

  return {
    isVisible,
    winDetails,
    triggerWinAnimation,
    hideWinAnimation
  };
}