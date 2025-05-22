import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';

type ExplosionEffectProps = {
  position: Vector3;
  duration?: number;
  particleCount?: number;
  colors?: string[];
};

export function ExplosionEffect({
  position,
  duration = 1,
  particleCount = 20,
  colors = ['#ff4444', '#ffaa22', '#ffffff']
}: ExplosionEffectProps) {
  const [particles, setParticles] = useState<{
    position: Vector3;
    velocity: Vector3;
    size: number;
    color: string;
    rotation: number;
  }[]>([]);
  const [alive, setAlive] = useState(true);
  const lifeTimeRef = useRef(0);
    // Generate particles on mount
  useEffect(() => {
    const newParticles = [];
    
    for (let i = 0; i < particleCount; i++) {
      // Random direction
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2;
        newParticles.push({
        position: position.clone(),
        velocity: new Vector3(
          Math.cos(angle) * speed,
          // For 3D effect, spread particles in all directions
          Math.sin(angle) * speed,
          (Math.random() - 0.5) * speed * 1.2 // More variation in Z axis for 3D explosion
        ),
        size: 0.1 + Math.random() * 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2
      });
    }
    
    setParticles(newParticles);
    
    // Set a timeout to clean up the effect
    const timeout = setTimeout(() => {
      setAlive(false);
    }, duration * 1000);
    
    return () => {
      clearTimeout(timeout);
    };
  }, [position, particleCount, colors, duration]);
  
  // Animate particles
  useFrame((_, delta) => {
    lifeTimeRef.current += delta;
    
    // Don't update if we've passed the lifetime
    if (lifeTimeRef.current >= duration) {
      return;
    }
      // Calculate progress - from 0 to 1 over the lifetime
    const progress = lifeTimeRef.current / duration;
    
    setParticles(prev => 
      prev.map(particle => {
        // Update position based on velocity
        const newPosition = particle.position.clone().add(
          particle.velocity.clone().multiplyScalar(delta)
        );
        
        // Add gravity over time - more realistic for 3D
        particle.velocity.y -= delta * 4;
        
        // Add drag to slow particles
        particle.velocity.multiplyScalar(0.95);
        
        return {
          ...particle,
          position: newPosition,
          // Shrink particles over time
          size: particle.size * (1 - progress * 0.5),
          // Rotate particles in 3D space for better effect
          rotation: particle.rotation + delta * 5
        };
      })
    );
  });
  
  if (!alive) return null;
  
  return (
    <group>
      {particles.map((particle, index) => (
        <mesh 
          key={index}
          position={particle.position}
          rotation={[particle.rotation * 0.5, particle.rotation, particle.rotation * 0.7]}
        >
          <sphereGeometry args={[particle.size, 8, 8]} />
          <meshBasicMaterial color={particle.color} transparent opacity={1 - lifeTimeRef.current / duration} />
        </mesh>
      ))}
    </group>
  );
}
