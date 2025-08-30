import { useState, useCallback, useRef } from 'react';

export interface BetFeedbackState {
  id: string;
  isVisible: boolean;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  betAmount: number;
}

export function useBetFeedback() {
  const [animations, setAnimations] = useState<BetFeedbackState[]>([]);
  const animationIdRef = useRef(0);

  const triggerBetFeedback = useCallback((
    startElement: HTMLElement | null,
    endElement: HTMLElement | null,
    betAmount: number
  ) => {
    console.log('🎯 Bet Feedback Triggered!', { startElement, endElement, betAmount });
    
    if (!startElement || !endElement) {
      console.log('❌ Missing elements:', { startElement, endElement });
      return;
    }

    const startRect = startElement.getBoundingClientRect();
    const endRect = endElement.getBoundingClientRect();

    console.log('📍 Element positions:', { startRect, endRect });

    // Calculate center positions
    const startPosition = {
      x: startRect.left + startRect.width / 2,
      y: startRect.top + startRect.height / 2
    };

    const endPosition = {
      x: endRect.left + endRect.width / 2,
      y: endRect.top + endRect.height / 2
    };

    console.log('🚀 Animation positions:', { startPosition, endPosition });

    const animationId = `bet-feedback-${animationIdRef.current++}`;

    const newAnimation: BetFeedbackState = {
      id: animationId,
      isVisible: true,
      startPosition,
      endPosition,
      betAmount
    };

    setAnimations(prev => {
      console.log('🎬 Adding animation:', newAnimation);
      return [...prev, newAnimation];
    });

    // Auto-remove after animation completes
    setTimeout(() => {
      setAnimations(prev => prev.filter(anim => anim.id !== animationId));
    }, 2000);
  }, []);

  const removeBetFeedback = useCallback((id: string) => {
    setAnimations(prev => prev.filter(anim => anim.id !== id));
  }, []);

  const getBetsSummaryElement = useCallback(() => {
    return document.querySelector('[data-testid="betting-summary"]') as HTMLElement;
  }, []);

  return {
    animations,
    triggerBetFeedback,
    removeBetFeedback,
    getBetsSummaryElement
  };
}