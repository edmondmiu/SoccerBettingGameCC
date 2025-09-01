import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageCircle } from 'lucide-react';
import { GameState } from '../App';
import { FloatingEmoji, FloatingEmojiData } from './FloatingEmoji';
import { Card, CardContent } from './ui/card';

interface SoccerPitchWithSocialProps {
  gameState: GameState;
  matchTimer: number;
  onEmojiSent?: (emoji: string) => void;
  otherPlayersEmojis?: FloatingEmojiData[];
  onChatToggle?: () => void;
}

const EMOJI_OPTIONS = ['😠', '😄', '😂', '😢', '👏'];
const EMOJI_LABELS = {
  '😠': 'Anger',
  '😄': 'Happy',
  '😂': 'Laughter',
  '😢': 'Crying'
};

export const SoccerPitchWithSocial: React.FC<SoccerPitchWithSocialProps> = ({
  gameState,
  matchTimer,
  onEmojiSent,
  otherPlayersEmojis = [],
  onChatToggle
}) => {
  // Extract values from gameState
  const homeTeam = gameState.currentMatch?.homeTeam || '';
  const awayTeam = gameState.currentMatch?.awayTeam || '';
  const homeScore = gameState.currentMatch?.homeScore || 0;
  const awayScore = gameState.currentMatch?.awayScore || 0;
  const lastEvent = gameState.matchEvents[gameState.matchEvents.length - 1];

  // Pitch state
  const [ballPosition, setBallPosition] = useState({ x: 80, y: 50 });
  const [isAttacking, setIsAttacking] = useState<'home' | 'away' | 'midfield'>('midfield');
  const [showGoalCelebration, setShowGoalCelebration] = useState(false);
  const [possession, setPossession] = useState<'home' | 'away'>('home');
  const [possessionPercentages, setPossessionPercentages] = useState({ home: 50, away: 50 });
  const [attackIntensity, setAttackIntensity] = useState(0);
  const [ballTrail, setBallTrail] = useState<Array<{x: number, y: number, id: number}>>([]);

  // Social features state
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmojiData[]>([]);
  const [pressStates, setPressStates] = useState<Record<string, boolean>>({});
  const [isHolding, setIsHolding] = useState<Record<string, boolean>>({});
  const intervalRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const touchStartTime = useRef<Record<string, number>>({});
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const pitchRef = useRef<HTMLDivElement>(null);

  // Performance optimization: limit to 15 sprites
  const MAX_EMOJIS = 15;

  // Add other players' emojis to the floating emojis list
  useEffect(() => {
    if (otherPlayersEmojis.length > 0) {
      setFloatingEmojis(prev => {
        const newEmojis = [...prev, ...otherPlayersEmojis];
        // Keep only the latest MAX_EMOJIS
        return newEmojis.slice(-MAX_EMOJIS);
      });
    }
  }, [otherPlayersEmojis]);

  const getEmojiButtonPosition = useCallback((side: 'left' | 'right') => {
    if (!pitchRef.current) return { x: 0, y: 0 };
    
    const pitchRect = pitchRef.current.getBoundingClientRect();
    const buttonOffset = 60; // Distance from pitch edge
    
    return {
      x: side === 'left' 
        ? pitchRect.left - buttonOffset + window.scrollX
        : pitchRect.right + buttonOffset + window.scrollX,
      y: pitchRect.top + pitchRect.height / 2 + window.scrollY
    };
  }, []);

  const getChatButtonPosition = useCallback(() => {
    if (!pitchRef.current) return { x: 0, y: 0 };
    
    const pitchRect = pitchRef.current.getBoundingClientRect();
    
    return {
      x: pitchRect.right - 20 + window.scrollX,
      y: pitchRect.top + 20 + window.scrollY
    };
  }, []);

  const sendEmoji = useCallback((emoji: string, isOwn: boolean = true, originEl?: HTMLElement | null) => {
    // Prefer spawning from the exact button the user clicked
    let spawnPosition: { x: number; y: number } | null = null;
    const el = originEl || buttonRefs.current[emoji] || null;
    if (el) {
      const rect = el.getBoundingClientRect();
      spawnPosition = {
        x: rect.left + rect.width / 2 + window.scrollX,
        y: rect.top + rect.height / 2 + window.scrollY,
      };
    }

    if (!spawnPosition) {
      // Fallback: approximate side button position
      const buttonSide = Math.random() > 0.5 ? 'left' : 'right';
      const position = getEmojiButtonPosition(buttonSide);
      const randomOffset = 30;
      spawnPosition = {
        x: position.x + (Math.random() - 0.5) * randomOffset,
        y: position.y + (Math.random() - 0.5) * randomOffset,
      };
    }

    const newEmoji: FloatingEmojiData = {
      id: `${Date.now()}-${Math.random()}`,
      emoji,
      x: spawnPosition.x,
      y: spawnPosition.y,
      isOwn
    };

    setFloatingEmojis(prev => {
      const newEmojis = [...prev, newEmoji];
      // Performance: keep only MAX_EMOJIS sprites
      return newEmojis.slice(-MAX_EMOJIS);
    });
    
    if (isOwn && onEmojiSent) {
      onEmojiSent(emoji);
    }

    // Haptic feedback for mobile devices
    if ('vibrate' in navigator && isOwn) {
      navigator.vibrate(50);
    }
  }, [getEmojiButtonPosition, onEmojiSent]);

  const handleEmojiComplete = useCallback((id: string) => {
    setFloatingEmojis(prev => prev.filter(emoji => emoji.id !== id));
  }, []);

  const startHoldEffect = useCallback((emoji: string) => {
    if (intervalRefs.current[emoji]) return;
    
    setIsHolding(prev => ({ ...prev, [emoji]: true }));
    
    intervalRefs.current[emoji] = setInterval(() => {
      sendEmoji(emoji, true, buttonRefs.current[emoji]);
    }, 200);
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
  const handleTouchStart = useCallback((emoji: string) => (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setPressStates(prev => ({ ...prev, [emoji]: true }));
    touchStartTime.current[emoji] = Date.now();
    
    sendEmoji(emoji, true, e.currentTarget);
    
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

  // Mouse event handlers for desktop
  const handleMouseDown = useCallback((emoji: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setPressStates(prev => ({ ...prev, [emoji]: true }));
    sendEmoji(emoji, true, e.currentTarget);
    
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

  // Ball movement logic (simplified version from original SoccerPitch)
  useEffect(() => {
    const interval = setInterval(() => {
      setBallPosition(prevPos => {
        let newX = prevPos.x;
        let newY = prevPos.y;
        
        const timePhase = Math.floor(matchTimer / 15) % 6;
        const scoreDifference = Math.abs(homeScore - awayScore);
        
        switch (timePhase) {
          case 0:
            newX = 55 + Math.random() * 50;
            newY = 30 + Math.random() * 40;
            setIsAttacking('midfield');
            break;
          case 1:
            newX = Math.min(prevPos.x + (Math.random() * 20 - 8), 140);
            newY = prevPos.y + (Math.random() * 20 - 10);
            setIsAttacking('home');
            break;
          default:
            newX += (Math.random() - 0.5) * 8;
            newY += (Math.random() - 0.5) * 6;
        }
        
        newX = Math.max(12, Math.min(148, newX));
        newY = Math.max(15, Math.min(85, newY));
        
        setBallTrail(prev => {
          const newTrail = [...prev, { x: newX, y: newY, id: Date.now() }].slice(-5);
          return newTrail;
        });
        
        return { x: newX, y: newY };
      });
    }, 800 + Math.random() * 400);

    return () => clearInterval(interval);
  }, [matchTimer, homeScore, awayScore]);

  // React to match events
  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === 'goal') {
      const isHomeGoal = lastEvent.scoringTeam === 'home';
      setBallPosition({ 
        x: isHomeGoal ? 145 : 15, 
        y: 48 + Math.random() * 8 
      });
      setShowGoalCelebration(true);
      setTimeout(() => setShowGoalCelebration(false), 4000);
      
      setTimeout(() => {
        setBallPosition({ x: 80, y: 50 });
        setIsAttacking('midfield');
      }, 3000);
    }
  }, [lastEvent]);

  return (
    <div className="relative w-full">
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

      {/* Three-column Card: Emojis | Pitch | Emojis */}
      <Card
        className="border-green-400/30 shadow-xl"
        style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' }}
      >
        <CardContent className="p-0" style={{ paddingBottom: 0 }}>
          <div
            className="grid items-stretch gap-1 sm:gap-2"
            style={{ gridTemplateColumns: 'auto 1fr auto' }}
          >
            {/* Left rail: 3 emojis spaced vertically */}
            <div className="w-14 md:w-16 h-full flex flex-col items-center justify-between p-0">
              {EMOJI_OPTIONS.slice(0, 3).map((emoji) => (
                <button
                  key={emoji}
                  ref={(el) => { buttonRefs.current[emoji] = el; }}
                  className={
                    'relative w-10 h-10 sm:w-12 sm:h-12 md:w-12 md:h-12 flex items-center justify-center p-0 text-3xl sm:text-4xl bg-transparent select-none touch-manipulation'
                  }
                  style={{ minHeight: '44px', minWidth: '44px' }}
                  onTouchStart={handleTouchStart(emoji)}
                  onTouchEnd={handleTouchEnd(emoji)}
                  onMouseDown={handleMouseDown(emoji)}
                  onMouseUp={handleMouseUp(emoji)}
                  onMouseLeave={handleMouseLeave(emoji)}
                  aria-label={`Send ${EMOJI_LABELS[emoji as keyof typeof EMOJI_LABELS]} reaction`}
                >
                  <span className="pointer-events-none leading-none">{emoji}</span>
                </button>
              ))}
            </div>

            {/* Center: Soccer pitch (slightly smaller) */}
            <div 
              ref={pitchRef}
              data-testid="soccer-pitch"
              className="relative w-full h-48 sm:h-56 md:h-64 overflow-hidden"
            >
              {/* Field markings */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="grass" patternUnits="userSpaceOnUse" width="4" height="4">
                    <rect width="4" height="4" fill="none"/>
                    <path d="M0,2 L2,0 M2,4 L4,2" stroke="rgba(255,255,255,0.1)" strokeWidth="0.2"/>
                  </pattern>
                </defs>
                <rect x="5" y="10" width="150" height="80" fill="url(#grass)" opacity="0.3"/>
                <rect x="5" y="10" width="150" height="80" fill="none" stroke="white" strokeWidth="0.5" opacity="0.9"/>
                <line x1="80" y1="10" x2="80" y2="90" stroke="white" strokeWidth="0.5" opacity="0.9"/>
                <circle cx="80" cy="50" r="8" fill="none" stroke="white" strokeWidth="0.5" opacity="0.9"/>
                <circle cx="80" cy="50" r="1" fill="white" opacity="0.9"/>
                <rect x="5" y="30" width="20" height="40" fill="none" stroke="white" strokeWidth="0.5" opacity="0.9"/>
                <rect x="5" y="40" width="8" height="20" fill="none" stroke="white" strokeWidth="0.5" opacity="0.9"/>
                <rect x="135" y="30" width="20" height="40" fill="none" stroke="white" strokeWidth="0.5" opacity="0.9"/>
                <rect x="147" y="40" width="8" height="20" fill="none" stroke="white" strokeWidth="0.5" opacity="0.9"/>
                <rect x="3" y="45" width="2" height="10" fill="white" opacity="0.9"/>
                <rect x="155" y="45" width="2" height="10" fill="white" opacity="0.9"/>
              </svg>

              {/* Possession indicator */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <div className="flex items-center space-x-1 text-blue-400">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-xs font-medium">{Math.round(possessionPercentages.home)}%</span>
                </div>
                <span className="text-white/60 text-xs">|</span>
                <div className="flex items-center space-x-1 text-red-400">
                  <span className="text-xs font-medium">{Math.round(possessionPercentages.away)}%</span>
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                </div>
              </div>

              {/* Ball trail */}
              {ballTrail.map((pos) => (
                <motion.div
                  key={pos.id}
                  className="absolute w-2 h-2 bg-white/30 rounded-full"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
                  initial={{ opacity: 0.6, scale: 0.8 }}
                  animate={{ opacity: 0, scale: 0.3 }}
                  transition={{ duration: 1 }}
                />
              ))}

              {/* Animated ball */}
              <motion.div
                className="absolute w-3 h-3 bg-white rounded-full shadow-lg border border-gray-300"
                style={{ left: `${ballPosition.x}%`, top: `${ballPosition.y}%`, transform: 'translate(-50%, -50%)' }}
                animate={{ scale: [1, 1.1 + attackIntensity * 0.2, 1], rotate: matchTimer * 30 + attackIntensity * 180 }}
                transition={{
                  scale: { duration: 0.5, repeat: Infinity },
                  rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
                  x: { type: 'spring', stiffness: 100, damping: 20 },
                  y: { type: 'spring', stiffness: 100, damping: 20 },
                }}
              />

              {/* Goal celebration */}
              <AnimatePresence>
                {showGoalCelebration && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], rotate: [0, 360, 720], y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-6 py-3 rounded-full font-bold text-lg shadow-lg"
                    >
                      ⚽ GOAL! ⚽
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right rail: 2 emojis at top, chat at bottom */}
            <div className="w-14 md:w-16 h-full flex flex-col items-center justify-between p-0">
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                {EMOJI_OPTIONS.slice(3).map((emoji) => (
                  <button
                    key={emoji}
                    ref={(el) => { buttonRefs.current[emoji] = el; }}
                    className={
                      'relative w-10 h-10 sm:w-12 sm:h-12 md:w-12 md:h-12 flex items-center justify-center p-0 text-3xl sm:text-4xl bg-transparent select-none touch-manipulation'
                    }
                    style={{ minHeight: '44px', minWidth: '44px' }}
                    onTouchStart={handleTouchStart(emoji)}
                    onTouchEnd={handleTouchEnd(emoji)}
                    onMouseDown={handleMouseDown(emoji)}
                    onMouseUp={handleMouseUp(emoji)}
                    onMouseLeave={handleMouseLeave(emoji)}
                    aria-label={`Send ${EMOJI_LABELS[emoji as keyof typeof EMOJI_LABELS]} reaction`}
                  >
                    <span className="pointer-events-none leading-none">{emoji}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={(e) => {
                  const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                  const detail = {
                    anchorRect: {
                      left: rect.left,
                      top: rect.top,
                      right: rect.right,
                      bottom: rect.bottom,
                      width: rect.width,
                      height: rect.height,
                    },
                  } as any;
                  window.dispatchEvent(new CustomEvent('quickchat:toggle' as any, { detail } as any));
                }}
                data-quickchat-trigger
                className="w-12 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center"
                aria-label="Open quick chat"
                title="Open quick chat"
              >
                <MessageCircle size={22} />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};
