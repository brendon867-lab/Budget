import { useState, useEffect } from 'react';
import { getBreakpoint, getViewportSize, isMobileDevice, isTouchDevice } from '@/lib/mobile';

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  viewportWidth: number;
  viewportHeight: number;
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => ({
    isMobile: false,
    isTablet: false, 
    isDesktop: true,
    isTouchDevice: false,
    viewportWidth: 1024,
    viewportHeight: 768,
    breakpoint: 'desktop' as const,
  }));

  useEffect(() => {
    const updateResponsiveState = () => {
      const { width, height } = getViewportSize();
      const breakpoint = getBreakpoint();
      
      setState({
        isMobile: breakpoint === 'mobile',
        isTablet: breakpoint === 'tablet',
        isDesktop: breakpoint === 'desktop',
        isTouchDevice: isTouchDevice(),
        viewportWidth: width,
        viewportHeight: height,
        breakpoint,
      });
    };

    // Initial state
    updateResponsiveState();

    // Listen for viewport changes
    window.addEventListener('resize', updateResponsiveState);
    window.addEventListener('orientationchange', updateResponsiveState);

    return () => {
      window.removeEventListener('resize', updateResponsiveState);
      window.removeEventListener('orientationchange', updateResponsiveState);
    };
  }, []);

  return state;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handleChange = () => setMatches(mediaQuery.matches);

    // Set initial value
    handleChange();

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}