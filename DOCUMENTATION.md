# JB Foods Runner - Game Documentation

## Overview

JB Foods Runner is an endless-runner game built with React and Three.js (React Three Fiber). The player controls an avatar that moves along a road, collecting coins and JB Foods items while avoiding obstacles. The game features increasing difficulty, various avatar options, and a scoring system.

## Game Features

### 1. Player and Settings

- **Avatar Selection**: Players can choose from multiple avatars with different shapes and colors (cube, sphere, car)
- **Settings**: Customizable game settings including theme, difficulty, and music volume
- **High Score Tracking**: The game tracks and displays the player's high score

### 2. Gameplay Elements

- **Movement System**: 
  - Left/Right movement (A/D or arrow keys)
  - Up/Down movement (W/S or arrow keys)
  - Smooth animation with interpolation

- **Collectibles**: 
  - Regular coins (1 point each)
  - JB Foods items (3 points each):
    - Burgers
    - Hotdogs
    - Pizza
    - Drinks
    - Fries

- **Obstacles**:
  - Various obstacles placed throughout the road
  - Collision detection for game over state

- **Difficulty System**:
  - Progressive difficulty increases based on:
    - Time passed (every 30 seconds)
    - Points scored (every 10 points)
  - Higher difficulty means more obstacles, faster speed, and more challenging gameplay

### 3. UI Elements

- **Main Menu**:
  - Avatar selection
  - Game settings
  - Start game button
  - Controls information
  - High score display

- **In-Game UI**:
  - Score counter
  - Difficulty indicator
  - Controls reminder
  - Pause button

- **Game Over Screen**:
  - Final score display
  - Restart option (R key)
  - High score update

## Implementation Details

### Core Components

1. **App.tsx**: 
   - Main application component
   - Manages game state (started, over)
   - Handles player selection and settings
   - Renders UI overlays

2. **Scene.tsx**:
   - Sets up the Three.js canvas
   - Passes props to the Road component

3. **Road.tsx**:
   - Core gameplay component
   - Handles road generation and rendering
   - Manages player movement, collision detection
   - Implements game logic for collectibles and obstacles
   - Controls difficulty progression

### Technical Features

- **Infinite Road**: The road is generated procedurally and loops infinitely
- **Parallel Transport Frames**: Used for stable orientation along the spline
- **Collision Detection**: Real-time collision detection between player and game objects
- **Object Recycling**: Game objects (obstacles, collectibles) are recycled for performance
- **Local Storage**: High scores are saved to localStorage

## Controls

- **Left/Right**: A/D keys or Left/Right arrow keys
- **Up/Down**: W/S keys or Up/Down arrow keys
- **Restart**: R key (after game over)
- **Pause**: Pause button (top-left corner)

## Future Improvements

- Add sound effects and background music
- Implement power-ups (invincibility, score multipliers)
- Add more diverse environments and themes
- Create a leaderboard system
- Add mobile touch controls
- Implement more avatar customization options
