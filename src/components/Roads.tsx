import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

const ROAD_LENGTH = 100 // Length of each road segment
const ROAD_WIDTH = 10
const ROAD_SEGMENTS = 3 // Number of road segments to maintain

export default function Road() {
  const roadRef = useRef<THREE.Group>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  
  // Create initial road segments
  const roadSegments = useMemo(() => {
    const segments = []
    for (let i = 0; i < ROAD_SEGMENTS; i++) {
      segments.push({
        position: new THREE.Vector3(0, 0, -i * ROAD_LENGTH),
        id: i
      })
    }
    return segments
  }, [])

  // Animation loop
  useFrame((state, delta) => {
    if (!roadRef.current || !cameraRef.current) return

    // Move camera forward
    const speed = 20 // Units per second
    const moveDistance = speed * delta
    cameraRef.current.position.z -= moveDistance

    // Check if we need to recycle road segments
    roadSegments.forEach((segment) => {
      const segmentPosition = segment.position.z
      const cameraPosition = cameraRef.current.position.z

      // If segment is behind the camera by more than ROAD_LENGTH
      if (segmentPosition > cameraPosition + ROAD_LENGTH) {
        // Move segment to the front
        segment.position.z = cameraPosition - ROAD_LENGTH * (ROAD_SEGMENTS - 1)
      }
    })
  })

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={[0, 5, 0]}
        fov={75}
        near={0.1}
        far={1000}
      />
      
      <group ref={roadRef}>
        {roadSegments.map((segment) => (
          <mesh
            key={segment.id}
            position={[segment.position.x, segment.position.y, segment.position.z]}
            rotation={[-Math.PI / 2, 0, 0]} // Rotate to be horizontal
          >
            <planeGeometry args={[ROAD_WIDTH, ROAD_LENGTH]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        ))}
      </group>

      {/* Add some ambient light */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
    </>
  )
}
