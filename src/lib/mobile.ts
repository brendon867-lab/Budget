/**
 * Mobile-specific utility functions for responsive design and touch interactions
 */

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const getViewportSize = () => {
  if (typeof window === 'undefined') return { width: 0, height: 0 };
  
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

export const isPortrait = (): boolean => {
  const { width, height } = getViewportSize();
  return height > width;
};

export const getBreakpoint = (): 'mobile' | 'tablet' | 'desktop' => {
  const { width } = getViewportSize();
  
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') return { top: 0, bottom: 0, left: 0, right: 0 };
  
  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0', 10),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0', 10),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0', 10),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0', 10),
  };
};

// Haptic feedback for mobile devices
export const vibrate = (pattern: number | number[] = 100) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

// Smooth scroll for mobile
export const scrollToElement = (element: HTMLElement, behavior: ScrollBehavior = 'smooth') => {
  element.scrollIntoView({ behavior, block: 'start' });
};

// Touch-friendly number formatting for mobile displays
export const formatNumberForMobile = (num: number, compact = false): string => {
  if (compact && Math.abs(num) >= 1000) {
    const units = ['', 'K', 'M', 'B'];
    const unitIndex = Math.floor(Math.log10(Math.abs(num)) / 3);
    const scaledNumber = num / Math.pow(1000, unitIndex);
    
    return `${scaledNumber.toFixed(1)}${units[unitIndex]}`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

// Optimize touch target size
export const getTouchTargetSize = (baseSize: number): number => {
  const minTouchTarget = 44; // iOS and Android recommended minimum
  return Math.max(baseSize, minTouchTarget);
};

// Handle pull-to-refresh gesture
export const handlePullToRefresh = (callback: () => void) => {
  let startY = 0;
  let pullDistance = 0;
  const threshold = 100;

  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (startY > 0) {
      pullDistance = e.touches[0].clientY - startY;
      if (pullDistance > threshold) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > threshold) {
      callback();
      vibrate(50);
    }
    startY = 0;
    pullDistance = 0;
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
};