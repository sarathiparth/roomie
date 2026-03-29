'use client';

import { Suspense } from 'react';

// Placeholder for future React Three Fiber Canvas
// This acts as a background slot layer that component pages can trigger effects in.
export function SceneWrapper({ children }: { children?: React.ReactNode }) {
  // Wait until we actually import three.js to avoid bundle size hit initially
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {/* 
        Future:
        <Canvas gl={{ alpha: true, antialias: true }}>
          <Suspense fallback={null}>
             {children || <AmbientParticles />}
          </Suspense>
        </Canvas>
      */}
    </div>
  );
}
