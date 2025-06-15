import {useEffect, useRef, useState} from "react";
import {getConnection, registerHandler, getUsername} from "../connection";

const chatContainerStyle = {
    background: "#f4ecd3",
    borderRadius: "14px",
    boxShadow: "0 2px 16px #bdb08d33",
    padding: "18px 14px 12px 14px",
    minWidth: 280,
    maxHeight: 320,
    width: 300,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end"
};
const chatMessagesStyle = {
    flex: 1,
    overflowY: "auto",
    marginBottom: 10
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

function ChatBox({gameId}) {
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
        await connection.invoke("SendChatMessage", gameId, getUsername() || "Spectator", trimmed);
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
export default ChatBox;