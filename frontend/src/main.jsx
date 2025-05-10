import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css'

import Game from './Game.jsx'
import Home from './Home.jsx'
import GameCreation from './GameCreation.jsx';
import {startConnection} from "./connection.js";
import {getToken} from "./Auth.js";

function GameNotFound() {
  return <h1>Could not find game</h1>
}

const initialize = async () => {
    await getToken();
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
        <Route path="*" element={<GameNotFound/>}/>
      </Routes>
    </Router>
  </StrictMode>,
)
