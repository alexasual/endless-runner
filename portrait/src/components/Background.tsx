import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, Mesh, Group } from 'three';
import { usePortraitMode } from './PortraitMode';

type BackgroundProps = {
  speed: number;
  score: number;
};

export function Background({ speed, score }: BackgroundProps) {
  const { viewport } = useThree();
  const { isPortrait } = usePortraitMode();
  
  // Create refs for moving elements
  const buildingsRef = useRef<(Group | Mesh | null)[]>([]);
  
  // Generate buildings based on screen size
  const buildingCount = isPortrait ? 10 : 15;
  const buildingHeight = viewport.height * 0.4;
  
  // Calculate difficulty-based color changes
  const difficulty = Math.min(score / 10000, 1); // 0 to 1 based on score
  const dayColor = new Color(0x87ceeb); // Sky blue
  const nightColor = new Color(0x0a1a2a); // Dark blue-black
  const backgroundColor = dayColor.clone().lerp(nightColor, difficulty);
  
  // Create an array of buildings with random heights
  const buildings = Array.from({ length: buildingCount }).map((_, i) => {
    const width = viewport.width / buildingCount;
    const height = buildingHeight * (0.5 + Math.random() * 0.5);
    const x = (i * width) - (viewport.width / 2) + (width / 2);
    const y = -viewport.height * 0.2;
    
    // Darken the building color based on difficulty
    const baseColor = new Color(0x888888); // Light gray
    const darkColor = new Color(0x222222); // Dark gray
    const buildingColor = baseColor.clone().lerp(darkColor, difficulty);
    
    return {
      width,
      height,
      x,
      y,
      color: '#' + buildingColor.getHexString()
    };
  });
    // Animate buildings and stars
  useFrame((_, delta) => {
    // Parallax effect - buildings move slowly
    buildingsRef.current.forEach((building) => {
      if (building) {
        building.position.y -= delta * speed * 0.2;
        
        // Reset building when it goes off screen
        if (building.position.y < -viewport.height - buildingHeight) {
          building.position.y = viewport.height;
        }
      }
    });
  });
    return (
    <group>
      {/* Sky background */}
      <mesh position={[0, 0, -50]} rotation={[0, 0, 0]}>
        <planeGeometry args={[viewport.width * 10, viewport.height * 10]} />
        <meshBasicMaterial color={backgroundColor.getHexString()} />
      </mesh>
      
      {/* Distant mountains/horizon for 3D effect */}
      <mesh position={[0, viewport.height, -30]} rotation={[-Math.PI / 6, 0, 0]}>
        <planeGeometry args={[viewport.width * 8, viewport.height * 4]} />
        <meshBasicMaterial color={'#' + new Color(backgroundColor).multiplyScalar(0.7).getHexString()} />
      </mesh>
      
      {/* Buildings in the background - make them 3D */}
      {buildings.map((building, i) => (
        <mesh
          key={i}
          ref={el => { buildingsRef.current[i] = el; }}
          position={[building.x, building.y * 3, -15]}
        >
          <boxGeometry args={[building.width * 0.9, building.height, building.width * 0.5]} />
          <meshStandardMaterial color={building.color} />
        </mesh>
      ))}
      
      {/* Add clouds in the sky */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh
          key={`cloud-${i}`}
          position={[
            (Math.random() - 0.5) * viewport.width * 5,
            viewport.height + i * 10,
            -20 - Math.random() * 10
          ]}
        >
          <sphereGeometry args={[2 + Math.random() * 3, 8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}
