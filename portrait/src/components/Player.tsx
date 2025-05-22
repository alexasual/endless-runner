import { useRef, useState, useEffect, forwardRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Mesh } from 'three';
import { usePortraitMode } from './PortraitMode';

// Control keys for the player
const ControlKeys = {
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
} as const;

type PlayerProps = {
  speed?: number;
  lane?: number;
  onLaneChange?: (lane: number) => void;
  laneWidth?: number;
  isGameOver?: boolean;
  hasShield?: boolean;
};

export const Player = forwardRef<Mesh, PlayerProps>((props, ref) => {
  const { 
    speed = 5, 
    lane: externalLane, 
    onLaneChange,
    laneWidth: externalLaneWidth,
    isGameOver = false,
    hasShield = false
  } = props;
  
  const meshRef = useRef<Mesh>(null);
  const actualRef = (ref as React.MutableRefObject<Mesh | null>) || meshRef;
  
  const { isPortrait } = usePortraitMode();
  const { viewport } = useThree();
  
  // Track lane position (0 = left, 1 = center, 2 = right)
  const [internalLane, setInternalLane] = useState(1);
  const lane = externalLane !== undefined ? externalLane : internalLane;
  const laneCount = 3;
  
  // Calculate lane width based on viewport or use provided value
  const laneWidth = externalLaneWidth || 
    (isPortrait ? viewport.width / (laneCount * 1.5) : viewport.width / (laneCount * 2));
  
  // Calculate target X position based on lane
  const lanePositions = [
    -laneWidth,   // Left lane
    0,            // Center lane
    laneWidth     // Right lane
  ];
  const targetPositionX = lanePositions[lane];
  
  // Update lane internally and notify parent component
  const updateLane = (newLane: number) => {
    const clampedLane = Math.max(0, Math.min(laneCount - 1, newLane));
    
    if (onLaneChange) {
      onLaneChange(clampedLane);
    } else {
      setInternalLane(clampedLane);
    }
    
    // Dispatch custom event for lane change (for visual indicators)
    const event = new CustomEvent('lane-change', {
      detail: { lane: clampedLane }
    });
    window.dispatchEvent(event);
  };
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ControlKeys.LEFT) {
        updateLane(lane - 1);
      } else if (e.key === ControlKeys.RIGHT) {
        updateLane(lane + 1);
      }
    };
      window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lane, updateLane]);
  
  // Handle touch input for mobile
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touchX = e.touches[0].clientX;
      const screenMidpoint = window.innerWidth / 2;
      
      if (touchX < screenMidpoint) {
        updateLane(lane - 1);
      } else {
        updateLane(lane + 1);
      }
    };
      window.addEventListener('touchstart', handleTouchStart);
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [lane, updateLane]);
  
  // Animate player movement between lanes
  useFrame((_, delta) => {
    if (actualRef.current) {
      if (isGameOver) {
        // Game over animation - spin the player in 3D
        actualRef.current.rotation.x += delta * 2;
        actualRef.current.rotation.y += delta * 5;
        actualRef.current.rotation.z += delta * 10;
        
        // Move slightly upward on game over
        actualRef.current.position.y += delta * 0.5;
      } else {
        // Smooth lane transitions - LERP for smooth movement
        actualRef.current.position.x = actualRef.current.position.x + 
          (targetPositionX - actualRef.current.position.x) * delta * speed * 2;
        
        // Add some subtle animation for the player - tilt into turns
        const turningEffect = (targetPositionX - actualRef.current.position.x) * 0.5;
        actualRef.current.rotation.z = -turningEffect; // Inverted for third-person view
        
        // Maintain forward-facing orientation for third-person view
        actualRef.current.rotation.y = Math.PI; // Face toward camera
        
        // Position player for third-person view - slightly closer to the camera
        actualRef.current.position.y = 0.5; // Slightly above the road
        actualRef.current.position.z = -5; // Closer to the camera for third-person view
      }
    }
  });
  
  // Create player character
  return (
    <mesh 
      ref={actualRef}
      position={[targetPositionX, 0.5, -5]} // Position in front of the camera
      rotation={[0, Math.PI, 0]} // Face the camera in third-person view
    >
      {/* Player body - more 3D appearance */}
      <group>
        {/* Main body */}
        <mesh>
          <boxGeometry args={[laneWidth * 0.6, laneWidth * 0.9, laneWidth * 0.4]} />
          <meshStandardMaterial color="#ff3366" roughness={0.3} metalness={0.2} />
        </mesh>
        
        {/* Head */}
        <mesh position={[0, laneWidth * 0.5, laneWidth * 0.2]}>
          <sphereGeometry args={[laneWidth * 0.25, 16, 16]} />
          <meshStandardMaterial color="#ffcc88" roughness={0.5} />
        </mesh>
        
        {/* Add arms for more character detail */}
        <mesh position={[-laneWidth * 0.4, laneWidth * 0.1, 0]} rotation={[0, 0, -Math.PI/6]}>
          <boxGeometry args={[laneWidth * 0.2, laneWidth * 0.5, laneWidth * 0.2]} />
          <meshStandardMaterial color="#ff3366" roughness={0.3} metalness={0.2} />
        </mesh>
        
        <mesh position={[laneWidth * 0.4, laneWidth * 0.1, 0]} rotation={[0, 0, Math.PI/6]}>
          <boxGeometry args={[laneWidth * 0.2, laneWidth * 0.5, laneWidth * 0.2]} />
          <meshStandardMaterial color="#ff3366" roughness={0.3} metalness={0.2} />
        </mesh>
        
        {/* Shield effect when active */}
        {hasShield && (
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[laneWidth * 0.8, 16, 16]} />
            <meshStandardMaterial 
              color="#44aaff" 
              transparent 
              opacity={0.3} 
              emissive="#44aaff"
              emissiveIntensity={0.5}
            />
          </mesh>
        )}
      </group>
    </mesh>
  );
});
