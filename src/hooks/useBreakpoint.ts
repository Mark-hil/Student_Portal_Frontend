/**
 * useBreakpoint.ts
 * Reactive hook for viewport dimensions, device types, and responsive breakpoints.
 */
import { useState, useEffect } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface BreakpointState {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isSmallMobile: boolean; // < 480px
  isMobile: boolean;      // < 768px
  isTablet: boolean;      // 768px - 1024px
  isDesktop: boolean;     // >= 1024px
  isLargeDesktop: boolean;// >= 1280px
}

export function useBreakpoint(): BreakpointState {
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));

  useEffect(() => {
    let timeoutId: number | null = null;

    const handleResize = () => {
      if (timeoutId !== null) {
        cancelAnimationFrame(timeoutId);
      }
      timeoutId = requestAnimationFrame(() => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    handleResize(); // Initial measurement

    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId !== null) {
        cancelAnimationFrame(timeoutId);
      }
    };
  }, []);

  const { width, height } = dimensions;

  let breakpoint: Breakpoint = 'xl';
  if (width < 480) breakpoint = 'xs';
  else if (width < 768) breakpoint = 'sm';
  else if (width < 1024) breakpoint = 'md';
  else if (width < 1280) breakpoint = 'lg';
  else breakpoint = 'xl';

  return {
    width,
    height,
    breakpoint,
    isSmallMobile: width < 480,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    isLargeDesktop: width >= 1280,
  };
}
