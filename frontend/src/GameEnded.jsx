import React from "react";

const overlayStyle = {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(243, 238, 225, 0.94)",
    zIndex: 99,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Montserrat', 'Lato', sans-serif",
};

const cardStyle = {
    background: "linear-gradient(135deg, #f7f4ed 0%, #e4e0d1 100%)",
    borderRadius: "28px",
    boxShadow: "0 8px 40px #a3926a44",
    padding: "48px 32px",
    textAlign: "center",
    minWidth: "340px",
    maxWidth: "90vw"
};

const titleStyle = {
    fontWeight: 900,
    fontSize: "2.2rem",
    marginBottom: "16px",
    color: "#bfa14a",
    letterSpacing: "2px"
};

const subtitleStyle = {
    fontWeight: 600,
    fontSize: "1.2rem",
    marginBottom: "32px",
    color: "#6e6142"
};

const btnStyle = {
    background: "#e4c77b",
    color: "#21201a",
    fontSize: "1.1rem",
    border: "none",
    borderRadius: "10px",
    padding: "13px 32px",
    cursor: "pointer",
    margin: "12px",
    fontWeight: 700,
    boxShadow: "0 2px 8px #b8aa7e29",
    transition: "0.2s background, 0.2s box-shadow"
};

export default function GameOver({ winner, reason, onRematch, onExit }) {
    // winner: username sau "Draw"
    // reason: "Time", "Checkmate", "Resignation" etc.

    let title, subtitle, emoji;
    if (winner === "Draw") {
        title = "Remiză";
        subtitle = "Jocul s-a terminat la egalitate.";
        emoji = "🤝";
    } else {
        title = `Victoria lui ${winner}!`;
        switch (reason) {
            case "Checkmate":
                subtitle = "Mat! Ai câștigat partida.";
                emoji = "♛";
                break;
            case "Time":
                subtitle = "Timpul adversarului a expirat.";
                emoji = "⏰";
                break;
            case "Resignation":
                subtitle = "Adversarul a cedat.";
                emoji = "🏳️";
                break;
            default:
                subtitle = "Felicitări!";
                emoji = "🏆";
        }
    }

    return (
        <div style={overlayStyle}>
            <div style={cardStyle}>
                <div style={titleStyle}>
                    {emoji} {title}
                </div>
                <div style={subtitleStyle}>{subtitle}</div>
                <div>
                    <button style={btnStyle} onClick={onRematch}>
                        Joacă din nou
                    </button>
                    <button style={{...btnStyle, background: "#eedba3"}} onClick={onExit}>
                        Ieși
                    </button>
                </div>
            </div>
        </div>
    );
}