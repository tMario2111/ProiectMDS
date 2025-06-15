import {useEffect, useRef, useState} from 'react'
import './Game.css'

import {BLACK, Chess, WHITE} from "chess.js";
import {Chessboard} from "react-chessboard";
import {useNavigate, useParams} from "react-router-dom";
import {getConnection, getUsername, registerHandler} from "./connection.js";
import Clock from "./components/Clock.jsx";
import GameOver from './GameEnded.jsx'

// ---- ChatBox component ----
function ChatBox({gameId, username}) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef();

    useEffect(() => {
        const cleanup = registerHandler("ReceiveChatMessage", (msg) => {
            setMessages(prev => [...prev, msg]);
        });
        return () => cleanup();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages]);

    const sendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed) return;
        setInput("");
        const connection = getConnection();
        await connection.invoke("SendChatMessage", gameId, username || "Spectator", trimmed);
    };

    const chatContainerStyle = {
        background: "#f4ecd3",
        borderRadius: "14px",
        boxShadow: "0 2px 16px #bdb08d33",
        padding: "18px 14px 12px 14px",
        minWidth: 280,
        maxWidth: 320,
        width: 300,
        maxHeight: 470,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end"
    };
    const chatMessagesStyle = {
        flex: 1,
        overflowY: "auto",
        marginBottom: 10,
        maxHeight: 350
    };
    const chatInputRowStyle = {
        display: "flex",
        gap: 8
    };
    const chatInputStyle = {
        flex: 1,
        borderRadius: 8,
        border: "1px solid #e6dec3",
        padding: "6px 10px",
        fontSize: 15
    };
    const chatSendStyle = {
        background: "#e4c77b",
        border: "none",
        borderRadius: 8,
        padding: "6px 18px",
        color: "#21201a",
        fontWeight: 700,
        cursor: "pointer"
    };

    return (
        <div style={chatContainerStyle}>
            <div style={chatMessagesStyle}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{marginBottom: 4}}>
                        <span style={{fontWeight: 600, color: "#bfa14a"}}>{msg.sender}</span>
                        <span style={{color: "#6e6142", marginLeft: 7}}>{msg.message}</span>
                    </div>
                ))}
                <div ref={messagesEndRef}/>
            </div>
            <div style={chatInputRowStyle}>
                <input
                    style={chatInputStyle}
                    placeholder="Type a message..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if(e.key === "Enter") sendMessage(); }}
                />
                <button style={chatSendStyle} onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
}
// ---- End ChatBox ----

const boardContainerStyle = {
    background: 'linear-gradient(135deg, #f7f4ed 0%, #e4e0d1 100%)',
    borderRadius: '32px',
    boxShadow: '0 8px 40px #a3926a22',
    padding: '24px',
    margin: '32px 0'
};
const playerNameStyle = {
    fontFamily: "'Montserrat', 'Lato', sans-serif",
    fontWeight: 700,
    fontSize: '1.3rem',
    color: '#7a6b4f',
    letterSpacing: '1px',
    margin: 0,
    textAlign: 'center'
};
const clockBoxStyle = {
    background: '#f4ecd3',
    borderRadius: '14px',
    boxShadow: '0 2px 16px #bdb08d33',
    padding: '13px 32px',
    minWidth: '105px',
    fontFamily: "'Montserrat', 'Lato', sans-serif",
    color: '#523f20',
    fontWeight: 700,
    fontSize: '2rem',
    margin: '8px 0'
};
const sideColumnStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '160px',
    gap: '10px'
};
const pageStyle = {
    background: 'linear-gradient(120deg, #f3eee1 0%, #f9f8f6 100%)',
    minHeight: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
};
const accentStyle = {
    color: '#bfa14a'
};

function Game() {
    const initialFen = window._customFen;
    const [game, setGame] = useState(initialFen ? new Chess(initialFen) : new Chess());

    const {code} = useParams();
    const navigate = useNavigate();

    const [whiteUsername, setWhiteUsername] = useState('');
    const [blackUsername, setBlackUsername] = useState('');

    const color = useRef('');

    const selfClock = useRef();
    const opponentClock = useRef();

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

                if (color.current === BLACK)
                    opponentClock.current.resume();
                else
                    selfClock.current.resume();

            } catch (error) {
                console.error(error)
            }
        }

        fetchGame();

        const cleanup = registerHandler("GetMove", (move) => {
            // If the current player made the move
            if (move["color"] === 'white' && color.current === WHITE ||
                move["color"] === 'black' && color.current === BLACK) {
                selfClock.current.stop();
                selfClock.current.setRemainingTime(move["time"]);
                opponentClock.current.resume();
            } else {
                opponentClock.current.stop();
                opponentClock.current.setRemainingTime(move["time"]);
                selfClock.current.resume();
            }

            if (move["color"] === 'white' && color.current === WHITE)
                return;
            if (move["color"] === 'black' && color.current === BLACK)
                return;

            if (move["promotion"] == null) {
                makeAMove({
                    from: move["sourceSquare"],
                    to: move["destinationSquare"],
                });
            } else {
                makeAMove({
                    from: move["sourceSquare"],
                    to: move["destinationSquare"],
                    promotion: move["promotion"].toLowerCase(),
                })
            }
        });

        const cleanupGameOver = registerHandler("GameOver", (payload) => {
            console.log("GameOver payload:", payload);
            navigate("/game/end", { state: payload });
        });

        return () => {
            cleanup();
            cleanupGameOver();
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

    // Determină ce nume se află în stânga și în dreapta
    const isWhite = color.current === WHITE;
    const leftName = isWhite ? (blackUsername || '...') : (whiteUsername || '...');
    const rightName = getUsername();
    
    return (
        <div style={pageStyle}>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 36,
                    maxWidth: 1100,
                    width: "100%",
                    justifyContent: "center"
                }}
            >
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 36
                }}>
                    {/* Stânga */}
                    <div style={sideColumnStyle}>
                        <span style={playerNameStyle}>{leftName}</span>
                        <div style={clockBoxStyle}>
                            <Clock ref={opponentClock} timeLimit={180}/>
                        </div>
                    </div>
                    {/* Tabla */}
                    <div style={boardContainerStyle}>
                        <Chessboard
                            boardWidth={480}
                            position={game.fen()}
                            onPieceDrop={onDrop}
                            snapToCursor={true}
                            boardOrientation={isWhite ? 'white' : 'black'}
                            customDarkSquareStyle={{backgroundColor: "#d7bb75"}}
                            customLightSquareStyle={{backgroundColor: "#f7f2e3"}}
                            animationDuration={180}
                        />
                    </div>
                    {/* Dreapta */}
                    <div style={sideColumnStyle}>
                        <span style={playerNameStyle}>{rightName}</span>
                        <div style={clockBoxStyle}>
                            <Clock ref={selfClock} timeLimit={180}/>
                        </div>
                    </div>
                </div>
                {/* Chat-ul*/}
                <div style={{marginLeft: 10}}>
                    <ChatBox gameId={code} username={getUsername()}/>
                </div>
            </div>
            <div style={{marginTop: 36, textAlign: 'center'}}>
                <span style={{...playerNameStyle, fontSize: '1.9rem', ...accentStyle}}>
                    Chess<span style={{color: '#a18d4e'}}> V2</span>
                </span>
            </div>
        </div>
    );
}

export default Game;