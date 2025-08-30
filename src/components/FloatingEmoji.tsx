import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface FloatingEmojiData {
  id: string;
  emoji: string;
  x: number;
  y: number;
  isOwn: boolean;
}

interface FloatingEmojiProps {
  emoji: FloatingEmojiData;
  onComplete: (id: string) => void;
}

export function FloatingEmoji({ emoji, onComplete }: FloatingEmojiProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const timeout = setTimeout(() => {
      onComplete(emoji.id);
    }, 4000); // Match the new animation duration

    return () => clearTimeout(timeout);
  }, [emoji.id, onComplete]);

  if (!mounted) return null;

  // Create streaming trajectory that arcs across screen
  const screenCenter = typeof window !== 'undefined' ? window.innerWidth / 2 : 400;
  const isFromLeft = emoji.x < screenCenter;
  
  // Create restricted arcing motion that stays in safe zones
  const arcDirection = isFromLeft ? 1 : -1; // Arc right from left side, left from right side
  const arcIntensity = 30 + Math.random() * 30; // Reduced: 30-60 pixel arc (was 80-120)
  
  // Random angle for rotation during flight
  const randomAngle = (Math.random() - 0.5) * 60; // More dramatic rotation

  return (
    <motion.div
      className="fixed pointer-events-none select-none"
      style={{ zIndex: 9999 }}
      initial={{
        x: emoji.x,
        y: emoji.y,
        scale: 0.3,
        opacity: 1,
        rotate: 0
      }}
      animate={{
        x: (() => {
          // Calculate target X position with boundary restrictions
          const targetX = emoji.x + (arcDirection * arcIntensity);
          const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
          
          // Define safe zones: keep emojis in outer 35% on each side
          const leftBoundary = screenWidth * 0.35;
          const rightBoundary = screenWidth * 0.65;
          
          // Clamp to safe zones to prevent blocking central UI
          if (isFromLeft) {
            return Math.min(targetX, leftBoundary); // Left side emojis stay left
          } else {
            return Math.max(targetX, rightBoundary); // Right side emojis stay right
          }
        })(),
        y: emoji.y - 150 - Math.random() * 100, // Increased vertical movement (was -120)
        scale: emoji.isOwn ? 1.3 : 1.0, // Own emojis more prominent
        opacity: 0,
        rotate: randomAngle,
        transition: {
          duration: 4, // Slightly longer for better streaming effect
          ease: [0.25, 0.46, 0.45, 0.94],
          opacity: {
            duration: 3,
            delay: 0.8
          },
          x: {
            type: "spring",
            stiffness: 60,
            damping: 20
          }
        }
      }}
      exit={{
        opacity: 0,
        scale: 0,
        transition: {
          duration: 0.2
        }
      }}
    >
      <div 
        className={`text-4xl filter ${emoji.isOwn ? 'drop-shadow-lg' : 'drop-shadow-md'}`}
        style={{
          textShadow: emoji.isOwn 
            ? '0 0 8px rgba(255, 255, 255, 0.8), 0 0 16px rgba(255, 255, 255, 0.4)'
            : '0 0 4px rgba(255, 255, 255, 0.6)'
        }}
      >
        {emoji.emoji}
      </div>
      
      {/* Subtle particle effect for own emojis */}
      {emoji.isOwn && (
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0.8, 0.3, 0],
            transition: {
              duration: 1,
              times: [0, 0.4, 1]
            }
          }}
        >
          <div className="w-12 h-12 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-md" />
        </motion.div>
      )}
    </motion.div>
  );
}