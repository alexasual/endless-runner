import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Environment } from '@react-three/drei'
import * as THREE from 'three'

const ROAD_WIDTH = 10
const ROAD_SEGMENTS = 200
const NUM_BOXES = 55
const BOX_SIZE = 0.075
const NUM_OBSTACLES = 10
const NUM_COINS = 15
const NUM_JB_FOODS = 8
const PLAYER_SIZE = 0.7
const DIFFICULTY_INCREASE_INTERVAL = 30000 // increase difficulty every 30 seconds
const DIFFICULTY_POINT_THRESHOLD = 10 // also increase difficulty every 10 points

// Spline data for a straight road
const curvePath = [
  0, 0, 0,
  0, 0, 50,
  0, 0, 100,
  0, 0, 150,
  0, 0, 200,
  0, 0, 250,
  0, 0, 300,
  0, 0, 350,
  0, 0, 400,
  0, 0, 450,
  0, 0, 500
]

// Remove the extendCurvePath logic and use the straight path directly
const extendedCurvePath = curvePath

function computeParallelTransportFrames(spline: THREE.CatmullRomCurve3, segments: number) {
  const points = spline.getPoints(segments)
  const tangents: THREE.Vector3[] = []
  const normals: THREE.Vector3[] = []
  const binormals: THREE.Vector3[] = []
  let prevBinormal: THREE.Vector3 = new THREE.Vector3(0, 1, 0)
  for (let i = 0; i < points.length; i++) {
    const t = spline.getTangent(i / (points.length - 1)).normalize()
    tangents.push(t.clone())
    if (i === 0) {
      // Pick a normal that's not parallel to the tangent
      let n: THREE.Vector3 = new THREE.Vector3(0, 1, 0)
      if (Math.abs(t.dot(n)) > 0.99) n = new THREE.Vector3(1, 0, 0)
      const b: THREE.Vector3 = new THREE.Vector3().crossVectors(t, n).normalize()
      n = new THREE.Vector3().crossVectors(b, t).normalize()
      normals.push(n)
      binormals.push(b)
      prevBinormal = b.clone()
    } else {
      const v = new THREE.Vector3().crossVectors(tangents[i - 1], t)
      const s = v.length()
      if (s > Number.EPSILON) {
        const axis = v.normalize()
        const angle = Math.asin(s)
        const mat = new THREE.Matrix4().makeRotationAxis(axis, angle)
        const n = normals[i - 1].clone().applyMatrix4(mat).normalize()
        const b = new THREE.Vector3().crossVectors(t, n).normalize()
        normals.push(n)
        binormals.push(b)
        prevBinormal = b.clone()
      } else {
        normals.push(normals[i - 1].clone())
        binormals.push(prevBinormal.clone())
      }
    }
  }
  return { tangents, normals, binormals }
}

interface Player {
  name: string
  color: string
  avatar: string // Add avatar property
}

interface RoadProps {
  player: Player
  setScore: (score: number) => void
  gameStarted: boolean
  setGameOver: (over: boolean) => void
  setDifficulty: (difficulty: number) => void
}

