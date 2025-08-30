import { useState, useEffect } from 'react';

/**
 * Custom hook for animating number changes with a counting effect
 * Similar to header balance animation but faster and more customizable
 */
export function useCountingAnimation(targetValue: number, speed: 'fast' | 'normal' = 'fast') {
  const [animatedValue, setAnimatedValue] = useState(targetValue);

  useEffect(() => {
    if (animatedValue !== targetValue) {
      const diff = targetValue - animatedValue;
      const steps = speed === 'fast' ? 5 : 10;
      const stepAmount = diff / steps;
      const intervalMs = speed === 'fast' ? 20 : 50; // Much faster than header (20ms vs 50ms)
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        if (currentStep <= steps) {
          setAnimatedValue(prev => prev + stepAmount);
        } else {
          setAnimatedValue(targetValue);
          clearInterval(interval);
        }
      }, intervalMs);

      return () => clearInterval(interval);
    }
  }, [targetValue, animatedValue, speed]);

  return Math.round(animatedValue);
}