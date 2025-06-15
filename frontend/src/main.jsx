import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css'

import Game from './Game.jsx'
import Home from './Home.jsx'
import GameCreation from './GameCreation.jsx';
import GameOver from './GameEnded.jsx'
import {startConnection} from "./connection.js";
import SpectateGame from "./SpectateGame.jsx";

function GameNotFound() {
  return <h1>Could not find game</h1>
}

const initialize = async () => {
    try {
        await startConnection();
    } catch (error) {
    }
};
initialize();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/game/:code" element={<Game/>}/>
        <Route path="/game/create/:code" element={<GameCreation/>}/>
          <Route path="/game/end/" element={<GameOver/>}/>
          <Route path="/game/spectate/:code" element={<SpectateGame/>}/>
        <Route path="*" element={<GameNotFound/>}/>
      </Routes>
    </Router>
  </StrictMode>,
)
