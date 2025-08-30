import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FloatingEmoji, FloatingEmojiData } from './FloatingEmoji';

interface EmojiReactionOverlayProps {
  isVisible: boolean;
  onEmojiSent?: (emoji: string) => void;
  otherPlayersEmojis?: FloatingEmojiData[];
}

const EMOJI_OPTIONS = ['😠', '😄', '😂', '😢'];
const EMOJI_LABELS = {
  '😠': 'Anger',
  '😄': 'Happy', 
  '😂': 'Laughter',
  '😢': 'Crying'
};

export function EmojiReactionOverlay({ 
  isVisible, 
  onEmojiSent,
  otherPlayersEmojis = []
}: EmojiReactionOverlayProps) {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmojiData[]>([]);
  const [pressStates, setPressStates] = useState<Record<string, boolean>>({});
  const [isHolding, setIsHolding] = useState<Record<string, boolean>>({});
  const intervalRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const touchStartTime = useRef<Record<string, number>>({});
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Add other players' emojis to the floating emojis list
  useEffect(() => {
    if (otherPlayersEmojis.length > 0) {
      setFloatingEmojis(prev => [...prev, ...otherPlayersEmojis]);
    }
  }, [otherPlayersEmojis]);

  const generateRandomPosition = useCallback(() => {
    // Generate position in the central area of the screen, avoiding edges
    const padding = 60;
    const maxWidth = window.innerWidth - padding * 2;
    const maxHeight = window.innerHeight - padding * 2;
    
    return {
      x: padding + Math.random() * maxWidth,
      y: padding + Math.random() * maxHeight * 0.6 // Keep in upper 60% of screen
    };
  }, []);

  const sendEmoji = useCallback((emoji: string, isOwn: boolean = true) => {
    const position = generateRandomPosition();
    const newEmoji: FloatingEmojiData = {
      id: `${Date.now()}-${Math.random()}`,
      emoji,
      x: position.x,
      y: position.y,
      isOwn
    };

    setFloatingEmojis(prev => [...prev, newEmoji]);
    
    if (isOwn && onEmojiSent) {
      onEmojiSent(emoji);
    }

    // Haptic feedback for mobile devices
    if ('vibrate' in navigator && isOwn) {
      navigator.vibrate(50);
    }
  }, [generateRandomPosition, onEmojiSent]);

  const handleEmojiComplete = useCallback((id: string) => {
    setFloatingEmojis(prev => prev.filter(emoji => emoji.id !== id));
  }, []);

  const startHoldEffect = useCallback((emoji: string) => {
    if (intervalRefs.current[emoji]) return;
    
    setIsHolding(prev => ({ ...prev, [emoji]: true }));
    
    intervalRefs.current[emoji] = setInterval(() => {
      sendEmoji(emoji);
    }, 200); // Send emoji every 200ms while holding
  }, [sendEmoji]);

  const stopHoldEffect = useCallback((emoji: string) => {
    if (intervalRefs.current[emoji]) {
      clearInterval(intervalRefs.current[emoji]);
      delete intervalRefs.current[emoji];
    }
    setIsHolding(prev => ({ ...prev, [emoji]: false }));
    setPressStates(prev => ({ ...prev, [emoji]: false }));
  }, []);

  // Touch event handlers
  const handleTouchStart = useCallback((emoji: string) => (e: React.TouchEvent) => {
    e.preventDefault();
    setPressStates(prev => ({ ...prev, [emoji]: true }));
    touchStartTime.current[emoji] = Date.now();
    
    // Send initial emoji immediately
    sendEmoji(emoji);
    
    // Start hold effect after 300ms
    setTimeout(() => {
      if (touchStartTime.current[emoji] && Date.now() - touchStartTime.current[emoji] >= 290) {
        startHoldEffect(emoji);
      }
    }, 300);
  }, [sendEmoji, startHoldEffect]);

  const handleTouchEnd = useCallback((emoji: string) => (e: React.TouchEvent) => {
    e.preventDefault();
    delete touchStartTime.current[emoji];
    stopHoldEffect(emoji);
  }, [stopHoldEffect]);

  // Mouse event handlers for desktop support
  const handleMouseDown = useCallback((emoji: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setPressStates(prev => ({ ...prev, [emoji]: true }));
    sendEmoji(emoji);
    
    setTimeout(() => {
      if (pressStates[emoji]) {
        startHoldEffect(emoji);
      }
    }, 300);
  }, [sendEmoji, startHoldEffect, pressStates]);

  const handleMouseUp = useCallback((emoji: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    stopHoldEffect(emoji);
  }, [stopHoldEffect]);

  const handleMouseLeave = useCallback((emoji: string) => () => {
    stopHoldEffect(emoji);
  }, [stopHoldEffect]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(intervalRefs.current).forEach(interval => {
        clearInterval(interval);
      });
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Floating emojis container */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9998 }}>
        <AnimatePresence>
          {floatingEmojis.map((emoji) => (
            <FloatingEmoji
              key={emoji.id}
              emoji={emoji}
              onComplete={handleEmojiComplete}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Emoji reaction buttons */}
      <motion.div
        className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="flex gap-3 p-3 bg-black/60 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              ref={(el) => { buttonRefs.current[emoji] = el; }}
              className={`
                relative w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                transition-all duration-150 select-none
                ${pressStates[emoji] || isHolding[emoji]
                  ? 'bg-white/30 scale-90 shadow-inner' 
                  : 'bg-white/10 hover:bg-white/20 active:bg-white/30 shadow-lg'
                }
                ${isHolding[emoji] ? 'ring-2 ring-blue-400/60 ring-pulse' : ''}
                touch-manipulation
              `}
              style={{ minHeight: '48px', minWidth: '48px' }} // Ensure minimum touch target size
              onTouchStart={handleTouchStart(emoji)}
              onTouchEnd={handleTouchEnd(emoji)}
              onMouseDown={handleMouseDown(emoji)}
              onMouseUp={handleMouseUp(emoji)}
              onMouseLeave={handleMouseLeave(emoji)}
              aria-label={`Send ${EMOJI_LABELS[emoji as keyof typeof EMOJI_LABELS]} reaction`}
            >
              <span className="pointer-events-none">
                {emoji}
              </span>
              
              {/* Visual feedback for holding */}
              {isHolding[emoji] && (
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-blue-400/60"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.6, 1, 0.6]
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </button>
          ))}
        </div>
        
        {/* Instruction text */}
        <motion.p
          className="text-center text-white/70 text-xs mt-2 px-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Tap to react • Hold to repeat
        </motion.p>
      </motion.div>
    </>
  );
}