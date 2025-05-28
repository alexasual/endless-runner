import { Canvas } from '@react-three/fiber'
import Road from './Road'
import type { Dispatch, SetStateAction } from 'react'
import { useState, useEffect } from 'react'

interface SceneProps {
  player: { name: string; color: string; avatar: string }
  setScore: Dispatch<SetStateAction<number>>
  gameStarted: boolean
  setGameOver: Dispatch<SetStateAction<boolean>>
}

export default function Scene({ player, setScore, gameStarted, setGameOver }: SceneProps) {
  // These state values need to be passed from Road to Scene for UI display
  const [score, setLocalScore] = useState(0)
  const [gameOver, setLocalGameOver] = useState(false)
  const [difficulty, setDifficulty] = useState(1)

  // Update parent state when local state changes
  useEffect(() => {
    if (gameOver) {
      setGameOver(true)
    }
  }, [gameOver, setGameOver])

  // Handler for score updates from Road component
  const handleScoreUpdate = (newScore: number) => {
    setLocalScore(newScore)
    setScore(newScore)
  }

  // Handler for game over state from Road component
  const handleGameOver = (isOver: boolean) => {
    setLocalGameOver(isOver)
    setGameOver(isOver)
  }

  // Handler for difficulty updates from Road component
  const handleDifficultyUpdate = (newDifficulty: number) => {
    setDifficulty(newDifficulty)
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas>
        <Road 
          player={player} 
          setScore={handleScoreUpdate} 
          gameStarted={gameStarted} 
          setGameOver={handleGameOver}
          setDifficulty={handleDifficultyUpdate}
        />
      </Canvas>

      {/* Game Over UI */}
      {gameOver && (
        <div style={{ 
          position: 'absolute', 
          left: '50%', 
          top: '40%', 
          transform: 'translate(-50%, -50%)', 
          zIndex: 20, 
          background: 'rgba(34, 34, 34, 0.95)', 
          color: '#fff', 
          padding: 32, 
          borderRadius: 12, 
          fontSize: 32, 
          fontWeight: 'bold',
          textAlign: 'center',
          minWidth: '300px'
        }}>
          <div>Game Over!</div>
          <div style={{ fontSize: 24, margin: '10px 0' }}>Score: {score}</div>
          <div style={{ fontSize: 20, fontWeight: 'normal', marginTop: 10 }}>(Press R to Restart)</div>
        </div>
      )}
      
      {/* Controls Info */}
      {gameStarted && !gameOver && (
        <div style={{ 
          position: 'absolute', 
          left: '20px', 
          bottom: '20px', 
          zIndex: 20, 
          background: 'rgba(34, 34, 34, 0.7)', 
          color: '#fff', 
          padding: 12, 
          borderRadius: 8, 
          fontSize: 14
        }}>
          <div>Controls:</div>
          <div>← → or A/D: Move left/right</div>
          <div>↑ ↓ or W/S: Move up/down</div>
        </div>
      )}
      
      {/* Difficulty indicator */}
      {gameStarted && !gameOver && (
        <div style={{ 
          position: 'absolute', 
          right: '20px', 
          bottom: '20px', 
          zIndex: 20, 
          background: 'rgba(34, 34, 34, 0.7)', 
          color: '#fff', 
          padding: 12, 
          borderRadius: 8, 
          fontSize: 14
        }}>
          <div>Difficulty: {difficulty.toFixed(1)}</div>
        </div>
      )}
    </div>
  )
}
