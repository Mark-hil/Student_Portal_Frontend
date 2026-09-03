/**
 * Responsive.tsx
 * Comprehensive suite of responsive layout components, wrappers, and containers.
 */
import React, { ReactNode, useRef, useState, useEffect } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';

interface ResponsiveContainerProps {
  children: ReactNode;
  maxWidth?: number | string;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Responsive container that automatically adjusts max-width and fluid padding based on screen size.
 */
export function ResponsiveContainer({
  children,
  maxWidth = 1280,
  style,
  className,
}: ResponsiveContainerProps) {
  const { isMobile, isTablet } = useBreakpoint();

  const padding = isMobile ? '16px 14px' : isTablet ? '22px 20px' : '28px 32px';

  return (
    <div
      className={className}
      style={{
        width: '100%',
        maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
        margin: '0 auto',
        padding,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: ReactNode;
  minItemWidth?: number;
  gap?: number;
  mobileColumns?: number;
  tabletColumns?: number;
  desktopColumns?: number;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Intelligent responsive grid that automatically scales columns from mobile to desktop.
 */
export function ResponsiveGrid({
  children,
  minItemWidth = 260,
  gap = 16,
  mobileColumns = 1,
  tabletColumns,
  desktopColumns,
  style,
  className,
}: ResponsiveGridProps) {
  const { isMobile, isTablet } = useBreakpoint();

  let gridTemplateColumns = `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`;

  if (isMobile && mobileColumns) {
    gridTemplateColumns = `repeat(${mobileColumns}, 1fr)`;
  } else if (isTablet && tabletColumns) {
    gridTemplateColumns = `repeat(${tabletColumns}, 1fr)`;
  } else if (!isMobile && !isTablet && desktopColumns) {
    gridTemplateColumns = `repeat(${desktopColumns}, 1fr)`;
  }

  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns,
        gap,
        width: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface ScrollableTableProps {
  children: ReactNode;
  minWidth?: number | string;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Wrapper for tables that enables smooth horizontal scrolling on mobile/tablets
 * with subtle shadow indicators.
 */
export function ScrollableTable({
  children,
  minWidth = 650,
  style,
  className,
}: ScrollableTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  const checkScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        borderRadius: 14,
      }}
    >
      {/* Scroll indicator shadows */}
      {canScrollLeft && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 18,
            background: 'linear-gradient(90deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 100%)',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
      )}
      {canScrollRight && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 18,
            background: 'linear-gradient(270deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 100%)',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
      )}

      <div
        ref={containerRef}
        onScroll={checkScroll}
        className={className}
        style={{
          width: '100%',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarGutter: 'stable',
          ...style,
        }}
      >
        <div style={{ minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth }}>
          {children}
        </div>
      </div>
    </div>
  );
}

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number | string;
}

/**
 * Slide-over navigation drawer for mobile and tablet devices.
 */
export function MobileDrawer({
  isOpen,
  onClose,
  children,
  width = 280,
}: MobileDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        display: 'flex',
      }}
    >
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Drawer content panel */}
      <div
        style={{
          position: 'relative',
          width: typeof width === 'number' ? `${width}px` : width,
          maxWidth: '85vw',
          height: '100%',
          background: '#090d16',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1,
          animation: 'drawerSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Conditional render wrappers based on breakpoint.
 */
export function MobileOnly({ children }: { children: ReactNode }) {
  const { isMobile } = useBreakpoint();
  return isMobile ? <>{children}</> : null;
}

export function TabletAndBelow({ children }: { children: ReactNode }) {
  const { isDesktop } = useBreakpoint();
  return !isDesktop ? <>{children}</> : null;
}

export function DesktopOnly({ children }: { children: ReactNode }) {
  const { isDesktop } = useBreakpoint();
  return isDesktop ? <>{children}</> : null;
}
