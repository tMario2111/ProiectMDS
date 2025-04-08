import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

function GameCreation() {
    const { code } = useParams();

    return <>
        <div class="center d-flex flex-column justify-content-center align-items-center">
            <h1 class="mb-5">Create a game</h1>
            <p>Game code: {code}</p>
            <p>Link to join game: <a
                href='http://localhost:5173/game/join/{code}'>http://localhost:5173/game/join/{code}</a></p>
        </div>
    </>
}

export default GameCreation