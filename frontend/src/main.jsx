import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css'

import App from './App.jsx'
import Home from './Home.jsx'
import GameCreation from './GameCreation.jsx';

function GameNotFound() {
  return <h1>Could not find game</h1>
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/game/:code" element={<App/>}/>
        <Route path="/game/create/:code" element={<GameCreation/>}/>
        <Route path="*" element={<GameNotFound/>}/>
      </Routes>
    </Router>
  </StrictMode>,
)
