# JB Foods Runner

An exciting endless-runner game built with React, TypeScript, and Three.js where you collect JB Foods items while avoiding obstacles.

## Features

- Multiple avatar options (cube, sphere, car)
- Full 3D movement (up, down, left, right)
- JB Foods collectibles that give bonus points
- Progressive difficulty system
- High score tracking
- Settings customization

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd endless-runner
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## How to Play

- Use **A/D** or **Arrow Left/Right** keys to move left and right
- Use **W/S** or **Arrow Up/Down** keys to move up and down
- Collect coins (1 point) and JB Foods items (3 points)
- Avoid obstacles
- Try to get the highest score possible!

## Game Controls

- **Left/Right**: A/D keys or Left/Right arrow keys
- **Up/Down**: W/S keys or Up/Down arrow keys  
- **Restart**: R key (after game over)
- **Pause**: Click the Pause button (top-left corner)

## Technology Stack

- React
- TypeScript
- Three.js (React Three Fiber)
- Vite

## Project Structure

- `src/App.tsx`: Main application component
- `src/components/Scene.tsx`: Sets up the Three.js canvas
- `src/components/Road.tsx`: Core gameplay component

## Development

1. Build the project:
```bash
npm run build
```

For more detailed information, check the [DOCUMENTATION.md](./DOCUMENTATION.md) file.

## Acknowledgements

- JB Foods brand imagery used with permission
- Built with React Three Fiber (https://github.com/pmndrs/react-three-fiber)
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
