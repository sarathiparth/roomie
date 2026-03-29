import { useState, useCallback, useRef } from 'react';
import { PanInfo } from 'framer-motion';

type SwipeDirection = 'left' | 'right' | 'up';

export function useSwipeGesture(
  onSwipe: (direction: SwipeDirection) => void,
  threshold = 120
) {
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const swipeHandled = useRef(false);

  const handleDrag = (_: unknown, info: PanInfo) => {
    if (swipeHandled.current) return;
    setDragX(info.offset.x);
    setDragY(info.offset.y);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (swipeHandled.current) return;

    if (info.offset.x > threshold) {
      swipeHandled.current = true;
      onSwipe('right');
    } else if (info.offset.x < -threshold) {
      swipeHandled.current = true;
      onSwipe('left');
    } else if (info.offset.y < -100 && Math.abs(info.offset.x) < 60) {
      swipeHandled.current = true;
      onSwipe('up');
    } else {
      // Snap back
      setDragX(0);
      setDragY(0);
    }

    // Reset loop ref state briefly after animation starts
    setTimeout(() => {
      swipeHandled.current = false;
      setDragX(0);
      setDragY(0);
    }, 400);
  };

  // Rotation based on X offset
  const rotation = dragX * 0.08;
  // Shift UP slightly while dragging horizontally
  const yShift = Math.abs(dragX) * 0.05 + dragY;

  return {
    dragHandlers: {
      onDrag: handleDrag,
      onDragEnd: handleDragEnd,
    },
    style: {
      x: dragX,
      y: Math.max(-200, yShift), // limit upward translation
      rotate: rotation,
    },
    dragX,
    dragY,
  };
}
