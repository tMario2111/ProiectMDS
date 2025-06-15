import {useEffect, useRef, useState} from 'react'
import {useParams} from "react-router-dom"
import {Chess, BLACK, WHITE} from "chess.js";
import {Chessboard} from "react-chessboard";
import {getConnection, registerHandler, startConnection} from "./connection.js";
import Clock from "./components/Clock.jsx";

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

function SpectateGame() {
    const { code } = useParams();

    const [game, setGame] = useState(new Chess());
    const [whiteUsername, setWhiteUsername] = useState('');
    const [blackUsername, setBlackUsername] = useState('');
    const [whiteTime, setWhiteTime] = useState(180000); // ms
    const [blackTime, setBlackTime] = useState(180000); // ms

    const whiteClock = useRef();
    const blackClock = useRef();

    useEffect(() => {
        let initialReceived = false;

        (async () => {
            await startConnection();
            const connection = getConnection();
            await connection.invoke("JoinAsSpectator", code);
        })();

        // Primește starea inițială a jocului
        const cleanupSync = registerHandler("SpectatorSync", (payload) => {
            setGame(new Chess(payload.fen));
            setWhiteUsername(payload.whiteUsername);
            setBlackUsername(payload.blackUsername);
            setWhiteTime(payload.whiteTime);
            setBlackTime(payload.blackTime);

            if (whiteClock.current) whiteClock.current.setRemainingTime(payload.whiteTime);
            if (blackClock.current) blackClock.current.setRemainingTime(payload.blackTime);
            // Pornește ceasul jucătorului la mutare
            if (game.turn() === WHITE) {
                if (whiteClock.current) whiteClock.current.resume();
            } else {
                if (blackClock.current) blackClock.current.resume();
            }
            initialReceived = true;
        });

        // Spectatorul primeste mutarile live
        const cleanupMove = registerHandler("GetMove", (move) => {
            if (!initialReceived) return;
            // Actualizeaza tabla
            setGame(prev => {
                const gameCopy = new Chess(prev.fen());
                if (move.promotion == null) {
                    gameCopy.move({
                        from: move.sourceSquare,
                        to: move.destinationSquare,
                    });
                } else {
                    gameCopy.move({
                        from: move.sourceSquare,
                        to: move.destinationSquare,
                        promotion: move.promotion.toLowerCase(),
                    });
                }
                return gameCopy;
            });
            // Actualizează ceasurile
            if (move.color === 'white') {
                if (whiteClock.current) whiteClock.current.stop();
                if (whiteClock.current) whiteClock.current.setRemainingTime(move.time);
                if (blackClock.current) blackClock.current.resume();
                setWhiteTime(move.time);
            } else {
                if (blackClock.current) blackClock.current.stop();
                if (blackClock.current) blackClock.current.setRemainingTime(move.time);
                if (whiteClock.current) whiteClock.current.resume();
                setBlackTime(move.time);
            }
        });

        return () => {
            cleanupSync();
            cleanupMove();
        }
    }, [code]);

    // Spectatorul vede mereu tabla din perspectiva albului
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
                    {/*Stanga*/}
                    <div style={sideColumnStyle}>
                        <span style={playerNameStyle}>{blackUsername || '...'}</span>
                        <div style={clockBoxStyle}>
                            <Clock ref={blackClock} timeLimit={180}/>
                        </div>
                    </div>
                    {/* Tabla */}
                    <div style={boardContainerStyle}>
                        <Chessboard
                            boardWidth={480}
                            position={game.fen()}
                            boardOrientation="white"
                            arePiecesDraggable={false}
                            customDarkSquareStyle={{backgroundColor: "#d7bb75"}}
                            customLightSquareStyle={{backgroundColor: "#f7f2e3"}}
                            animationDuration={180}
                        />
                    </div>
                    {/* Dreapta */}
                    <div style={sideColumnStyle}>
                        <span style={playerNameStyle}>{whiteUsername || '...'}</span>
                        <div style={clockBoxStyle}>
                            <Clock ref={whiteClock} timeLimit={180}/>
                        </div>
                    </div>
                </div>
                {/* Chat-ul*/}
                <div style={{marginLeft: 10}}>
                    <ChatBox gameId={code} username={"Spectator"} />
                </div>
            </div>
            <div style={{marginTop: 36, textAlign: 'center'}}>
                <span style={{...playerNameStyle, fontSize: '1.9rem', ...accentStyle}}>
                    <span style={{color: '#a18d4e'}}> Spectate</span>
                </span>
            </div>
        </div>
    );
}

export default SpectateGame;