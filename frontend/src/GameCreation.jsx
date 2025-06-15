import {useParams} from 'react-router-dom'

function GameCreation() {
    const {code} = useParams();

    // Styles
    const pageStyle = {
        background: 'linear-gradient(120deg, #f3eee1 0%, #f9f8f6 100%)',
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Montserrat', 'Lato', sans-serif",
    };

    const cardStyle = {
        background: "linear-gradient(135deg, #f7f4ed 0%, #e4e0d1 100%)",
        borderRadius: "28px",
        boxShadow: "0 8px 40px #a3926a44",
        padding: "44px 32px 36px 32px",
        minWidth: 340,
        maxWidth: 400,
        textAlign: "center",
        position: "relative",
        overflow: "hidden"
    };

    const titleStyle = {
        fontWeight: 900,
        fontSize: "2.1rem",
        marginBottom: "18px",
        color: "#bfa14a",
        letterSpacing: "2px"
    };

    const codeStyle = {
        fontWeight: 700,
        fontSize: "1.5rem",
        color: "#a18d4e",
        background: "#f7f2e3",
        borderRadius: 12,
        padding: "10px 22px",
        margin: "0 auto 18px auto",
        width: "fit-content",
        display: "inline-block",
        letterSpacing: "2px"
    };

    const linkStyle = {
        fontWeight: 600,
        background: "#fffbe7",
        color: "#bfa14a",
        padding: "7px 13px",
        borderRadius: 8,
        textDecoration: "none",
        transition: "all 0.15s",
        wordBreak: "break-all"
    };

    const decor1 = {
        position: "absolute",
        left: -28, top: -28,
        width: 70, height: 70,
        background: "radial-gradient(circle at 60% 50%,#ffe6a0 70%,#fffbe7 100%)",
        borderRadius: "50%",
        opacity: 0.8,
        zIndex: -1
    };
    const decor2 = {
        position: "absolute",
        right: -22, bottom: -22,
        width: 48, height: 48,
        background: "radial-gradient(circle at 30% 70%,#bfa14a 60%,#fffbe7 100%)",
        borderRadius: "50%",
        opacity: 0.18,
        zIndex: -1
    };
    const decor3 = {
        position: "absolute",
        left: 24, bottom: -17,
        width: 35, height: 35,
        background: "radial-gradient(circle at 80% 20%,#ffe6a0 70%,#fffbe7 100%)",
        borderRadius: "50%",
        opacity: 0.2,
        zIndex: -1
    };

    return (
        <div style={pageStyle}>
            <div style={cardStyle}>
                <div style={decor1}/>
                <div style={decor2}/>
                <div style={decor3}/>
                <div style={titleStyle}>Game created!</div>
                <div style={{marginBottom: 18, color: "#7a6b4f", fontWeight: 600, fontSize: "1.1rem"}}>
                    Share this code with your friend:
                </div>
                <div style={codeStyle}>{code}</div>
                <div style={{marginTop: 30, color: "#cab56b", fontSize: 33}}>♕</div>
            </div>
        </div>
    );
}

export default GameCreation