import { DoubleSide, Vector3, Curve, TubeGeometry } from 'three';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group } from 'three';

type RoadProps = {
  speed: number;
};

// Define a custom curve class for a more interesting winding path
class WindingCurve extends Curve<Vector3> {
  constructor() {
    super();
  }
  
  getPoint(t: number): Vector3 {
    // t goes from 0 to 1
    const scale = 15; // Overall scale of the road
    
    // Create a winding path that curves left and right
    const x = scale * Math.sin(2 * Math.PI * t) * 0.7;
    
    // Keep y mostly flat with small variations for hills/dips
    const y = Math.abs(Math.sin(3 * Math.PI * t) * 0.3);
    
    // Z determines how far the road extends
    const z = -scale * 2 * t; // Negative to extend into the scene
    
    return new Vector3(x, y, z);
  }
}

export function Road({ speed }: RoadProps) {
  // Create two road sections for seamless looping
  const roadSection1Ref = useRef<Group>(null);
  const roadSection2Ref = useRef<Group>(null);
  // Create the winding path using our custom curve
  const { roadGeometry, curveLength } = useMemo(() => {
    // Create the custom curve
    const curve = new WindingCurve();
    
    // Create a tube geometry along the curve
    // TubeGeometry(path, tubularSegments, radius, radialSegments, closed)
    const roadGeometry = new TubeGeometry(curve, 100, 2.5, 8, false);
    
    // Calculate the approximate length of the curve for proper positioning
    const curveLength = 30; // Based on our scale settings in the curve
    
    return { roadGeometry, curveLength };
  }, []);
    // Move road sections toward the camera
  useFrame((_, delta) => {
    const moveSpeed = speed * delta;
    
    // Move first road section
    if (roadSection1Ref.current) {
      roadSection1Ref.current.position.z -= moveSpeed;
      
      // Reset when it moves past the camera
      if (roadSection1Ref.current.position.z < -60) {
        roadSection1Ref.current.position.z = 60;
      }
    }
    
    // Move second road section
    if (roadSection2Ref.current) {
      roadSection2Ref.current.position.z -= moveSpeed;
      
      // Reset when it moves past the camera
      if (roadSection2Ref.current.position.z < -60) {
        roadSection2Ref.current.position.z = 60;
      }
    }
  });    return (
    <>
      <group position={[0, -2, 10]} rotation={[0, 0, 0]}>
        {/* First road section */}
        <group ref={roadSection1Ref} position={[0, 0, 0]}>
          {/* Main road surface using the smooth tube geometry */}
          <mesh>
            <primitive object={roadGeometry} attach="geometry" />
            <meshStandardMaterial color="#333333" side={DoubleSide} />
          </mesh>
        </group>
        
        {/* Second road section (offset for seamless continuation) */}
        <group ref={roadSection2Ref} position={[0, 0, -30]}>
          {/* Main road surface using the same tube geometry */}
          <mesh>
            <primitive object={roadGeometry} attach="geometry" />
            <meshStandardMaterial color="#333333" side={DoubleSide} />
          </mesh>
        </group>
      </group>
    </>
  );
}
