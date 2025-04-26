import {HubConnectionBuilder, JsonHubProtocol} from '@microsoft/signalr';

let connection = null;
let connectionPromise = null;

let username = null;

export const getUsername = () => {
    return username;
}

export const assignUsername = (name) => {
    username = name;
}

export const startConnection = async () => {
    if (connectionPromise) return connectionPromise;

    connectionPromise = (async () => {
        connection = new HubConnectionBuilder()
            .withUrl("https://localhost:7008/gameHub")
            .withHubProtocol(new JsonHubProtocol())
            .withAutomaticReconnect()
            .build();

        try {
            await connection.start();
            console.log("Connected to hub");
            console.log(connection.connectionId);
            return connection;
        } catch (err) {
            console.error('Connection failed:', err);
            throw err;
        }
    })();

    return connectionPromise;
}

export const getConnection = () => {
    if (!connection) throw new Error('Connection not initialized');
    return connection;
}

export const registerHandler = (methodName, callback) => {
    const conn = getConnection();
    conn.on(methodName, callback);
    return () => conn.off(methodName, callback);
};

console.log(`This only runs once (I hope): ${Date.now()}ms`);