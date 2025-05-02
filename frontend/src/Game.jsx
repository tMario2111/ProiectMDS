import {useEffect, useRef, useState} from 'react'
import './Game.css'

import {BLACK, Chess, WHITE} from "chess.js";
import {Chessboard} from "react-chessboard";
import {useParams} from "react-router-dom";
import {getConnection, getUsername, registerHandler} from "./connection.js";
import Clock from "./components/Clock.jsx";

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

            if (move["promotion"] == null) {
                console.log(move["sourceSquare"] + " " + move["destinationSquare"]);
                makeAMove({
                    from: move["sourceSquare"],
                    to: move["destinationSquare"],
                });
            } else {
                console.log(move["sourceSquare"] + " " + move["destinationSquare"] + " " + move["promotion"]);
                makeAMove({
                    from: move["sourceSquare"],
                    to: move["destinationSquare"],
                    promotion: move["promotion"].toLowerCase(),
                })
            }
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

    function onDrop(sourceSquare, targetSquare, piece) {
        if (game.turn() !== color.current)
            return false;

        // Got here
        // TODO: Handle promotion server-side
        let promotion = null;
        if (game.get(sourceSquare).type !== piece[1].toLowerCase()) {
            promotion = piece[1].toUpperCase() ?? "Q";
        }

        const move = makeAMove({
            from: sourceSquare,
            to: targetSquare,
            promotion: piece[1].toLowerCase() ?? "q",
        });

        if (move !== null) {
            const connection = getConnection();
            connection.invoke("MakeMove", {
                GameCode: code,
                SourceSquare: sourceSquare,
                DestinationSquare: targetSquare,
                Promotion: promotion,
            });
        }

        return move !== null;
    }

    // Time is hardcoded for now
    return <>
        <div id="chessboard-div">
            <div className="d-flex flex-row align-items-center justify-content-between w-25">
                <h1>{whiteUsername === getUsername() ? blackUsername : whiteUsername}</h1>
                <Clock timeLimit={180}/>
            </div>
            <div className="chessboard-wrapper">
                <Chessboard boardWidth={600} position={game.fen()} onPieceDrop={onDrop} snapToCursor={true}
                            boardOrientation={whiteUsername === getUsername() ? 'white' : 'black'}/>
            </div>
            <div className="d-flex flex-row align-items-center justify-content-between w-25">
                <h1>{getUsername()}</h1>
                <Clock timeLimit={180}/>
            </div>
        </div>
    </>
}

export default Game;