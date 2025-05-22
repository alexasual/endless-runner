import { useState, useEffect } from 'react';
import { Vector3 } from 'three';
import { ExplosionEffect } from './ExplosionEffect';

// Manage visual effects in the game
export function GameEffects() {
  const [effects, setEffects] = useState<{
    id: number;
    type: 'explosion';
    position: Vector3;
    duration?: number;
  }[]>([]);
  
  // Listen for game events to trigger effects
  useEffect(() => {
    const handleGameEvent = (e: CustomEvent<{
      type: string;
      position?: Vector3;
    }>) => {
      if (e.detail.type === 'collision' && e.detail.position) {
        // Add explosion at collision point
        setEffects(prev => [
          ...prev,
          {
            id: Date.now(),
            type: 'explosion',
            position: e.detail.position!,
            duration: 1 // seconds
          }
        ]);
      }
    };
    
    // Add event listener
    window.addEventListener('game-event', handleGameEvent as EventListener);
    
    return () => {
      window.removeEventListener('game-event', handleGameEvent as EventListener);
    };
  }, []);
    // Clean up effects after their duration
  useEffect(() => {
    if (effects.length > 0) {
      const timeouts: number[] = [];
      
      effects.forEach(effect => {
        const timeout = setTimeout(() => {
          setEffects(prev => prev.filter(e => e.id !== effect.id));
        }, (effect.duration || 1) * 1000 + 100); // Add a small buffer
        
        timeouts.push(timeout);
      });
      
      return () => {
        timeouts.forEach(clearTimeout);
      };
    }
  }, [effects]);
  
  return (
    <>
      {effects.map(effect => {
        if (effect.type === 'explosion') {
          return (
            <ExplosionEffect
              key={effect.id}
              position={effect.position}
              duration={effect.duration}
            />
          );
        }
        return null;
      })}
    </>
  );
}
