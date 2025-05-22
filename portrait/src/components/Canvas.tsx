import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Canvas as ThreeCanvas } from '@react-three/fiber';

type CanvasProps = {
  children: ReactNode;
}

export function Canvas({ children }: CanvasProps) {
  const [isPortrait, setIsPortrait] = useState(false);
  
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    
    // Initial check
    checkOrientation();
    
    // Listen for orientation changes
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <ThreeCanvas
        dpr={[1, 2]}
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0,
          touchAction: 'none'        }}        camera={{ 
          // Camera positioned for third-person view - similar to the reference code
          position: [0, 0, -8], // Using similar position as reference (6.5, 2.5)
          fov: isPortrait ? 60 : 50, // Adjust FOV based on orientation
          near: 0.1,
          far: 1000
        }}
        gl={{ 
          antialias: true,
          alpha: true
        }}
      >
        {children}
      </ThreeCanvas>
    </div>
  );
}
