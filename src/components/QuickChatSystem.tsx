import React, { useState, useCallback, useEffect } from 'react';
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

      {/* Floating chat button - top right to avoid bottom overlays */}
      <div
        // Fixed with safe-area padding and high z-index
        style={{
          position: 'fixed',
          right: 'calc(env(safe-area-inset-right, 0px) + 20px)',
          top: 'calc(env(safe-area-inset-top, 0px) + 76px)',
          zIndex: 2147483000,
        }}
      >
        <button
          data-testid="quick-chat-button"
          onClick={handleChatButtonClick}
          className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg border border-white/10 flex items-center justify-center"
          aria-label="Quick chat"
        >
          {isMenuOpen ? <X size={18} /> : <MessageCircle size={18} />}
        </button>

        {/* Spring-out quick phrases menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="absolute top-14 right-0 bg-black/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-3"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              style={{
                width: 'min(240px, calc(100vw - 40px))',
                maxWidth: 'calc(100vw - 40px)',
                zIndex: 12010,
              }}
            >
              <div className="grid grid-cols-2 gap-2">
                {QUICK_PHRASES.map((phrase, index) => (
                  <motion.button
                    key={phrase}
                    onClick={() => handleMessageSelect(phrase)}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs transition-colors text-left touch-manipulation min-h-9"
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
      </div>
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
