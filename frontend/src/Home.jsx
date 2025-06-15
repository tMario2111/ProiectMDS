import {useEffect, useRef, useState} from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import './Home.css';
import {startConnection, registerHandler, getConnection, assignUsername} from './connection';
import {useNavigate} from "react-router-dom";

const ACTIVE_PERKS = [
    { value: '', label: 'Standard layout' },
    { value: '3knights', label: '3 Knights + 1 Bishop' },
    { value: '3bishops', label: '3 Bishops + 1 Knight' }
];

const PASSIVE_PERKS = [
    { value: 'timeOnCheck', label: 'Gain +15s when you deliver check' },
    { value: 'reclaimPawn', label: 'Once/game, reclaim a captured pawn' }
];

// --- PREMIUM CSS INLINE ---
const pageStyle = {
    background: 'linear-gradient(120deg, #f3eee1 0%, #f9f8f6 100%)',
    minHeight: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Montserrat', 'Lato', sans-serif"
};

const mainCardStyle = {
    background: "linear-gradient(135deg, #f7f4ed 0%, #e4e0d1 100%)",
    borderRadius: "32px",
    boxShadow: "0 8px 40px #a3926a22",
    padding: "32px 22px 32px 22px",
    minWidth: 350,
    maxWidth: 400,
    width: "100%",
    margin: "0 18px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
};

const titleStyle = {
    fontWeight: 900,
    fontSize: "2.3rem",
    marginBottom: "8px",
    color: "#bfa14a",
    letterSpacing: "2px",
    textAlign: "center"
};

const subTitleStyle = {
    fontWeight: 600,
    fontSize: "1.1rem",
    marginBottom: "18px",
    color: "#6e6142",
    textAlign: "center"
};

const perkLabelStyle = {
    marginBottom: '0.45rem',
    fontWeight: 700,
    color: '#7a6b4f',
    fontSize: '1.05rem'
};

const errorStyle = {
    color: "#cf443e",
    fontWeight: 600,
    marginBottom: 10,
    textAlign: "center"
};

const buttonStyle = {
    background: "#e4c77b",
    color: "#21201a",
    fontSize: "1.08rem",
    border: "none",
    borderRadius: "13px",
    padding: "11px 22px",
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: "0 2px 8px #b8aa7e29",
    marginTop: 10,
    marginBottom: 5,
    transition: "0.2s background, 0.2s box-shadow"
};

const inputStyle = {
    borderRadius: 12,
    fontWeight: 600,
    fontFamily: "'Montserrat', 'Lato', sans-serif",
    border: '1px solid #e5dbc3',
    fontSize: "1.05rem",
    padding: "11px 14px",
    marginBottom: 8
};

const centerColumnStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 220,
    margin: "0 26px"
};

