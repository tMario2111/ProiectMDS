import {useEffect, useRef, useState} from 'react'
import './Game.css'

import {BLACK, Chess, WHITE} from "chess.js";
import {Chessboard} from "react-chessboard";
import {useParams} from "react-router-dom";
import {getConnection, getUsername, registerHandler} from "./connection.js";

function Game() {
    const [game, setGame] = useState(new Chess());

    const {code} = useParams();

    const [whiteUsername, setWhiteUsername] = useState('');
    const [blackUsername, setBlackUsername] = useState('');

    const color = useRef('');

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

                if (getUsername() === data['whiteUsername'])
                    color.current = WHITE;
                else
                    color.current = BLACK;

            } catch (error) {
                console.error(error)
            }
        }

        fetchGame();

        const cleanup = registerHandler("GetMove", (move) => {
            if (move["color"] === 'white' && color.current === WHITE)
                return;
            if (move["color"] === 'black' && color.current === BLACK)
                return;
            
            console.log(move["sourceSquare"] + " " + move["destinationSquare"]);

            makeAMove({
                from: move["sourceSquare"],
                to: move["destinationSquare"],
            });
        });

        return () => {
            cleanup();
        }
    }, [code]);

    function makeAMove(move) {
        const gameCopy = {...game};
        const result = gameCopy.move(move);
        setGame(gameCopy);
        return result;
    }

    function onDrop(sourceSquare, targetSquare) {
        if (game.turn() !== color.current)
            return false;

        const move = makeAMove({
            from: sourceSquare,
            to: targetSquare,
        });

        if (move !== null) {
            const connection = getConnection();
            connection.invoke("MakeMove", {
                GameCode: code,
                SourceSquare: sourceSquare,
                DestinationSquare: targetSquare,
            });
        }

        return move !== null;
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