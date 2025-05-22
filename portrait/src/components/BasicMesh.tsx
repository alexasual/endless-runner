import { forwardRef, useRef } from 'react'
import type { ForwardedRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh } from 'three'

type MeshProps = {
  position?: [number, number, number]
  color?: string
  size?: [number, number, number]
  rotation?: boolean
}

export const BasicMesh = forwardRef(({ 
  position = [0, 0, 0], 
  color = 'red', 
  size = [1, 1, 1],
  rotation = true
}: MeshProps, ref: ForwardedRef<Mesh>) => {
  // Use internal ref if no external ref is provided
  const internalMeshRef = useRef<Mesh>(null)
  const meshRef = (ref as React.MutableRefObject<Mesh | null>) || internalMeshRef
  
  useFrame((_, delta) => {
    if (meshRef.current && rotation) {
      meshRef.current.rotation.x += delta * 0.5
      meshRef.current.rotation.y += delta * 0.2
    }
  })

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
})
