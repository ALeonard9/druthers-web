'use client';

import { useRef, ReactNode, PointerEvent, useEffect } from 'react';

interface SwipeableRowProps {
  children: ReactNode;
  rightActions?: ReactNode; // Rendered on the right, revealed by swiping left (negative X)
  rightActionWidth?: number; // How far to snap when swiping left
  onFullSwipeRight?: () => void; // Called when swiped heavily to the left
  fullSwipeThreshold?: number; // Distance required for a full swipe (default: 150)
  className?: string; // Outer container styles
}

export function SwipeableRow({
  children,
  rightActions,
  rightActionWidth = 80,
  onFullSwipeRight,
  fullSwipeThreshold = 150,
  className = '',
}: SwipeableRowProps) {
  const fgRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const currentX = useRef<number>(0); // Current pixel translation (0 = closed, -N = swiped left)
  const isSwiping = useRef(false);
  const isHorizontal = useRef<boolean | null>(null); // True if swipe, False if scroll

  // Reset function to spring back to closed
  function reset() {
    if (!fgRef.current) return;
    fgRef.current.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
    fgRef.current.style.transform = `translateX(0px)`;
    currentX.current = 0;
  }

  // Snap to open state
  function snapOpen() {
    if (!fgRef.current) return;
    fgRef.current.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
    fgRef.current.style.transform = `translateX(-${rightActionWidth}px)`;
    currentX.current = -rightActionWidth;
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    // Only intercept primary touch/mouse (left click)
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    // Stop any ongoing animations
    if (fgRef.current) {
      fgRef.current.style.transition = 'none';
    }

    startX.current = e.clientX;
    startY.current = e.clientY;
    isSwiping.current = true;
    isHorizontal.current = null;

    // We don't setPointerCapture because it can break native scroll / dnd-kit unless handled perfectly.
    // Instead we rely on touch-action: pan-y to let the browser handle vertical, and we handle horizontal.
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!isSwiping.current || startX.current === null || startY.current === null) return;

    const deltaX = e.clientX - startX.current;
    const deltaY = e.clientY - startY.current;

    // Determine direction on first substantial move
    if (isHorizontal.current === null) {
      if (Math.abs(deltaX) > 5 && Math.abs(deltaX) > Math.abs(deltaY)) {
        isHorizontal.current = true;
      } else if (Math.abs(deltaY) > 5) {
        isHorizontal.current = false;
        isSwiping.current = false; // Give up, it's a vertical scroll
        return;
      } else {
        return; // Wait for more movement
      }
    }

    if (!isHorizontal.current) return;

    // Prevent scrolling if we're swiping horizontally
    // NOTE: React pointer events can be passive in some environments.
    // touch-action: pan-y in CSS is the main defense against scroll locking.
    if (e.cancelable) {
      e.preventDefault();
    }

    // Calculate new position
    // If they already snapped open, currentX starts at -rightActionWidth
    const newX = currentX.current + deltaX;

    // Apply resistance if trying to swipe right (since we only have rightActions)
    let finalX = newX;
    if (newX > 0) {
      finalX = newX * 0.2; // heavy resistance
    }

    // Apply translation directly to DOM for 60fps
    if (fgRef.current) {
      fgRef.current.style.transform = `translateX(${finalX}px)`;
    }
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    if (!isSwiping.current || startX.current === null) {
      isSwiping.current = false;
      return;
    }

    const deltaX = e.clientX - startX.current;

    // If we determined it was a horizontal swipe, prevent click from firing
    if (isHorizontal.current && Math.abs(deltaX) > 5 && fgRef.current) {
       // A trick to prevent clicks on child elements after a swipe
       const preventClick = (evt: MouseEvent) => {
         evt.preventDefault();
         evt.stopPropagation();
         fgRef.current?.removeEventListener('click', preventClick, true);
       };
       fgRef.current.addEventListener('click', preventClick, true);
       setTimeout(() => fgRef.current?.removeEventListener('click', preventClick, true), 100);
    }

    const currentOffset = currentX.current + deltaX;

    // Logic for snapping or full swipe
    if (onFullSwipeRight && currentOffset < -fullSwipeThreshold) {
      // Full swipe executed!
      if (fgRef.current) {
        fgRef.current.style.transition = 'transform 0.2s ease-out';
        fgRef.current.style.transform = `translateX(-200%)`; // Fly off screen
      }
      onFullSwipeRight();
      // Don't reset state here, presumably the item will be unmounted.
      // If not unmounted, the parent needs to handle it.
    } else if (currentOffset < -(rightActionWidth * 0.5)) {
      // Snaps open if dragged past halfway point
      snapOpen();
    } else {
      // Snap closed
      reset();
    }

    isSwiping.current = false;
    startX.current = null;
    startY.current = null;
    isHorizontal.current = null;
  }

  // Click outside to close (if snapped open)
  useEffect(() => {
    function handleGlobalClick(e: MouseEvent) {
      if (currentX.current === -rightActionWidth && fgRef.current && !fgRef.current.contains(e.target as Node)) {
        reset();
      }
    }
    document.addEventListener('pointerdown', handleGlobalClick);
    return () => document.removeEventListener('pointerdown', handleGlobalClick);
  }, [rightActionWidth]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Layer */}
      {rightActions && (
        <div className="absolute inset-y-0 right-0 flex items-stretch justify-end">
          {rightActions}
        </div>
      )}

      {/* Foreground Layer */}
      <div
        ref={fgRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative z-10 h-full w-full touch-pan-y bg-inherit will-change-transform"
      >
        {children}
      </div>
    </div>
  );
}
