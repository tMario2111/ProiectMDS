import { HubConnectionBuilder, JsonHubProtocol } from '@microsoft/signalr';
import { MessagePackHubProtocol } from '@microsoft/signalr-protocol-msgpack';

let connection = null;
let connectionPromise = null;

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

