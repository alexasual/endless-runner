import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Object3D } from 'three';

type ThirdPersonCameraProps = {
  target: Object3D | null;
  offset?: Vector3;
  lookOffset?: Vector3;
  distance?: number;
  height?: number;
  damping?: number;
};

export function ThirdPersonCamera({
  target,
  offset = new Vector3(0, -2, 0),
  lookOffset = new Vector3(0, 0, 0),
  distance = 6, // Increased distance for better visibility
  height = 10,   // Increased height for better view of the road ahead
  damping = 5
}: ThirdPersonCameraProps) {
  const { camera } = useThree();
  const cameraPositionRef = useRef(new Vector3());
  const cameraTargetRef = useRef(new Vector3());
  
  // Initialize camera position
  useEffect(() => {
    if (target) {
      const initialPosition = target.position.clone().add(offset);
      initialPosition.z = height;
      initialPosition.y -= distance;
      
      camera.position.copy(initialPosition);
      camera.lookAt(target.position.clone().add(lookOffset));
      
      cameraPositionRef.current.copy(camera.position);
      cameraTargetRef.current.copy(target.position.clone().add(lookOffset));
    }
  }, [target, offset, lookOffset, distance, height, camera]);
    // Update camera position to follow target
  useFrame((_, delta) => {
    if (target) {
      // Calculate desired camera position based on target
      const desiredPosition = target.position.clone().add(offset);
      desiredPosition.z = height;
      desiredPosition.y -= distance;
      
      // Smoothly interpolate to the desired position with improved damping
      cameraPositionRef.current.lerp(desiredPosition, 1 - Math.exp(-damping * delta));
      camera.position.copy(cameraPositionRef.current);      // Calculate the look target - look ahead of the player
      const lookTarget = target.position.clone().add(lookOffset);
      lookTarget.y += 3; // Look further ahead down the road
      lookTarget.z += 0.5; // Look slightly upward
      cameraTargetRef.current.lerp(lookTarget, 1 - Math.exp(-damping * delta));
      
      // Make camera look at the target
      camera.lookAt(cameraTargetRef.current);
    }
  });
  
  return null;
}
