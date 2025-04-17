import { useEffect, useState } from 'react'

import 'bootstrap/dist/css/bootstrap.min.css';

import './Home.css';

import { startConnection, registerHandler, getConnection } from './connection';


function Home() {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [gameId, setGameId] = useState('');

    useEffect(() => {
        const initialize = async () => {
            try {
                await startConnection();
            } catch (error) { }
        };
        initialize();
    }, [])

    const handleRegister = async () => {
        if (!username) {
            setError("Username is required");
            return;
        }
        try {
            const connection = getConnection();

            const registrationPromise = new Promise((resolve, reject) => {
                const unregister = registerHandler("RegisterSuccessful", () => {
                  unregister(); // Remove the handler after it fires.
                  resolve(true);
                });
                // Optionally add a timeout.
                setTimeout(() => {
                  unregister();
                  reject(new Error("Registration timed out"));
                }, 5000);
              });

            await connection.invoke("RegisterUser", { Username: username });
            // Wait for the "RegisterSuccessful" event from the server.
            await registrationPromise;
        } catch (err) {
            console.error("Registration error:", err);
            setError("Registration failed!");
            throw err; // Optional: rethrow if you need to handle it in handleCreateGame.
        }
    }

    const handleCreateGame = async () => {
        if (!username) {
            setError('Username is required');
            return;
        }

        await handleRegister();

        try {
            const response = await fetch('https://localhost:7008/api/create-game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ Username: username }),
            });

            if (!response.ok) {
                throw new Error('Failed to create game');
            }

            const data = await response.json();
            setGameId(data.gameId);
            window.location.href = `/game/create/${data.gameId}`; // TODO: Put id here
        }
        catch (error) {
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

        try {
            const response = await fetch('https://localhost:7008/api/join-game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ Username: username, GameId: gameId }),
            });

            if (!response.ok) {
                throw new Error("Game not found");
            }
        }
        catch (error) {
            setError(error.message);
        }
    }

    return <>
        <div class="center d-flex flex-column justify-content-center align-items-center">
            <h1 class="mb-5">Chess V2</h1>
            <div class="form-floating mb-4">
                <input class="form-control" autocomplete="Username" aria-required="true" placeholder="Username"
                    value={username} onChange={(e) => setUsername(e.target.value)} />
                <label>Username</label>
            </div>
            {/* TODO: Better UX with this "universal" error message  */}
            {error && <span className="text-danger">{error}</span>}
            <div class="mt-5"></div>
            <div class="d-flex flex-row justify-content-center align-items-start gap-5">
                <div class="d-flex flex-column justify-content-start align-items-center gap-5">
                    <h2>Create game</h2>
                    <button class="btn btn-primary" onClick={handleCreateGame}>
                        Create new game</button>
                </div>
                <div class="vr"></div>
                <div class="d-flex flex-column justify-content-center align-items-center">
                    <h2 class="mb-5">Join with code</h2>
                    <div class="form-floating mb-4">
                        <input class="form-control" autocomplete="Game code" aria-required="true"
                            placeholder="Game code" value={gameId} onChange={(e) => setGameId(e.target.value)} />
                        <label>Game code</label>
                    </div>
                    <button class="btn btn-primary" onClick={handleJoinGame}>Join</button>
                </div>
            </div>
        </div>
    </>
}

export default Home;