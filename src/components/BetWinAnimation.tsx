import { useEffect } from 'react';

interface BetWinAnimationProps {
  isVisible: boolean;
  winAmount: number;
  onAnimationComplete: () => void;
}

export function BetWinAnimation({ isVisible, winAmount, onAnimationComplete }: BetWinAnimationProps) {
  useEffect(() => {
    if (!isVisible) return;

    // Find the betting summary card and trigger its pulse animation
    const bettingSummaryCard = document.querySelector('[data-testid="betting-summary"]');
    
    if (bettingSummaryCard) {
      // Add the same animation classes used by BettingSummary
      bettingSummaryCard.classList.add('animate-pulse', 'ring-2', 'ring-green-400/50', 'shadow-lg', 'shadow-green-400/20');
      
      // Remove the animation after 1 second (same duration as BettingSummary)
      setTimeout(() => {
        bettingSummaryCard.classList.remove('animate-pulse', 'ring-2', 'ring-green-400/50', 'shadow-lg', 'shadow-green-400/20');
        onAnimationComplete();
      }, 1000);
    } else {
      // If betting summary not found, just complete immediately
      onAnimationComplete();
    }
  }, [isVisible, onAnimationComplete]);

  // This component doesn't render anything - it just triggers DOM manipulation
  return null;
}