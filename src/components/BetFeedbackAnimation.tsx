import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DollarSign, TrendingUp } from 'lucide-react';

interface BetFeedbackAnimationProps {
  isVisible: boolean;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  betAmount: number;
  onComplete: () => void;
  animationId?: string;
}

export function BetFeedbackAnimation({
  isVisible,
  startPosition,
  endPosition,
  betAmount,
  onComplete,
  animationId = 'unknown'
}: BetFeedbackAnimationProps) {
  const [mounted, setMounted] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);

  useEffect(() => {
    if (isVisible) {
      console.log('🎬 BetFeedbackAnimation mounting with:', { startPosition, endPosition, betAmount });
      setMounted(true);
      
      // Start animation after a brief delay to ensure element is rendered
      setTimeout(() => {
        setAnimationStarted(true);
      }, 50);
    }
  }, [isVisible, startPosition, endPosition, betAmount]);

  if (!mounted) return null;

  console.log('🎭 BetFeedbackAnimation rendering:', { isVisible, mounted, startPosition, endPosition });

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <>
          {/* Clean, elegant bet token */}
          <div 
            className="fixed w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-sm"
            style={{ 
              left: animationStarted ? endPosition.x - 32 : startPosition.x - 32, 
              top: animationStarted ? endPosition.y - 32 : startPosition.y - 32,
              zIndex: 99999,
              background: 'rgba(16, 185, 129, 0.9)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              transition: 'all 1.0s cubic-bezier(0.4, 0.0, 0.2, 1)',
              transform: animationStarted ? 'scale(0.9)' : 'scale(1.1)',
              opacity: animationStarted ? 0.8 : 1,
              boxShadow: '0 8px 25px -5px rgba(16, 185, 129, 0.3), 0 2px 10px -2px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="text-center">
              <DollarSign className="w-6 h-6 text-white" />
              <div className="text-white font-medium text-xs mt-0.5">${betAmount}</div>
            </div>
          </div>
          
          {/* Main bet token animation */}
          <motion.div
            className="fixed pointer-events-none"
            style={{ zIndex: 99997 }}
            initial={{
              x: startPosition.x - 20,
              y: startPosition.y - 20,
              scale: 0.8,
              opacity: 0
            }}
            animate={{
              x: endPosition.x - 20,
              y: endPosition.y - 20,
              scale: 1,
              opacity: 1,
              transition: {
                duration: 1.2,
                ease: [0.25, 0.46, 0.45, 0.94],
                opacity: { duration: 0.3 }
              }
            }}
            exit={{
              scale: 0.6,
              opacity: 0,
              transition: {
                duration: 0.3,
                delay: 0.2
              }
            }}
          >
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-4 shadow-xl border-4 border-white">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
          </motion.div>

          {/* Amount indicator */}
          <motion.div
            className="fixed z-50 pointer-events-none"
            initial={{
              x: startPosition.x + 10,
              y: startPosition.y - 10,
              scale: 0.5,
              opacity: 0
            }}
            animate={{
              x: endPosition.x + 10,
              y: endPosition.y - 10,
              scale: 1,
              opacity: 1,
              transition: {
                duration: 0.8,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 0.1
              }
            }}
            exit={{
              scale: 0.3,
              opacity: 0,
              y: endPosition.y - 30,
              transition: {
                duration: 0.4,
                delay: 0.1
              }
            }}
          >
            <div className="bg-green-500 text-white px-2 py-1 rounded-md shadow-md flex items-center gap-1">
              <span className="text-sm font-medium">${betAmount}</span>
              <TrendingUp className="w-3 h-3" />
            </div>
          </motion.div>

          {/* Trail effect */}
          <motion.div
            className="fixed z-40 pointer-events-none"
            initial={{
              x: startPosition.x,
              y: startPosition.y,
              scale: 1,
              opacity: 0.6
            }}
            animate={{
              x: endPosition.x,
              y: endPosition.y,
              scale: 0.8,
              opacity: 0,
              transition: {
                duration: 1,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 0.1
              }
            }}
          >
            <div className="bg-gradient-to-r from-blue-500/30 to-purple-600/30 rounded-full p-4 blur-sm">
              <div className="w-6 h-6" />
            </div>
          </motion.div>

          {/* Success ripple at destination */}
          <motion.div
            className="fixed z-30 pointer-events-none"
            initial={{
              x: endPosition.x - 15,
              y: endPosition.y - 15,
              scale: 0,
              opacity: 0
            }}
            animate={{
              scale: [0, 1.5, 0],
              opacity: [0, 0.4, 0],
              transition: {
                duration: 0.6,
                delay: 0.7,
                times: [0, 0.3, 1]
              }
            }}
          >
            <div className="w-8 h-8 rounded-full border-2 border-green-400" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}