import React, { useEffect } from 'react';

// Mobile optimization utilities and styles
export function MobileOptimizations() {
  useEffect(() => {
    // Prevent zoom on double tap for better UX
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    // Add touch-action CSS to prevent unwanted gestures
    document.documentElement.style.touchAction = 'pan-x pan-y';
    
    // Prevent double-tap zoom
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Optimize for mobile viewport
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
      document.head.appendChild(meta);
    }

    // Add mobile-specific CSS variables
    const root = document.documentElement;
    root.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    
    const updateVh = () => {
      root.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };

    window.addEventListener('resize', updateVh);
    window.addEventListener('orientationchange', updateVh);

    // Cleanup
    return () => {
      document.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', updateVh);
      window.removeEventListener('orientationchange', updateVh);
    };
  }, []);

  return null; // This component only sets up mobile optimizations
}

// Custom CSS classes for mobile optimization
export const mobileStyles = `
  .mobile-optimized {
    /* Improve touch scrolling */
    -webkit-overflow-scrolling: touch;
    
    /* Prevent text selection on UI elements */
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    
    /* Improve button tapping */
    -webkit-tap-highlight-color: transparent;
  }

  /* Utility: line clamp to 2 lines (Tailwind-like) */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }

  /* Ensure minimum touch targets */
  .touch-target {
    min-height: 44px;
    min-width: 44px;
  }

  /* Better scrollbar styling for mobile */
  .scrollbar-hide {
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  /* Prevent zoom on input focus */
  @media screen and (max-width: 768px) {
    input[type="number"] {
      font-size: 16px;
    }
    
    /* Use vh units that work with mobile browsers */
    .full-height {
      height: calc(var(--vh, 1vh) * 100);
    }
  }

  /* Smooth animations optimized for mobile */
  @media (prefers-reduced-motion: no-preference) {
    .mobile-animation {
      animation-duration: 0.3s;
      animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
  }

  /* Reduce animations on slower devices */
  @media (prefers-reduced-motion: reduce) {
    .mobile-animation {
      animation-duration: 0.01ms;
    }
  }

  /* Better focus states for accessibility */
  .focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  /* Safe area support for devices with notches */
  .safe-area-top {
    padding-top: env(safe-area-inset-top);
  }

  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }

  .safe-area-left {
    padding-left: env(safe-area-inset-left);
  }

  .safe-area-right {
    padding-right: env(safe-area-inset-right);
  }
`;

// Performance optimization hook for mobile
export function useMobilePerformance() {
  useEffect(() => {
    // Reduce motion for performance on slower devices
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
    
    if (isLowEnd || mediaQuery.matches) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    }

    // Optimize for touch devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      document.documentElement.setAttribute('data-touch-device', 'true');
    }

    // Battery optimization for PWA
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBatteryInfo = () => {
          if (battery.level < 0.2 || battery.charging === false) {
            // Reduce animations and effects when battery is low
            document.documentElement.setAttribute('data-battery-saver', 'true');
          } else {
            document.documentElement.removeAttribute('data-battery-saver');
          }
        };

        battery.addEventListener('levelchange', updateBatteryInfo);
        battery.addEventListener('chargingchange', updateBatteryInfo);
        updateBatteryInfo();
      });
    }
  }, []);
}
