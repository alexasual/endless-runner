import { useState, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Road } from './Road';
import { Vector3, PerspectiveCamera } from 'three';

export function Scene() {
  // Keeping the state but not using it for now
  const [gameSpeed] = useState(5); // Fixed speed for testing
  const cameraRef = useRef<PerspectiveCamera>(null);
  const cameraPositionRef = useRef(new Vector3(0, 8, -10));
  const cameraTargetRef = useRef(new Vector3(0, 0, 30));
  const { camera } = useThree();
  
  // Time-based animation to simulate camera movement along the road
  const timeRef = useRef(0);
  
  useFrame((_, delta) => {
    // Increment time counter
    timeRef.current += delta * gameSpeed * 0.2;
    
    // Calculate a winding path for the camera to follow
    // This simulates the camera following the curves of the road
    const xPos = Math.sin(timeRef.current) * 5;
    
    // Update camera position reference
    cameraPositionRef.current.set(xPos, 8, -10);
    
    // Update camera look target to follow the same pattern but ahead
    cameraTargetRef.current.set(xPos * 2, 0, 30);
    
    // Apply camera movement with smooth interpolation
    camera.position.lerp(cameraPositionRef.current, 0.05);
    camera.lookAt(cameraTargetRef.current);
  });
  
  // Set initial camera properties
  useEffect(() => {
    camera.fov = 70;
    camera.updateProjectionMatrix();
  }, [camera]);
  
  return (
    <>
      {/* Lighting setup */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[0, 10, -10]} intensity={0.8} castShadow />
      <directionalLight position={[0, 10, 10]} intensity={0.4} />
      <hemisphereLight args={[0x606060, 0x404040, 0.6]} />
      
      {/* Add the Road component */}
      <Road speed={gameSpeed} />
    </>
  );
}