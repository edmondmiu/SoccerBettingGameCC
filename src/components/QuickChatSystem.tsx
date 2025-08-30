import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle } from 'lucide-react';

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
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);

  const generateRandomPosition = useCallback(() => {
    const padding = 80;
    const maxWidth = typeof window !== 'undefined' ? window.innerWidth - padding * 2 : 300;
    const maxHeight = typeof window !== 'undefined' ? window.innerHeight - padding * 2 : 600;
    
    return {
      x: padding + Math.random() * maxWidth,
      y: padding + Math.random() * maxHeight * 0.5
    };
  }, []);

  const sendMessage = useCallback((message: string, isOwn: boolean = true, playerName?: string) => {
    const position = generateRandomPosition();
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
  }, [generateRandomPosition]);

  const handleFloatingMessageComplete = useCallback((id: string) => {
    setFloatingMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const handleChatButtonClick = useCallback(() => {
    setIsMenuOpen(!isMenuOpen);
  }, [isMenuOpen]);

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

  // Debug logging
  console.log('QuickChatSystem render:', { isVisible, isMenuOpen, floatingMessages: floatingMessages.length });
  
  // Inject unmissable CSS for debugging
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.id = 'nuclear-chat-debug';
      style.innerHTML = `
        @keyframes nuclear-pulse {
          0% { 
            transform: scale(1) !important;
            box-shadow: 0 0 20px rgba(255, 0, 0, 0.8) !important;
          }
          50% { 
            transform: scale(1.2) !important;
            box-shadow: 0 0 40px rgba(255, 0, 0, 1) !important;
          }
          100% { 
            transform: scale(1) !important;
            box-shadow: 0 0 20px rgba(255, 0, 0, 0.8) !important;
          }
        }
        .nuclear-chat-button {
          animation: nuclear-pulse 1s infinite !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        const existingStyle = document.getElementById('nuclear-chat-debug');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, []);
  
  if (!isVisible) {
    console.log('QuickChatSystem: Not visible, returning null');
    return null;
  }

  // Get button position for menu positioning
  const getMenuPosition = () => {
    if (!buttonRef) return { x: 0, y: 0 };
    
    const rect = buttonRef.getBoundingClientRect();
    return {
      x: rect.right - 240, // Position menu to the left of button
      y: rect.bottom + 8   // Position below button with small gap
    };
  };

  const menuPosition = getMenuPosition();

  // Create portal content
  const portalContent = (
    <>
      {/* Floating messages container */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 99997 }}>
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

      {/* NUCLEAR CHAT BUTTON - Rendered directly to body via portal */}
      <button
        ref={setButtonRef}
        onClick={handleChatButtonClick}
        className="nuclear-chat-button"
        style={{
          position: 'fixed !important',
          top: '80px !important',
          right: '16px !important',
          width: '120px !important',
          height: '120px !important',
          backgroundColor: '#ff0000 !important',
          border: '10px solid #ffff00 !important',
          borderRadius: '50% !important',
          zIndex: '999999 !important',
          display: 'flex !important',
          flexDirection: 'column !important',
          alignItems: 'center !important',
          justifyContent: 'center !important',
          cursor: 'pointer !important',
          boxShadow: '0 0 20px rgba(255, 0, 0, 0.8) !important',
          opacity: '1 !important',
          visibility: 'visible !important',
          transform: 'none !important',
          margin: '0 !important',
          padding: '8px !important',
          minWidth: '120px !important',
          minHeight: '120px !important',
          maxWidth: '120px !important',
          maxHeight: '120px !important',
          pointerEvents: 'auto !important',
          overflow: 'visible !important',
          contain: 'none !important',
          isolation: 'auto !important',
          fontFamily: 'system-ui !important',
          fontSize: '10px !important',
          fontWeight: 'bold !important',
          textAlign: 'center !important',
          color: '#ffffff !important',
        }}
      >
        <MessageCircle 
          style={{ 
            width: '40px', 
            height: '40px', 
            color: '#ffffff',
            display: 'block',
            opacity: '1 !important',
            visibility: 'visible !important',
            marginBottom: '4px',
          }} 
        />
        <div style={{ 
          color: '#ffffff !important', 
          fontSize: '10px !important', 
          fontWeight: 'bold !important',
          textShadow: '1px 1px 1px rgba(0,0,0,0.8) !important',
        }}>
          CHAT
        </div>
      </button>

      {/* Spring-out message menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed"
            style={{
              zIndex: 99999,
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y}px`
            }}
            initial={{ 
              scale: 0, 
              opacity: 0, 
              transformOrigin: 'top right'
            }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
                duration: 0.3
              }
            }}
            exit={{ 
              scale: 0, 
              opacity: 0,
              transition: {
                duration: 0.15
              }
            }}
          >
            <div className="bg-black/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-3 w-60">
              {/* Quick phrase buttons */}
              <div className="grid grid-cols-2 gap-2">
                {QUICK_PHRASES.map((phrase, index) => (
                  <motion.button
                    key={phrase}
                    onClick={() => handleMessageSelect(phrase)}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs transition-colors text-left touch-manipulation"
                    style={{ minHeight: '36px' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      transition: { 
                        delay: index * 0.03,
                        duration: 0.2
                      }
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {phrase}
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Menu pointer/arrow */}
            <div className="absolute -top-2 right-6 w-4 h-4 bg-black/80 border border-white/20 transform rotate-45 border-b-0 border-r-0"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay to close menu when clicking outside */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed inset-0"
            style={{ zIndex: 99998 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );

  // Return portal content rendered directly to document.body
  return typeof document !== 'undefined' ? createPortal(portalContent, document.body) : null;
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
      style={{ zIndex: 99997 }}
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