export default function Road({ player, setScore, gameStarted, setGameOver, setDifficulty }: RoadProps) {
  const roadRef = useRef<THREE.Group>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const boxesRef = useRef<THREE.Object3D[]>([])
  const runnerProgress = useRef(0)
  const [score, updateScore] = useState(0)
  const [playerX, setPlayerX] = useState(0)
  const [playerY, setPlayerY] = useState(PLAYER_SIZE/2) // Add Y position for vertical movement
  const [targetX, setTargetX] = useState(0)
  const [targetY, setTargetY] = useState(PLAYER_SIZE/2) // Add target Y for smooth movement
  const [gameOver, setGameOverState] = useState(false)
  const [difficultyState, setDifficultyState] = useState(1) // Add difficulty level
  const lastDifficultyIncrease = useRef(Date.now()) // Track when difficulty was last increased

  // Create spline from points
  const spline = useMemo(() => {
    const points = []
    for (let p = 0; p < extendedCurvePath.length; p += 3) {
      points.push(new THREE.Vector3(
        extendedCurvePath[p],
        extendedCurvePath[p + 1],
        extendedCurvePath[p + 2]
      ))
    }
    return new THREE.CatmullRomCurve3(points)
  }, [])

  // Use parallel transport frames for stable orientation
  const ptFrames = useMemo(() => computeParallelTransportFrames(spline, ROAD_SEGMENTS), [spline])

  // Generate a continuous road mesh by sweeping a rectangle along the spline
  const roadGeometry = useMemo(() => {
    const points = spline.getPoints(ROAD_SEGMENTS)
    const lefts = []
    const rights = []
    for (let i = 0; i < points.length; i++) {
      const binormal = ptFrames.binormals[i]
      const left = points[i].clone().add(binormal.clone().multiplyScalar(-ROAD_WIDTH / 2))
      const right = points[i].clone().add(binormal.clone().multiplyScalar(ROAD_WIDTH / 2))
      lefts.push(left)
      rights.push(right)
    }
    // Build vertices and indices
    const vertices = []
    const uvs = []
    for (let i = 0; i < points.length; i++) {
      vertices.push(lefts[i].x, lefts[i].y, lefts[i].z)
      vertices.push(rights[i].x, rights[i].y, rights[i].z)
      uvs.push(0, i / (points.length - 1))
      uvs.push(1, i / (points.length - 1))
    }
    const indices = []
    for (let i = 0; i < points.length - 1; i++) {
      const a = i * 2
      const b = i * 2 + 1
      const c = (i + 1) * 2
      const d = (i + 1) * 2 + 1
      indices.push(a, c, b)
      indices.push(b, c, d)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    return geometry
  }, [spline, ptFrames])

  // Create boxes along the path
  const boxes = useMemo(() => {
    const boxGeo = new THREE.BoxGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE)
    const boxes = []
    for (let i = 0; i < NUM_BOXES; i++) {
      const p = (i / NUM_BOXES + Math.random() * 0.1) % 1
      const pos = spline.getPointAt(p)
      pos.x += Math.random() - 0.4
      pos.z += Math.random() - 0.4
      const rote = new THREE.Vector3(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )
      const edges = new THREE.EdgesGeometry(boxGeo, 0.2)
      const color = new THREE.Color().setHSL(0.7 - p, 1, 0.5)
      const lineMat = new THREE.LineBasicMaterial({ color })
      const boxLines = new THREE.LineSegments(edges, lineMat)
      boxLines.position.copy(pos)
      boxLines.rotation.set(rote.x, rote.y, rote.z)
      boxes.push(boxLines)
    }
    return boxes
  }, [spline])

  // Calculate total road length
  const roadLength = useMemo(() => {
    let length = 0
    for (let i = 3; i < extendedCurvePath.length; i += 3) {
      const prev = new THREE.Vector3(
        extendedCurvePath[i-3], extendedCurvePath[i-2], extendedCurvePath[i-1]
      )
      const curr = new THREE.Vector3(
        extendedCurvePath[i], extendedCurvePath[i+1], extendedCurvePath[i+2]
      )
      length += prev.distanceTo(curr)
    }
    return length
  }, [])

  // Animation loop: move camera along the center of the road, loop for endless effect
  useFrame((_, delta) => {
    if (!cameraRef.current) return
    // Speed increases with difficultyState
    const speed = 20 * (1 + (difficultyState - 1) * 0.2) // 20 to 28 units per second based on difficulty
    runnerProgress.current += (speed * delta) / roadLength
    let p = runnerProgress.current
    if (p > 1) {
      p -= 1
      runnerProgress.current = p
      // Shift all boxes back by roadLength in z
      boxesRef.current.forEach(box => {
        if (box) box.position.z += roadLength
      })
    }
    const pos = spline.getPointAt(p)
    const tangent = spline.getTangentAt(p)
    // Offset camera above the road and behind the player
    const cameraHeight = 3 + playerY * 0.5 // Camera follows player's height
    const up = new THREE.Vector3(0, 1, 0)
    const cameraPos = pos.clone().add(up.clone().multiplyScalar(cameraHeight))
    // Offset camera slightly behind player
    cameraPos.add(tangent.clone().multiplyScalar(-3))
    cameraRef.current.position.copy(cameraPos)
    // Look ahead
    const lookAt = pos.clone().add(tangent.clone().multiplyScalar(5))
    lookAt.y = playerY // Look at player's height
    cameraRef.current.lookAt(lookAt)
  })

  // Obstacles and coins (now stateful for recycling)
  const [obstacles, setObstacles] = useState(() => {
    const arr = []
    for (let i = 0; i < NUM_OBSTACLES; i++) {
      const p = Math.random() * 0.9 + 0.05
      const pos = new THREE.Vector3(0, PLAYER_SIZE/2, 0)
      pos.x = (Math.random() - 0.5) * (ROAD_WIDTH - 2)
      pos.z = p * 500
      arr.push({ pos, id: i, hit: false })
    }
    return arr
  })

  const [coins, setCoins] = useState(() => {
    const arr = []
    for (let i = 0; i < NUM_COINS; i++) {
      const p = Math.random() * 0.9 + 0.05
      const pos = new THREE.Vector3(0, PLAYER_SIZE/2, 0)
      pos.x = (Math.random() - 0.5) * (ROAD_WIDTH - 2)
      pos.z = p * 500
      arr.push({ pos, id: i, collected: false })
    }
    return arr
  })

  // Create JB Food collectibles
  const [jbFoods, setJbFoods] = useState(() => {
    const arr = []
    for (let i = 0; i < NUM_JB_FOODS; i++) {
      const p = Math.random() * 0.9 + 0.05
      const pos = new THREE.Vector3(0, PLAYER_SIZE/2 + Math.random() * 2, 0) // Random height
      pos.x = (Math.random() - 0.5) * (ROAD_WIDTH - 2)
      pos.z = p * 500
      arr.push({ pos, id: i, collected: false, type: Math.floor(Math.random() * 5) }) // Different food types
    }
    return arr
  })
  // Smooth player movement (lerp)
  useFrame(() => {
    if (!gameStarted || gameOver) return
    
    setPlayerX(x => x + (targetX - x) * 0.2)
    setPlayerY(y => y + (targetY - y) * 0.2) // Smooth vertical movement
  })  // Player movement (left/right and up/down)
  // Using useEffect instead of useState for event listeners
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Restart game with R key - moved outside the gameStarted check
      if (e.key === 'r' && gameOver) {
        window.location.reload()
        return
      }

      if (!gameStarted || gameOver) return
      
      // Horizontal movement - fixing inverted controls based on player perspective
      if (e.key === 'a' || e.key === 'ArrowLeft') 
        setTargetX(x => Math.min(x + 2, ROAD_WIDTH/2 - 1)) // Move right from player's perspective
      if (e.key === 'd' || e.key === 'ArrowRight') 
        setTargetX(x => Math.max(x - 2, -ROAD_WIDTH/2 + 1)) // Move left from player's perspective
      
      // Vertical movement
      if (e.key === 'w' || e.key === 'ArrowUp') 
        setTargetY(y => Math.min(y + 1.5, 4)) // Maximum height
      if (e.key === 's' || e.key === 'ArrowDown') 
        setTargetY(y => Math.max(y - 1.5, PLAYER_SIZE/2)) // Minimum height (road level)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [gameStarted, gameOver]) // Add dependencies

  // Collision detection, scoring, and recycling
  useFrame(() => {
    if (!gameStarted || gameOver) return
    
    // Increase difficulty based on time
    const now = Date.now()
    if (now - lastDifficultyIncrease.current > DIFFICULTY_INCREASE_INTERVAL) {
      lastDifficultyIncrease.current = now
      const newDifficulty = Math.min(difficultyState + 0.5, 5) // Max difficulty of 5
      setDifficultyState(newDifficulty)
      if (setDifficulty) setDifficulty(newDifficulty)
    }
    
    // Player position in world
    const p = runnerProgress.current
    const pos = spline.getPointAt(p)
    const playerPos = pos.clone()
    playerPos.x += playerX
    playerPos.y = playerY // Use player's vertical position
    
    // Coins
    setCoins(coins => coins.map(coin => {
      if (!coin.collected && coin.pos.distanceTo(playerPos) < 1) {
        const newScore = score + 1
        updateScore(newScore)
        setScore(newScore)
        
        // Increase difficulty based on points
        if (newScore % DIFFICULTY_POINT_THRESHOLD === 0) {
          const newDifficulty = Math.min(difficultyState + 0.5, 5)
          setDifficultyState(newDifficulty)
          if (setDifficulty) setDifficulty(newDifficulty)
          lastDifficultyIncrease.current = now
        }
        
        return { ...coin, collected: true }
      }
      // Recycle coin if behind player
      if (coin.pos.z < pos.z - 10) {
        const newZ = pos.z + 400 + Math.random() * 100
        return { 
          ...coin, 
          pos: new THREE.Vector3(
            (Math.random() - 0.5) * (ROAD_WIDTH - 2), 
            PLAYER_SIZE/2 + Math.random() * 2, // Random height
            newZ
          ), 
          collected: false 
        }
      }
      return coin
    }))
    
    // JB Foods
    setJbFoods(foods => foods.map(food => {
      if (!food.collected && food.pos.distanceTo(playerPos) < 1) {
        const newScore = score + 3 // JB Foods are worth more points
        updateScore(newScore)
        setScore(newScore)
        
        // Increase difficulty based on points
        if (newScore % DIFFICULTY_POINT_THRESHOLD === 0) {
          const newDifficulty = Math.min(difficultyState + 0.5, 5)
          setDifficultyState(newDifficulty)
          if (setDifficulty) setDifficulty(newDifficulty)
          lastDifficultyIncrease.current = now
        }
        
        return { ...food, collected: true }
      }
      // Recycle food if behind player
      if (food.pos.z < pos.z - 10) {
        const newZ = pos.z + 400 + Math.random() * 100
        return { 
          ...food, 
          pos: new THREE.Vector3(
            (Math.random() - 0.5) * (ROAD_WIDTH - 2), 
            PLAYER_SIZE/2 + Math.random() * 2.5, // Random height
            newZ
          ), 
          collected: false,
          type: Math.floor(Math.random() * 5) // Different food types
        }
      }
      return food
    }))
    
    // Obstacles
    setObstacles(obstacles => obstacles.map(obs => {
      if (!obs.hit && obs.pos.distanceTo(playerPos) < 1) {
        setGameOverState(true)
        setGameOver(true)
        return { ...obs, hit: true }
      }
      // Recycle obstacle if behind player
      if (obs.pos.z < pos.z - 10) {
        const newZ = pos.z + 400 + Math.random() * 100
        return { 
          ...obs, 
          pos: new THREE.Vector3(
            (Math.random() - 0.5) * (ROAD_WIDTH - 2), 
            PLAYER_SIZE/2 + Math.random() * (difficultyState * 0.5), // Higher difficulty = higher obstacles
            newZ
          ), 
          hit: false 
        }
      }
      return obs
    }))
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
        {/* Road mesh */}
        <mesh geometry={roadGeometry} receiveShadow>
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} side={THREE.DoubleSide} />
        </mesh>
        {/* Player */}
        {gameStarted && !gameOver && (
          <mesh position={[playerX, playerY, runnerProgress.current * 500]} castShadow>
            {player.avatar === 'cube' && (
              <boxGeometry args={[PLAYER_SIZE, PLAYER_SIZE, PLAYER_SIZE]} />
            )}
            {player.avatar === 'sphere' && (
              <sphereGeometry args={[PLAYER_SIZE/2, 16, 16]} />
            )}
            {player.avatar === 'car' && (
              <group>
                <mesh position={[0, -0.1, 0]}>
                  <boxGeometry args={[PLAYER_SIZE, PLAYER_SIZE/2, PLAYER_SIZE*1.5]} />
                  <meshStandardMaterial color={player.color} />
                </mesh>
                <mesh position={[0, PLAYER_SIZE/3, 0]}>
                  <boxGeometry args={[PLAYER_SIZE*0.8, PLAYER_SIZE/3, PLAYER_SIZE]} />
                  <meshStandardMaterial color={player.color} />
                </mesh>
                <mesh position={[-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE/2]}>
                  <sphereGeometry args={[PLAYER_SIZE/5, 8, 8]} />
                  <meshStandardMaterial color="#222" />
                </mesh>
                <mesh position={[PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE/2]}>
                  <sphereGeometry args={[PLAYER_SIZE/5, 8, 8]} />
                  <meshStandardMaterial color="#222" />
                </mesh>
                <mesh position={[-PLAYER_SIZE/2, -PLAYER_SIZE/2, -PLAYER_SIZE/2]}>
                  <sphereGeometry args={[PLAYER_SIZE/5, 8, 8]} />
                  <meshStandardMaterial color="#222" />
                </mesh>
                <mesh position={[PLAYER_SIZE/2, -PLAYER_SIZE/2, -PLAYER_SIZE/2]}>
                  <sphereGeometry args={[PLAYER_SIZE/5, 8, 8]} />
                  <meshStandardMaterial color="#222" />
                </mesh>
              </group>
            )}
            {!player.avatar && (
              <boxGeometry args={[PLAYER_SIZE, PLAYER_SIZE, PLAYER_SIZE]} />
            )}
            <meshStandardMaterial color={player.color} />
          </mesh>
        )}
        {/* Obstacles */}
        {obstacles.map(obs =>
          !obs.hit && (
            <mesh key={obs.id} position={[obs.pos.x, obs.pos.y, obs.pos.z]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#ff9900" />
            </mesh>
          )
        )}
        {/* Coins */}
        {coins.map(coin =>
          !coin.collected && (
            <mesh key={coin.id} position={[coin.pos.x, coin.pos.y, coin.pos.z]}>
              <sphereGeometry args={[0.4, 16, 16]} />
              <meshStandardMaterial color="#ffd700" />
            </mesh>
          )
        )}
        
        {/* JB Foods */}
        {jbFoods.map(food =>
          !food.collected && (
            <group key={food.id} position={[food.pos.x, food.pos.y, food.pos.z]}>
              {food.type === 0 && (
                <mesh>
                  <boxGeometry args={[0.6, 0.3, 0.6]} />
                  <meshStandardMaterial color="#8B4513" /> {/* Burger */}
                </mesh>
              )}
              {food.type === 1 && (
                <mesh>
                  <cylinderGeometry args={[0.3, 0.3, 0.7, 16]} />
                  <meshStandardMaterial color="#FF6347" /> {/* Hotdog */}
                </mesh>
              )}
              {food.type === 2 && (
                <mesh>
                  <cylinderGeometry args={[0.4, 0.0, 0.8, 16]} />
                  <meshStandardMaterial color="#FFD700" /> {/* Pizza */}
                </mesh>
              )}
              {food.type === 3 && (
                <mesh>
                  <boxGeometry args={[0.5, 0.5, 0.5]} />
                  <meshStandardMaterial color="#87CEFA" /> {/* Drink */}
                </mesh>
              )}
              {food.type === 4 && (
                <mesh>
                  <boxGeometry args={[0.4, 0.2, 0.6]} />
                  <meshStandardMaterial color="#F5DEB3" /> {/* Fries */}
                </mesh>
              )}
            </group>
          )
        )}
        {/* Floating boxes */}
        {boxes.map((box, index) => (
          <primitive key={index} object={box} ref={(el: THREE.Object3D | null) => { boxesRef.current[index] = el!; }} />
        ))}
      </group>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <spotLight
        position={[0, 20, 0]}
        angle={0.3}
        penumbra={0.5}
        intensity={0.5}
        castShadow
      />
      <Environment preset="sunset" />
    </>
  )
}
