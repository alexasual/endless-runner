import { useRef, useState, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

type PowerUpProps = {
  id: number;
  lane: number;
  position: [number, number, number];
  laneWidth: number;
  type: 'shield' | 'speed' | 'score';
  setRef?: (id: number, mesh: Mesh | null) => void;
};

export function PowerUp({
  id,
  lane,
  position,
  laneWidth,
  type,
  setRef
}: PowerUpProps) {
  const meshRef = useRef<Mesh>(null);
  const { viewport } = useThree();
  const [isActive, setIsActive] = useState(true);
  
  // Calculate lane position
  const lanePositions = [
    -laneWidth,  // Left lane
    0,           // Center lane
    laneWidth    // Right lane
  ];
  const xPosition = lanePositions[lane];
    // Register/unregister with parent for collision detection
  useEffect(() => {
    if (setRef && meshRef.current) {
      setRef(id, meshRef.current);
      
      return () => {
        setRef(id, null);
      };
    }
  }, [id, setRef, type]);
  // Check if power-up is off screen - ensure it reaches well past the player
  useEffect(() => {
    if (position[1] < -viewport.height * 0.6) {
      setIsActive(false);
    }
  }, [position, viewport.height]);
  // Animate the power-up
  useFrame((_, delta) => {
    if (meshRef.current) {
      // Rotate the power-up for third-person view - different axes for better visual
      meshRef.current.rotation.x += delta * 1.2;
      meshRef.current.rotation.y += delta * 0.8;
      meshRef.current.rotation.z += delta * 0.5;
      
      // Hover animation - modified for third-person perspective
      const hoverAmount = Math.sin(Date.now() * 0.003) * delta * 0.3;
      meshRef.current.position.z += hoverAmount;
    }
  });
  
  if (!isActive) return null;
  
  // Power-up color based on type
  const getColor = () => {
    switch (type) {
      case 'shield': return '#44aaff'; // Blue
      case 'speed': return '#ffaa22';  // Orange
      case 'score': return '#ffcc00';  // Yellow/gold
      default: return '#ffffff';
    }
  };
    return (
    <mesh
      ref={meshRef}
      position={[xPosition, position[1], 0.5]} // Raised above the road
    >
      {/* Different shapes for different power-up types */}
      {type === 'shield' && (
        <torusGeometry args={[laneWidth * 0.3, laneWidth * 0.05, 16, 32]} />
      )}
      {type === 'speed' && (
        <octahedronGeometry args={[laneWidth * 0.25, 0]} />
      )}
      {type === 'score' && (
        <dodecahedronGeometry args={[laneWidth * 0.25, 0]} />
      )}
        <meshStandardMaterial
        color={getColor()}
        emissive={getColor()}
        emissiveIntensity={0.7}
        roughness={0.2}
        metalness={0.9}
      />
    </mesh>
  );
}
