'use client';

import { useState } from 'react';
import { SwipeCard } from './SwipeCard';
import type { SwipeProfile } from '@/store/swipeStore';
import { useSwipeStore } from '@/store/swipeStore';
import { AnimatePresence } from 'framer-motion';

interface SwipeDeckProps {
  profiles: SwipeProfile[];
  onSwipe: (id: string, action: 'LIKE' | 'REJECT' | 'SUPER') => void;
}

export function SwipeDeck({ profiles, onSwipe }: SwipeDeckProps) {
  const nextCard = useSwipeStore(s => s.nextCard);

  const handleSwipe = (id: string, dir: 'left' | 'right' | 'up') => {
    
    // Map direction to action
    let action: 'LIKE' | 'REJECT' | 'SUPER' = 'REJECT';
    if (dir === 'right') action = 'LIKE';
    if (dir === 'up') action = 'SUPER';

    // Call API callback
    onSwipe(id, action);
    
    // Increment deck index inside store
    nextCard();
  };

  return (
    <div className="relative w-full h-[650px] flex items-center justify-center perspective-[1000px]">
      <AnimatePresence>
        {/* Render bottom 3 cards for depth effect */}
        {profiles.slice(0, 3).reverse().map((profile, i) => {
          // Because we sliced and reversed, the active card is the LAST one in the array
          const isActive = i === Math.min(profiles.length, 3) - 1;
          
          return (
            <div 
              key={profile.id} 
              className="absolute pointer-events-none"
              style={{
                 // Stagger scale and translation based on depth position
                transform: `scale(${isActive ? 1 : 1 - (profiles.slice(0,3).length - 1 - i) * 0.05}) translateY(${(profiles.slice(0,3).length - 1 - i) * 12}px)`,
                zIndex: i,
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
            >
              <SwipeCard 
                profile={profile} 
                isActive={isActive}
                onSwipe={handleSwipe}
              />
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
