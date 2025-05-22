import { useRef, useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Mesh, MathUtils } from 'three';

// Types of obstacles similar to trees in the reference
type ObstacleProps = {
  id: number;
  lane: number;
  position: [number, number, number]; // 3D position
  speed: number;
  laneWidth: number;
  type?: number; // Optional type parameter for obstacle shape
  setRef?: (id: number, mesh: Mesh | null, type: number) => void;
};

export function Obstacle({ 
  id, 
  lane, 
  position, 
  laneWidth,
  setRef,
  type 
}: ObstacleProps) {  const meshRef = useRef<Mesh>(null);
  const [isActive, setIsActive] = useState(true);
  
  // Calculate lane position - similar to pathAngleValues in reference
  const lanePositions = [
    -laneWidth,  // Left lane
    0,           // Center lane
    laneWidth    // Right lane
  ];
  const xPosition = lanePositions[lane];
  
  // Random obstacle appearance - similar to the tree variations in reference
  const colors = ['#ff4444', '#44aaff', '#44ff44', '#aa44ff', '#ffaa22'];
  const [color] = useState(colors[Math.floor(Math.random() * colors.length)]);
  
  // Random obstacle size and type variations - similar to scalarMultiplier in reference
  const [scale] = useState(MathUtils.randFloat(0.7, 1.0));
  const [obstacleType] = useState(type !== undefined ? type : Math.floor(Math.random() * 3));
    // Register/unregister with parent for collision detection
  useEffect(() => {
    if (setRef && meshRef.current) {
      setRef(id, meshRef.current);
      
      return () => {
        setRef(id, null);
      };
    }
  }, [id, setRef]);

  // Check if obstacle is off screen - similar to how trees are managed in doTreeLogic()
  useEffect(() => {
    if (position[2] > 6) { // If gone past the camera
      setIsActive(false);
    }
  }, [position]);

  if (!isActive) return null;

  // Render different obstacle shapes based on type - similar to tree variations in reference
  const renderObstacleGeometry = () => {
    switch (obstacleType) {
      case 0: // Box
        return <boxGeometry args={[laneWidth * 0.7 * scale, laneWidth * 0.7 * scale, laneWidth * 0.7 * scale]} />;
      case 1: // Sphere - similar to heroSphere in reference
        return <sphereGeometry args={[laneWidth * 0.35 * scale, 16, 16]} />;
      case 2: // Cone/Triangle - similar to trees in reference
        return <coneGeometry args={[laneWidth * 0.4 * scale, laneWidth * 0.8 * scale, 16]} />;
      default:
        return <boxGeometry args={[laneWidth * 0.7 * scale, laneWidth * 0.7 * scale, laneWidth * 0.7 * scale]} />;
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={[xPosition, 0.5, position[2]]} // Now using Z-axis for depth
      rotation={obstacleType === 2 ? 
        // For cones, point them toward the player
        [0, 0, 0] : 
        // For other shapes, basic rotation
        [0, 0, 0]} 
    >
      {renderObstacleGeometry()}
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
    </mesh>
  );
}
