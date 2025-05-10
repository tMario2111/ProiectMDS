const TOKEN_KEY = 'chessv2_client_token';

export async function getToken() {
    let token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
        const response = await fetch('https://localhost:7008/api/token');
        if (!response.ok) {
            console.error(response);
            return null;
        }
        const data = await response.json();
        token = data['token'];
        localStorage.setItem(TOKEN_KEY, data['token']);
    }

    return token;
}