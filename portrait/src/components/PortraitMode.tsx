import { useState, useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Object3D, PerspectiveCamera, Vector3 } from 'three';

// Custom hook for handling portrait mode camera adjustments
export function usePortraitMode() {
  const { camera } = useThree()
  const [isPortrait, setIsPortrait] = useState(false)
  const [viewportHeight, setViewportHeight] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(0)
  
  // Calculate mobile viewport dimensions (handles iOS Safari issues)
  const getViewportSize = () => {
    // Use visual viewport for mobile browsers
    if (window.visualViewport) {
      return {
        width: window.visualViewport.width,
        height: window.visualViewport.height
      }
    }
    // Fallback to inner window dimensions
    return {
      width: window.innerWidth,
      height: window.innerHeight
    }
  }

  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = getViewportSize()
      setViewportWidth(width)
      setViewportHeight(height)
      
      // Check if height is greater than width
      const portrait = height > width
      setIsPortrait(portrait)
        // Adjust camera for portrait mode
      const perspCamera = camera as PerspectiveCamera;
      
      if (portrait) {
        // Move camera back further in portrait mode to see more vertical space
        perspCamera.position.z = 7;
        // Wider field of view for portrait to see more of the scene vertically
        perspCamera.fov = 75;
        // Adjust the aspect ratio
        perspCamera.aspect = width / height;
      } else {
        // Landscape settings
        perspCamera.position.z = 5;
        perspCamera.fov = 60;
        perspCamera.aspect = width / height;
      }
      perspCamera.updateProjectionMatrix();
    }

    updateOrientation()
    
    // Handle various events that might change the viewport
    window.addEventListener('resize', updateOrientation)
    window.addEventListener('orientationchange', updateOrientation)
    
    // iOS Safari specific handling for full height
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateOrientation)
    }
    
    return () => {
      window.removeEventListener('resize', updateOrientation)
      window.removeEventListener('orientationchange', updateOrientation)
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateOrientation)
      }
    }
  }, [camera])
  return { isPortrait, viewportHeight, viewportWidth };
}

// Component to follow player in portrait mode
type FollowCameraProps = {
  target: MutableRefObject<Object3D | null>;
  offset?: Vector3;
};

export function FollowCamera({ target, offset = new Vector3(0, 2, 5) }: FollowCameraProps) {
  const { isPortrait } = usePortraitMode();  const prevPosition = useRef<Vector3 | null>(null);
  
  useFrame(({ camera }) => {
    if (!target.current) return;
      // Calculate camera position based on target position and offset
    const targetPosition = target.current.position.clone();
    
    // Adjust offset based on orientation
    const cameraOffset = isPortrait
      ? new Vector3(0, offset.y * 0.5, offset.z * 1.2) // Higher and further back in portrait
      : offset;
    
    // Add the offset to the target position
    const goalPosition = targetPosition.clone().add(cameraOffset);
    
    // Initialize prevPosition if needed
    if (!prevPosition.current) {
      prevPosition.current = goalPosition.clone();
    }
    
    // Set camera position with smooth lerp
    camera.position.lerp(goalPosition, 0.1);
    
    // Store previous position for smoothing
    prevPosition.current.copy(camera.position);
    
    // Look at the target - slightly above the object for better perspective
    const lookTarget = target.current.position.clone().add(new Vector3(0, 0.5, 0));
    camera.lookAt(lookTarget);
  });
  
  return null;
}
