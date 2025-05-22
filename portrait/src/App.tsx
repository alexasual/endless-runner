import './App.css';
import { Canvas } from './components/Canvas';
import { Scene } from './components/Scene';

// Simplified App component just showing the road
function App() {
  return (
    <div className="App">
      <Canvas>
        <Scene />
      </Canvas>
    </div>
  );
}

export default App;
