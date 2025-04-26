import {useEffect, useState} from 'react'
import './Game.css'

import {Chess} from "chess.js";
import {Chessboard} from "react-chessboard";
import {useParams} from "react-router-dom";
import {getUsername} from "./connection.js";

function Game() {
    const [game, setGame] = useState(new Chess());

    const {code} = useParams();

    const [whiteUsername, setWhiteUsername] = useState('');
    const [blackUsername, setBlackUsername] = useState('');

    // TODO: This get request executes twice
    useEffect(() => {
        const fetchGame = async () => {
            try {
                const response =
                    await fetch(`https://localhost:7008/api/get-game?gameCode=${encodeURIComponent(code)}`);

                if (!response.ok) {
                    console.error(response);
                    return;
                }

                const data = await response.json();
                setWhiteUsername(data['whiteUsername']);
                setBlackUsername(data['blackUsername']);
            } catch (error) {
                console.error(error)
            }
        }

        fetchGame();
    }, [code]);

    function makeAMove(move) {
        const gameCopy = {...game};
        const result = gameCopy.move(move);
        setGame(gameCopy);
        return result; // null if the move was illegal, the move object if the move was legal
    }

    function makeRandomMove() {
        const possibleMoves = game.moves();
        if (game.game_over() || game.in_draw() || possibleMoves.length === 0)
            return; // exit if the game is over
        const randomIndex = Math.floor(Math.random() * possibleMoves.length);
        makeAMove(possibleMoves[randomIndex]);
    }

    function onDrop(sourceSquare, targetSquare) {
        const move = makeAMove({
            from: sourceSquare,
            to: targetSquare,
            promotion: "q", // always promote to a queen for example simplicity
        });

        // illegal move
        if (move === null) return false;
        setTimeout(makeRandomMove, 200);
        return true;
    }

    return <>
        <div id="chessboard-div">
            <h1>{whiteUsername === getUsername() ? blackUsername : whiteUsername}</h1>
            <div className="chessboard-wrapper">
                <Chessboard boardWidth={600} position={game.fen()} onPieceDrop={onDrop} snapToCursor={true}
                            boardOrientation={whiteUsername === getUsername() ? 'white' : 'black'}/>
            </div>
            <h1>{getUsername()}</h1>
        </div>
    </>;
}

export default Game;