function Home() {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [gameId, setGameId] = useState('');
    const gameIdRef = useRef('');
    const [activePerk, setActivePerk] = useState('');
    const [passivePerks, setPassivePerks] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        const initialize = async () => {
            try {
                await startConnection();
            } catch (error) {}
        };
        initialize();

        registerHandler("GameStart", (payload) => {
            if (payload && payload.fen) {
                window._customFen = payload.fen;
            } else {
                window._customFen = null;
            }
            navigate(`/game/${gameIdRef.current}`);
        });
    }, []);

    const handleRegisterToHub = async () => {
        if (!username) {
            setError("Username is required");
            return;
        }
        try {
            const connection = getConnection();

            const registrationPromise = new Promise((resolve, reject) => {
                const unregisterSuccess = registerHandler("RegisterSuccessful", () => {
                    unregisterSuccess();
                    unregisterError();
                    resolve(true);
                });

                const unregisterError = registerHandler("Error", (errorMessage) => {
                    unregisterSuccess();
                    unregisterError();
                    reject(new Error(errorMessage));
                });
            });

            await connection.invoke("RegisterUser", {Username: username});
            await registrationPromise;
        } catch (err) {
            setError("Registration failed!");
        }
    }

    const handleCreateGame = async () => {
        if (!username) {
            setError('Username is required');
            return;
        }
        if(passivePerks.length > 2) {
            setError('You can only select up to 2 passive perks!');
            return;
        }

        await handleRegisterToHub();

        try {
            const response = await fetch('https://localhost:7008/api/create-game', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    Username: username,
                    LayoutPerk: activePerk,
                    TimeOnCheck: passivePerks.includes('timeOnCheck'),
                }),
            });

            if (!response.ok) throw new Error('Failed to create game');

            const data = await response.json();
            const connection = getConnection();
            await connection.invoke("JoinGameGroup", data.gameId);

            gameIdRef.current = data.gameId;
            assignUsername(username);

            navigate(`/game/create/${data.gameId}`);
        } catch (error) {
            setError(error.message);
        }
    }

    const handleJoinGame = async () => {
        if (!username) {
            setError('Username is required');
            return;
        }
        if (!gameId) {
            setError("Game code is required");
            return;
        }
        if(passivePerks.length > 2) {
            setError('You can only select up to 2 passive perks!');
            return;
        }

        await handleRegisterToHub();

        try {
            const response = await fetch('https://localhost:7008/api/join-game', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    Username: username,
                    GameId: gameId,
                    LayoutPerk: activePerk,
                    TimeOnCheck: passivePerks.includes('timeOnCheck'),
                }),
            });

            if (!response.ok) throw new Error("Game not found or already started");

            gameIdRef.current = gameId;
            assignUsername(username);

            const connection = getConnection();
            await connection.invoke("JoinGameGroup", gameId);
        } catch (error) {
            setError(error.message);
        }
    }

    function handlePassivePerksChange(perk) {
        setPassivePerks(prev => {
            if(prev.includes(perk)) {
                return prev.filter(p => p !== perk);
            }
            if(prev.length === 2) {
                return prev;
            }
            return [...prev, perk];
        });
    }

    return (
        <div style={pageStyle}>
            <div style={{display: "flex", flexDirection: "column", alignItems: "center", width: "100%"}}>
                <div style={titleStyle}>♛ Chess <span style={{color:"#a18d4e"}}>V2</span></div>
                <div style={subTitleStyle}>Play premium chess with perks</div>
                <div className="mb-3" style={{width: "100%", maxWidth: 320}}>
                    <div style={perkLabelStyle}>Username</div>
                    <input
                        className="form-control"
                        style={inputStyle}
                        autoComplete="Username"
                        aria-required="true"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    {error && <div style={errorStyle}>{error}</div>}

                    <div style={perkLabelStyle} className="mt-3 mb-1"><b>Active perk</b></div>
                    <select
                        className="form-select"
                        style={{marginBottom: 10, borderRadius: 12, fontWeight: 600}}
                        value={activePerk}
                        onChange={e => setActivePerk(e.target.value)}
                    >
                        {ACTIVE_PERKS.map(pk => (
                            <option value={pk.value} key={pk.value}>{pk.label}</option>
                        ))}
                    </select>

                    <div style={perkLabelStyle} className="mt-2 mb-1"><b>Passive perks (max 2)</b></div>
                    <div>
                        {PASSIVE_PERKS.map(pk =>
                            <div key={pk.value} className="form-check" style={{marginBottom: 5}}>
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={pk.value}
                                    checked={passivePerks.includes(pk.value)}
                                    onChange={() => handlePassivePerksChange(pk.value)}
                                    disabled={!passivePerks.includes(pk.value) && passivePerks.length >= 2}
                                    style={{accentColor: "#bfa14a"}}
                                />
                                <label className="form-check-label" htmlFor={pk.value} style={{fontWeight: 600}}>
                                    {pk.label}
                                </label>
                            </div>
                        )}
                    </div>
                </div>
                {/* Row with create and join cards */}
                <div
                    className="mt-2"
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "flex-start",
                        justifyContent: "center",
                        width: "100%",
                        gap: 32,
                        marginTop: 10
                    }}
                >
                    {/* Create game window */}
                    <div style={mainCardStyle}>
                        <h2 style={{fontWeight: 800, fontSize: '1.13rem', color: '#bfa14a', marginBottom: 16}}>Create game</h2>
                        <button style={buttonStyle} onClick={handleCreateGame}>
                            Create new game
                        </button>
                    </div>
                    {/* Center column for spacing/visual divider */}
                    <div style={centerColumnStyle}>
                        <div style={{
                            width: 1, background: "#e6dec3", minHeight: 105, margin: "0 0"
                        }}/>
                    </div>
                    {/* Join game window */}
                    <div style={mainCardStyle}>
                        <h2 style={{fontWeight: 800, fontSize: '1.13rem', color: '#bfa14a', marginBottom: 16}}>Join with code</h2>
                        <input
                            className="form-control"
                            style={{...inputStyle, marginBottom: 11}}
                            autoComplete="Game code"
                            aria-required="true"
                            placeholder="Game code"
                            value={gameId}
                            onChange={(e) => setGameId(e.target.value)}
                        />
                        <button style={buttonStyle} onClick={handleJoinGame}>Join</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;