import { useState, useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { usePortraitMode } from './PortraitMode';
import { Player } from './Player';
import { Obstacle } from './Obstacle';
import { Road } from './Road';
import { GameEffects } from './GameEffects';
import { Background } from './Background';
import { PowerUp } from './PowerUp';
import { ThirdPersonCamera } from './ThirdPersonCamera';
import { Box3, Object3D, Vector3, Mesh } from 'three';

// Custom event for game events
interface GameEvent {
  type: 'score' | 'gameover' | 'collision' | 'powerup';
  score?: number;
  position?: Vector3;
  powerupType?: string;
}

// Add debug mode for collision visualization
const DEBUG_COLLISION = false;

export function EndlessRunner() {
  const [gameSpeed, setGameSpeed] = useState(5);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [playerLane, setPlayerLane] = useState(1);
  const [hasShield, setHasShield] = useState(false);
  const [speedBoost, setSpeedBoost] = useState(false);
  const obstaclesRef = useRef<{lane: number, id: number, y: number, instance: Object3D | null, type: number}[]>([]);
  const powerUpsRef = useRef<{lane: number, id: number, y: number, instance: Mesh | null, type: 'shield' | 'speed' | 'score'}[]>([]);
  const playerRef = useRef<Mesh | null>(null);
  const frameCountRef = useRef(0);
  const lastObstacleTimeRef = useRef(0);
  const lastPowerUpTimeRef = useRef(0);
  const collisionBoxRef = useRef<Box3>(new Box3());
  // Add helper mesh for debug visualization
  const debugHelperRef = useRef<Mesh>(null);
  const { viewport } = useThree();
  const { isPortrait } = usePortraitMode();
  
  // Game settings
  const minObstacleInterval = 60; // frames between obstacles
  const initialObstacleInterval = 100; // more time before first obstacle
  const difficultyIncrease = 0.05; // speed increase per second
  
  // Lane width calculation
  const laneCount = 3;
  const laneWidth = useMemo(() => {
    return isPortrait ? viewport.width / (laneCount * 1.5) : viewport.width / (laneCount * 2);
  }, [isPortrait, viewport.width]);
  
  // Reset game function
  const resetGame = () => {
    setGameSpeed(5);
    setScore(0);
    setIsGameOver(false);
    obstaclesRef.current = [];
    powerUpsRef.current = [];
    lastObstacleTimeRef.current = 0;
    lastPowerUpTimeRef.current = 0;
    frameCountRef.current = 0;
    setPlayerLane(1); // Reset to center lane
    setHasShield(false);
    setSpeedBoost(false);
  };
    // Set up event listeners for game events
  useEffect(() => {
    const handleGameEvent = (e: CustomEvent<GameEvent>) => {
      if (e.detail.type === 'score') {
        setScore(prevScore => {
          const newScore = prevScore + (e.detail.score || 0);
          return newScore;
        });
      } else if (e.detail.type === 'gameover') {
        setIsGameOver(true);
      } else if (e.detail.type === 'powerup') {
        // Handle power-up collection
        if (e.detail.powerupType === 'shield') {
          setHasShield(true);
        } else if (e.detail.powerupType === 'speed') {
          setSpeedBoost(true);
          // Speed boost lasts for 5 seconds
          setTimeout(() => setSpeedBoost(false), 5000);
        } else if (e.detail.powerupType === 'score') {
          setScore(prevScore => prevScore + 50); // Extra score
        }
      }
    };
    
    // Add custom event listener
    window.addEventListener('game-event', handleGameEvent as EventListener);
    
    return () => {
      window.removeEventListener('game-event', handleGameEvent as EventListener);
    };
  }, []);
  
  // Handle player lane changes
  const handleLaneChange = (newLane: number) => {
    setPlayerLane(newLane);
  };
  
  // Handle game restart on click/tap after game over
  useEffect(() => {
    if (isGameOver) {
      const handleRestart = () => {
        resetGame();
      };
      
      // Short delay to prevent immediate restart
      const timer = setTimeout(() => {
        window.addEventListener('click', handleRestart);
        window.addEventListener('touchstart', handleRestart);
      }, 500);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('click', handleRestart);
        window.removeEventListener('touchstart', handleRestart);
      };
    }
  }, [isGameOver]);
  
  // Collision detection with improved precision
  const checkCollisions = () => {
    if (!playerRef.current || isGameOver) return;
    
    // Update player collision box - make it smaller than the visual model for more forgiving gameplay
    collisionBoxRef.current.setFromObject(playerRef.current);
    // Make the hitbox slightly smaller for more forgiving gameplay
    collisionBoxRef.current.min.multiply(new Vector3(0.8, 0.8, 1));
    collisionBoxRef.current.max.multiply(new Vector3(0.8, 0.8, 1));
    
    // Update debug helper if enabled
    if (DEBUG_COLLISION && debugHelperRef.current) {
      // Update helper box to match player hitbox
      const size = collisionBoxRef.current.getSize(new Vector3());
      const center = collisionBoxRef.current.getCenter(new Vector3());
      debugHelperRef.current.position.copy(center);
      debugHelperRef.current.scale.copy(size);
    }
    
    // Check each obstacle
    for (const obstacle of obstaclesRef.current) {
      if (obstacle.instance) {
        const obstacleBox = new Box3().setFromObject(obstacle.instance);
        
        // Adjust hitbox based on obstacle type for more accurate collisions
        if (obstacle.type === 1) { // Sphere - make hitbox smaller
          const sphereSize = obstacleBox.getSize(new Vector3()).multiplyScalar(0.8);
          const center = obstacleBox.getCenter(new Vector3());
          obstacleBox.setFromCenterAndSize(center, sphereSize);
        }
        
        if (collisionBoxRef.current.intersectsBox(obstacleBox)) {
          // Visual effect for collision
          const collisionPosition = obstacle.instance.position.clone();
          const collisionEvent = new CustomEvent('game-event', {
            detail: { 
              type: 'collision',
              position: collisionPosition
            }
          });
          window.dispatchEvent(collisionEvent);
          
          // If player has shield, consume it instead of game over
          if (hasShield) {
            setHasShield(false);
            // Remove the obstacle
            obstaclesRef.current = obstaclesRef.current.filter(o => o.id !== obstacle.id);
            return;
          }
          
          // Short delay before game over to show collision effects
          setTimeout(() => {
            // Trigger game over event
            const gameOverEvent = new CustomEvent('game-event', {
              detail: { type: 'gameover', score }
            });
            window.dispatchEvent(gameOverEvent);
          }, 100);
          
          return;
        }
      }
    }
    
    // Check each power-up
    for (const powerUp of powerUpsRef.current) {
      if (powerUp.instance) {
        const powerUpBox = new Box3().setFromObject(powerUp.instance);
        
        if (collisionBoxRef.current.intersectsBox(powerUpBox)) {
          // Emit power-up event
          const powerUpEvent = new CustomEvent('game-event', {
            detail: { 
              type: 'powerup',
              position: powerUp.instance.position.clone(),
              powerupType: powerUp.type
            }
          });
          window.dispatchEvent(powerUpEvent);
          
          // Remove the collected power-up
          powerUpsRef.current = powerUpsRef.current.filter(p => p.id !== powerUp.id);
        }
      }
    }
  };
  
  // Main game loop
  useFrame((_, delta) => {
    if (isGameOver) return;
    
    // Apply speed boost if active
    const effectiveSpeed = speedBoost ? gameSpeed * 1.5 : gameSpeed;
    
    // Update score - scale with game speed
    setScore(prev => prev + Math.floor(delta * 10 * effectiveSpeed));
    
    // Increase game speed over time, capped at a reasonable maximum
    setGameSpeed(prev => Math.min(prev + difficultyIncrease * delta, 20));      // Generate new obstacles
    frameCountRef.current++;
    const currentTime = frameCountRef.current;
    
    // Initial delay for first obstacle to give player time to prepare
    const interval = frameCountRef.current < initialObstacleInterval 
      ? initialObstacleInterval 
      : minObstacleInterval / (effectiveSpeed / 5);
      
    if (currentTime - lastObstacleTimeRef.current > interval) {
      // Add a new obstacle in a random lane
      // Avoid putting obstacles in the same lane twice in a row if possible
      let lane = Math.floor(Math.random() * laneCount);
      
      // Try to generate a different lane if the previous obstacle was in the same lane
      // and we're still early in the game
      if (obstaclesRef.current.length > 0 && 
          obstaclesRef.current[obstaclesRef.current.length - 1].lane === lane &&
          gameSpeed < 15) {
        lane = (lane + 1 + Math.floor(Math.random() * (laneCount - 1))) % laneCount;
      }
      
      const id = Date.now() + Math.random();
      const obstacleType = Math.floor(Math.random() * 3); // 0=box, 1=sphere, 2=cone
      
      obstaclesRef.current.push({
        lane,
        id,
        y: viewport.height, // Start from top of screen instead of bottom
        instance: null,
        type: obstacleType
      });
      
      lastObstacleTimeRef.current = currentTime;
    }
    
    // Generate new power-ups (lower frequency than obstacles)
    const powerUpChance = 0.002; // 0.2% chance per frame
    if (Math.random() < powerUpChance && currentTime - lastPowerUpTimeRef.current > 120) {
      // Decide power-up type
      let powerUpType: 'shield' | 'speed' | 'score';
      const typeRoll = Math.random();
      
      if (typeRoll < 0.4) {
        powerUpType = 'shield';
      } else if (typeRoll < 0.8) {
        powerUpType = 'speed';
      } else {
        powerUpType = 'score';
      }
      
      // Select a lane that doesn't have an obstacle near it if possible
      let lane = Math.floor(Math.random() * laneCount);
      const laneHasObstacle = obstaclesRef.current.some(
        o => o.lane === lane && o.y > -viewport.height * 0.3 && o.y < -viewport.height * 0.1
      );
      
      if (laneHasObstacle) {
        // Try to pick a different lane
        for (let i = 0; i < laneCount; i++) {
          const alternateLane = (lane + i) % laneCount;
          const hasObstacle = obstaclesRef.current.some(
            o => o.lane === alternateLane && o.y > -viewport.height * 0.3 && o.y < -viewport.height * 0.1
          );
          
          if (!hasObstacle) {
            lane = alternateLane;
            break;
          }
        }
      }
      
      const id = Date.now() + Math.random();
        powerUpsRef.current.push({
        lane,
        id,
        y: viewport.height, // Start from top of screen
        instance: null,
        type: powerUpType
      });
      
      lastPowerUpTimeRef.current = currentTime;
    }
      // Update obstacle positions
    obstaclesRef.current.forEach(obstacle => {
      // Move obstacle based on game speed (downward)
      obstacle.y -= effectiveSpeed * delta;
    });
    
    // Update power-up positions
    powerUpsRef.current.forEach(powerUp => {
      // Move power-up based on game speed (downward)
      powerUp.y -= effectiveSpeed * delta;
    });    // Remove obstacles that are off-screen (far below the player)
    obstaclesRef.current = obstaclesRef.current.filter(
      obstacle => obstacle.y > -viewport.height * 0.8
    );
    
    // Remove power-ups that are off-screen (far below the player)
    powerUpsRef.current = powerUpsRef.current.filter(
      powerUp => powerUp.y > -viewport.height * 0.8
    );
    
    // Check for collisions
    checkCollisions();
  });
  
  // Set an obstacle reference
  const setObstacleInstance = (id: number, instance: Object3D | null, type: number) => {
    const obstacle = obstaclesRef.current.find(o => o.id === id);
    if (obstacle) {
      obstacle.instance = instance;
      obstacle.type = type;
    }
  };

  // Set a power-up reference
  const setPowerUpInstance = (id: number, instance: Mesh | null) => {
    const powerUp = powerUpsRef.current.find(p => p.id === id);
    if (powerUp && instance) {
      powerUp.instance = instance;
    }
  };

  // Display active obstacles
  const obstacles = obstaclesRef.current.map(obstacle => (
    <Obstacle
      key={obstacle.id}
      id={obstacle.id}
      lane={obstacle.lane}
      position={[0, obstacle.y, 0]}
      speed={gameSpeed}
      laneWidth={laneWidth}
      setRef={setObstacleInstance}
      type={obstacle.type}
    />
  ));

  // Display active power-ups
  const powerUps = powerUpsRef.current.map(powerUp => (
    <PowerUp
      key={powerUp.id}
      id={powerUp.id}
      lane={powerUp.lane}
      position={[0, powerUp.y, 0]}
      laneWidth={laneWidth}
      type={powerUp.type}
      setRef={setPowerUpInstance}
    />
  ));  return (
    <>
      {/* Background with dynamic visuals based on score */}
      <Background speed={gameSpeed} score={score} />
      
      <Road speed={gameSpeed} />
      {obstacles}
      {powerUps}      <Player 
        ref={playerRef}
        lane={playerLane}
        onLaneChange={handleLaneChange}
        speed={15}
        laneWidth={laneWidth}
        isGameOver={isGameOver}
        hasShield={hasShield}
      />
        {/* Third-person camera that follows the player */}
      {playerRef.current && (
        <ThirdPersonCamera 
          target={playerRef.current} 
          distance={4}
          height={5}
          offset={new Vector3(0, 1, 0)}
          lookOffset={new Vector3(0, 2, 0)}
          damping={3}
        />
      )}
      
      {/* Visual effects system */}
      <GameEffects />
      
      {/* Collision debug helper - only visible in debug mode */}
      {DEBUG_COLLISION && (
        <mesh ref={debugHelperRef} position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#ff0000" wireframe={true} transparent opacity={0.5} />
        </mesh>
      )}
    </>
  );
}
