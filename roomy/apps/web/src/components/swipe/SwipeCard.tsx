'use client';

import { Suspense, useState, useRef, useEffect, MouseEvent } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { User, MapPin, Briefcase, Heart, X, Star } from 'lucide-react';
import type { SwipeProfile } from '@/store/swipeStore';

interface SwipeCardProps {
  profile: SwipeProfile;
  isActive: boolean;
  onSwipe: (id: string, dir: 'left' | 'right' | 'up') => void;
}

export function SwipeCard({ profile, isActive, onSwipe }: SwipeCardProps) {
  const controls = useAnimation();
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const THRESHOLD = 100;

  const handleDragEnd = async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Determine direction based on thresholds
    let direction: 'left' | 'right' | 'up' | null = null;
    
    if (info.offset.x > THRESHOLD) direction = 'right';
    else if (info.offset.x < -THRESHOLD) direction = 'left';
    else if (info.offset.y < -THRESHOLD && Math.abs(info.offset.x) < 50) direction = 'up';

    if (direction) {
      // Animate off screen
      await controls.start({
        x: direction === 'left' ? -300 : direction === 'right' ? 300 : 0,
        y: direction === 'up' ? -500 : info.offset.y + 100,
        opacity: 0,
        rotate: direction === 'left' ? -20 : direction === 'right' ? 20 : 0,
        transition: { duration: 0.3 }
      });
      onSwipe(profile.id, direction);
    } else {
      // Snap back
      controls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  // Allow clicking buttons to trigger swipe programmatically
  const forceSwipe = async (dir: 'left' | 'right' | 'up') => {
    if (!isActive) return;
    await controls.start({
        x: dir === 'left' ? -300 : dir === 'right' ? 300 : 0,
        y: dir === 'up' ? -500 : 100,
        opacity: 0,
        rotate: dir === 'left' ? -20 : dir === 'right' ? 20 : 0,
        transition: { duration: 0.3 }
    });
    onSwipe(profile.id, dir);
  };

  return (
    <motion.div
      drag={isActive ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      animate={controls}
      style={{ touchAction: 'none' }} // Crucial for mobile dragging
      className={`absolute w-full h-[600px] max-w-[360px] rounded-[32px] overflow-hidden shadow-2xl bg-surface border border-text/5 will-change-transform ${isActive ? 'z-20 cursor-grab active:cursor-grabbing' : 'z-10 opacity-0 pointer-events-none'}`}
    >
      {/* Background Image Setup */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${profile.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800'})` }}
      />
      {/* Gradient Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

      {/* Badges */}
      <div className="absolute top-6 left-6 right-6 flex justify-between z-10 pointer-events-none">
        <div className="glass px-3 py-1.5 rounded-full text-white font-medium flex items-center gap-1.5 backdrop-blur-md">
          <Star size={14} className={profile.compatibilityScore && profile.compatibilityScore > 85 ? "fill-primary text-primary" : "text-white"} />
          <span className="text-sm">{profile.compatibilityScore ?? 'Pending'}% Match</span>
        </div>
      </div>

      {/* Info Content Section */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10 pointer-events-none text-white">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight leading-none mb-2">
              {profile.name}, {profile.age}
            </h2>
            <div className="space-y-1.5 mb-6">
              <div className="flex items-center gap-2 text-white/90 font-medium text-sm">
                <Briefcase size={16} />
                <span>{profile.profession || 'Professional'}</span>
              </div>
              {profile.city && (
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <MapPin size={16} />
                  <span>{profile.area ? `${profile.area}, ` : ''}{profile.city}</span>
                </div>
              )}
            </div>
            {/* Tags preview */}
            {profile.tags && profile.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-24"> 
                {profile.tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-md text-xs font-medium border border-white/20">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons (Only interactive when active) */}
      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30 transition-opacity ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <button 
            type="button" 
            onClick={() => forceSwipe('left')}
            className="w-14 h-14 rounded-full bg-surface border border-text/10 flex flex-col items-center justify-center text-red-500 shadow-lg hover:bg-red-50 hover:border-red-500 transition-colors"
          >
            <X size={28} strokeWidth={2.5} />
          </button>
          
           {/* Super Like */}
          <button 
            type="button" 
             onClick={() => forceSwipe('up')}
            className="w-12 h-12 rounded-full bg-surface border border-text/10 flex flex-col items-center justify-center text-blue-500 shadow-lg hover:bg-blue-50 hover:border-blue-500 transition-colors"
          >
            <Star size={24} strokeWidth={2.5} />
          </button>

          <button 
            type="button" 
             onClick={() => forceSwipe('right')}
            className="w-14 h-14 rounded-full bg-surface border border-text/10 flex flex-col items-center justify-center text-green-500 shadow-lg hover:bg-green-50 hover:border-green-500 transition-colors"
          >
            <Heart size={28} strokeWidth={2.5} className="fill-current" />
          </button>
      </div>

    </motion.div>
  );
}
