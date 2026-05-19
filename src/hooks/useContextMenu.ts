'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  nodeId: string | null;
}

const initialState: ContextMenuState = {
  isOpen: false,
  x: 0,
  y: 0,
  nodeId: null,
};

const LONG_PRESS_DURATION = 500; // ms for long-press on touch devices

export function useContextMenu() {
  const [state, setState] = useState<ContextMenuState>(initialState);
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ x: 0, y: 0 });
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressPosRef = useRef({ x: 0, y: 0 });

  const open = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setState({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      nodeId,
    });
  }, []);

  const openAtPosition = useCallback((x: number, y: number, nodeId: string) => {
    setState({
      isOpen: true,
      x,
      y,
      nodeId,
    });
  }, []);

  const close = useCallback(() => {
    setState(initialState);
  }, []);

  // Long-press handlers for touch devices
  const handleTouchStart = useCallback(
    (e: React.TouchEvent, nodeId: string) => {
      const touch = e.touches[0];
      longPressPosRef.current = { x: touch.clientX, y: touch.clientY };

      longPressTimerRef.current = setTimeout(() => {
        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        openAtPosition(
          longPressPosRef.current.x,
          longPressPosRef.current.y,
          nodeId
        );
      }, LONG_PRESS_DURATION);
    },
    [openAtPosition]
  );

  const handleTouchMove = useCallback(() => {
    // Cancel long press if finger moves
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    // Cancel long press if finger lifts too early
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Smart repositioning near screen edges
  useEffect(() => {
    if (!state.isOpen || !menuRef.current) {
      return;
    }

    const menu = menuRef.current;
    const menuRect = menu.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const padding = 8;

    let x = state.x;
    let y = state.y;

    // Adjust horizontal position
    if (x + menuRect.width + padding > viewportW) {
      x = viewportW - menuRect.width - padding;
    }
    if (x < padding) {
      x = padding;
    }

    // Adjust vertical position — if menu goes below viewport, show it above cursor
    if (y + menuRect.height + padding > viewportH) {
      y = y - menuRect.height;
      // Still check if it goes above viewport
      if (y < padding) {
        y = padding;
      }
    }
    if (y < padding) {
      y = padding;
    }

    setAdjustedPos({ x, y });
  }, [state.isOpen, state.x, state.y]);

  // Close on click outside
  useEffect(() => {
    if (!state.isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    };

    const handleScroll = () => {
      close();
    };

    // Delay adding listener to prevent the opening click from closing it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [state.isOpen, close]);

  // Close on Escape
  useEffect(() => {
    if (!state.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [state.isOpen, close]);

  // Cleanup long-press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return {
    isOpen: state.isOpen,
    x: adjustedPos.x || state.x,
    y: adjustedPos.y || state.y,
    nodeId: state.nodeId,
    menuRef,
    open,
    openAtPosition,
    close,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
