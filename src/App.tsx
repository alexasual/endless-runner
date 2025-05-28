import Scene from './components/Scene'
import './App.css'
import { useState, useEffect } from 'react'

// Define types for our settings and player options
interface Player {
  name: string
  color: string
  avatar: string
}

interface GameSettings {
  theme: 'modern' | 'retro' | 'futuristic'
  difficulty: 'easy' | 'normal' | 'hard'
  musicVolume: number
}

const PLAYER_OPTIONS: Player[] = [
  { name: 'Red Cube', color: '#ff3333', avatar: 'cube' },
  { name: 'Green Sphere', color: '#33ff33', avatar: 'sphere' },
  { name: 'Blue Car', color: '#3333ff', avatar: 'car' },
  { name: 'Yellow Cube', color: '#ffff33', avatar: 'cube' },
  { name: 'Purple Sphere', color: '#9933ff', avatar: 'sphere' }
]

const SETTINGS: GameSettings = {
  theme: 'modern',
  difficulty: 'normal',
  musicVolume: 0.7
}

function App() {
  const [player, setPlayer] = useState(PLAYER_OPTIONS[0])
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState(SETTINGS)
  const [highScore, setHighScore] = useState(0)

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('highScore')
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10))
    }
  }, [])

  // Save high score to localStorage when game over
  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score)
      localStorage.setItem('highScore', score.toString())
    }
  }, [gameOver, score, highScore])

  const handleStartGame = () => {
    setGameStarted(true)
    setGameOver(false)
    setScore(0)
  }
  
  const handleSettingsToggle = () => {
    setShowSettings(!showSettings)
  }
  
  const updateSetting = (key: keyof GameSettings, value: string | number) => {
    setSettings({
      ...settings,
      [key]: value
    })
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Main Menu */}
      {!gameStarted && !gameOver && (
        <div style={{ 
          position: 'absolute', 
          zIndex: 10, 
          left: '50%', 
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(34, 34, 34, 0.9)', 
          color: '#fff', 
          padding: 30, 
          borderRadius: 12,
          minWidth: '400px',
          textAlign: 'center'
        }}>
          <h1 style={{ marginTop: 0 }}>JB Foods Runner</h1>
          
          {showSettings ? (
            <div>
              <h2>Settings</h2>
              <div style={{ marginBottom: 20 }}>
                <div style={{ marginBottom: 10 }}>Theme</div>
                <div>
                  {['modern', 'retro', 'futuristic'].map(theme => (
                    <button
                      key={theme}
                      style={{ 
                        background: settings.theme === theme ? '#4477FF' : '#444', 
                        color: '#fff', 
                        margin: 5, 
                        padding: 8, 
                        border: 'none', 
                        borderRadius: 6, 
                        cursor: 'pointer' 
                      }}
                      onClick={() => updateSetting('theme', theme)}
                    >
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <div style={{ marginBottom: 10 }}>Difficulty</div>
                <div>
                  {['easy', 'normal', 'hard'].map(diff => (
                    <button
                      key={diff}
                      style={{ 
                        background: settings.difficulty === diff ? '#4477FF' : '#444', 
                        color: '#fff', 
                        margin: 5, 
                        padding: 8, 
                        border: 'none', 
                        borderRadius: 6, 
                        cursor: 'pointer' 
                      }}
                      onClick={() => updateSetting('difficulty', diff)}
                    >
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <div style={{ marginBottom: 10 }}>Music Volume: {Math.round(settings.musicVolume * 100)}%</div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.musicVolume}
                  onChange={(e) => updateSetting('musicVolume', parseFloat(e.target.value))}
                  style={{ width: '80%' }}
                />
              </div>
              
              <button 
                onClick={handleSettingsToggle}
                style={{ 
                  background: '#444',
                  color: '#fff', 
                  padding: 10, 
                  borderRadius: 6, 
                  border: 'none', 
                  cursor: 'pointer',
                  marginTop: 10 
                }}
              >
                Back
              </button>
            </div>
          ) : (
            <>
              <h2>Select Your Avatar</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
                {PLAYER_OPTIONS.map(opt => (
                  <button
                    key={opt.name}
                    style={{ 
                      background: opt.color, 
                      color: '#fff', 
                      margin: 8, 
                      padding: 12, 
                      border: player.name === opt.name ? '3px solid white' : 'none', 
                      borderRadius: 6, 
                      fontWeight: 'bold', 
                      cursor: 'pointer',
                      boxShadow: player.name === opt.name ? '0 0 10px white' : 'none'
                    }}
                    onClick={() => setPlayer(opt)}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
              
              <div style={{ marginTop: 20 }}>
                <button 
                  onClick={handleStartGame} 
                  style={{ 
                    padding: 14, 
                    fontSize: 18, 
                    fontWeight: 'bold', 
                    borderRadius: 8, 
                    background: '#4CAF50', 
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    marginRight: 10
                  }}
                >
                  Start Game
                </button>
                
                <button 
                  onClick={handleSettingsToggle}
                  style={{ 
                    padding: 14, 
                    fontSize: 18, 
                    fontWeight: 'bold', 
                    borderRadius: 8, 
                    background: '#555', 
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Settings
                </button>
              </div>
              
              <div style={{ marginTop: 20, fontSize: 14 }}>
                <div>Controls: Arrow keys or WASD to move</div>
                <div>Collect coins and JB Foods for points!</div>
                <div>High Score: {highScore}</div>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Score Display */}
      {gameStarted && (
        <div style={{ 
          position: 'absolute', 
          zIndex: 10, 
          right: 20, 
          top: 20, 
          background: 'rgba(34, 34, 34, 0.7)', 
          color: '#fff', 
          padding: 16, 
          borderRadius: 8, 
          fontSize: 24,
          fontWeight: 'bold'
        }}>
          Score: {score}
          <div style={{ fontSize: 14, fontWeight: 'normal' }}>High Score: {highScore}</div>
        </div>
      )}
      
      {/* Pause Button */}
      {gameStarted && !gameOver && (
        <button
          style={{ 
            position: 'absolute', 
            zIndex: 10, 
            left: 20, 
            top: 20, 
            background: 'rgba(34, 34, 34, 0.7)', 
            color: '#fff', 
            padding: 10, 
            borderRadius: 8, 
            border: 'none',
            cursor: 'pointer'
          }}
          onClick={() => {
            setGameStarted(false)
          }}
        >
          Pause
        </button>
      )}
      
      <Scene 
        player={player} 
        setScore={setScore} 
        gameStarted={gameStarted} 
        setGameOver={setGameOver}
      />
    </div>
  )
}

export default App