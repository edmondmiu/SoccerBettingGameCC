import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X } from 'lucide-react';

interface ChatMessage {
  id: string;
  message: string;
  playerName: string;
  timestamp: number;
  isOwn: boolean;
}

interface FloatingMessage {
  id: string;
  message: string;
  x: number;
  y: number;
  playerName?: string;
  isOwn: boolean;
}

interface QuickChatSystemProps {
  isVisible: boolean;
  onChatToggle?: () => void;
  otherPlayerMessages?: ChatMessage[];
}

const QUICK_PHRASES = [
  "Good luck! 🍀",
  "Nice bet! 👍", 
  "Unlucky! 😅",
  "Great match! ⚽",
  "Let's go! 🔥",
  "Come on! 💪",
  "Wow! 😲",
  "No way! 🤯",
  "Yes! 🎉",
  "Ouch! 😬"
];

export function QuickChatSystem({
  isVisible,
  onChatToggle,
  otherPlayerMessages = []
}: QuickChatSystemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [floatingMessages, setFloatingMessages] = useState<FloatingMessage[]>([]);
  const [anchorRect, setAnchorRect] = useState<{
    left: number; top: number; right: number; bottom: number; width: number; height: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const generateSpawnPosition = useCallback(() => {
    // Prefer spawning from the soccer pitch if present
    if (typeof document !== 'undefined') {
      const pitch = document.querySelector('[data-testid="soccer-pitch"]') as HTMLElement | null;
      if (pitch) {
        const rect = pitch.getBoundingClientRect();
        // Random x within the pitch with a small inset so bubbles start inside the grass
        const inset = 12;
        const x = rect.left + inset + Math.random() * Math.max(1, rect.width - inset * 2);
        // Start near the lower third of the pitch and float upward
        const y = rect.top + rect.height * (0.66 + Math.random() * 0.25);
        return { x, y };
      }
    }

    // Fallback: viewport-based spawn
    const padding = 80;
    const maxWidth = typeof window !== 'undefined' ? window.innerWidth - padding * 2 : 300;
    const maxHeight = typeof window !== 'undefined' ? window.innerHeight - padding * 2 : 600;
    return {
      x: padding + Math.random() * maxWidth,
      y: padding + Math.random() * maxHeight * 0.5,
    };
  }, []);

  const sendMessage = useCallback((message: string, isOwn: boolean = true, playerName?: string) => {
    const position = generateSpawnPosition();
    const messageId = `${Date.now()}-${Math.random()}`;

    const floatingMessage: FloatingMessage = {
      id: messageId,
      message,
      x: position.x,
      y: position.y,
      playerName: isOwn ? undefined : playerName,
      isOwn
    };

    setFloatingMessages(prev => [...prev, floatingMessage]);

    // Haptic feedback for mobile devices
    if ('vibrate' in navigator && isOwn) {
      navigator.vibrate(30);
    }

    // Auto-close menu after sending message
    if (isOwn) {
      setIsMenuOpen(false);
    }
  }, [generateSpawnPosition]);

  const handleFloatingMessageComplete = useCallback((id: string) => {
    setFloatingMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const handleChatButtonClick = useCallback(() => {
    setIsMenuOpen((open) => !open);
    if (onChatToggle) onChatToggle();
  }, [onChatToggle]);

  const handleMessageSelect = useCallback((message: string) => {
    sendMessage(message, true);
    // Menu closes automatically in sendMessage
  }, [sendMessage]);

  // Handle incoming messages from other players
  useEffect(() => {
    if (otherPlayerMessages.length > 0) {
      const latestMessage = otherPlayerMessages[0];
      // Simple check to avoid duplicates (could be improved with proper tracking)
      const isRecentDuplicate = floatingMessages.some(msg => 
        msg.message === latestMessage.message && 
        Date.now() - latestMessage.timestamp < 1000
      );
      
      if (!isRecentDuplicate) {
        sendMessage(latestMessage.message, false, latestMessage.playerName);
      }
    }
  }, [otherPlayerMessages, sendMessage, floatingMessages]);

  // Allow external toggle via a global custom event (for in-card chat button)
  useEffect(() => {
    const handler = (ev: Event) => {
      const custom = ev as CustomEvent;
      const rect = (custom && (custom as any).detail && (custom as any).detail.anchorRect) || null;
      if (rect) {
        setAnchorRect(rect);
      }
      setIsMenuOpen((open) => !open);
      if (onChatToggle) onChatToggle();
    };
    // Type cast to any to avoid TS event map warnings for custom name
    window.addEventListener('quickchat:toggle' as any, handler as any);
    return () => window.removeEventListener('quickchat:toggle' as any, handler as any);
  }, [onChatToggle]);

  // Clamp menu within the viewport so it is fully visible
  useEffect(() => {
    if (!isMenuOpen) return;

    const computePosition = () => {
      const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 844;
      const padding = 12; // minimal viewport inset
      const width = Math.min(240, vw - 40); // matches style width below
      const height = menuRef.current?.offsetHeight || 200;

      if (anchorRect) {
        // Default to left of the anchor
        let left = anchorRect.left - 4 - width;
        // Clamp horizontally
        left = Math.max(padding, Math.min(left, vw - padding - width));

        // Center vertically on the anchor then clamp
        let top = anchorRect.top + anchorRect.height / 2 - height / 2;
        top = Math.max(padding, Math.min(top, vh - padding - height));

        setMenuStyle({ left, top, right: 'auto', bottom: 'auto', transform: 'none' });
      } else {
        setMenuStyle({
          right: 'calc(env(safe-area-inset-right, 0px) + 20px)',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
          left: 'auto',
          top: 'auto',
          transform: 'none',
        });
      }
    };

    // Compute immediately and again on next frame to catch measured height
    computePosition();
    const raf = requestAnimationFrame(computePosition);

    const onResize = () => computePosition();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [isMenuOpen, anchorRect]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDown = (e: Event) => {
      const target = e.target as HTMLElement | null;
      // Ignore clicks on the trigger button
      if (target && target.closest && target.closest('[data-quickchat-trigger]')) {
        return;
      }
      if (menuRef.current && target && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  if (!isVisible) {
    return null;
  }
  return (
    <>
      {/* Floating messages (viewport level) */}
      <div
        className="fixed inset-0 pointer-events-none"
        // Ensure bubbles render above cards/drawers
        style={{ zIndex: 12000 }}
      >
        <AnimatePresence>
          {floatingMessages.map((msg) => (
            <FloatingChatBubble
              key={msg.id}
              message={msg}
              onComplete={() => handleFloatingMessageComplete(msg.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Quick chat menu anchored to last trigger (falls back to bottom-right) */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            ref={menuRef}
            className="fixed bg-black/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-3"
            initial={{ opacity: 0, y: 0, x: 10, scale: 0.96, transformOrigin: 'right center' } as any}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: 0, x: 10, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              ...menuStyle,
              width: 'min(240px, calc(100vw - 40px))',
              maxWidth: 'calc(100vw - 40px)',
              zIndex: 2147483000,
            }}
          >
            {/* Pointer connecting to chat icon */}
            {anchorRect && (
              <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 bg-black/80 border-r border-b border-white/20" />
            )}
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PHRASES.map((phrase, index) => (
                <motion.button
                  key={phrase}
                  onClick={() => handleMessageSelect(phrase)}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors text-left touch-manipulation min-h-9"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: index * 0.03, duration: 0.15 } }}
                  whileTap={{ scale: 0.97 }}
                >
                  {phrase}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Floating chat bubble component (unchanged)
interface FloatingChatBubbleProps {
  message: FloatingMessage;
  onComplete: () => void;
}

function FloatingChatBubble({ message, onComplete }: FloatingChatBubbleProps) {
  useEffect(() => {
    const timeout = setTimeout(onComplete, 4000);
    return () => clearTimeout(timeout);
  }, [onComplete]);

  const randomAngle = (Math.random() - 0.5) * 20;
  const randomDrift = (Math.random() - 0.5) * 60;

  return (
    <motion.div
      className="fixed pointer-events-none select-none"
      initial={{
        x: message.x,
        y: message.y,
        scale: 0.8,
        opacity: 1,
        rotate: 0
      }}
      animate={{
        x: message.x + randomDrift,
        y: message.y - 100,
        scale: message.isOwn ? 1.1 : 0.95,
        opacity: 0,
        rotate: randomAngle,
        transition: {
          duration: 4,
          ease: [0.25, 0.46, 0.45, 0.94],
          opacity: {
            duration: 3,
            delay: 1
          }
        }
      }}
      style={{ zIndex: 12005 }}
    >
      <div className={`px-3 py-2 rounded-full max-w-48 ${
        message.isOwn 
          ? 'bg-blue-500/90 text-white shadow-lg' 
          : 'bg-white/90 text-gray-800 shadow-md'
      } backdrop-blur-sm border border-white/20`}>
        {message.playerName && !message.isOwn && (
          <div className="text-xs opacity-70 mb-0.5">{message.playerName}</div>
        )}
        <div className="text-sm font-medium">{message.message}</div>
      </div>
      
      {/* Speech bubble tail */}
      <div className={`absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 ${
        message.isOwn 
          ? 'border-l-transparent border-r-transparent border-t-blue-500/90' 
          : 'border-l-transparent border-r-transparent border-t-white/90'
      }`} />
    </motion.div>
  );
}
