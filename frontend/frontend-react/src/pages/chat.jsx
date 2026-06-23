import { useEffect, useState } from "react";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws");

    ws.onmessage = (event) => {
      setMessages((prev) => [...prev, event.data]);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = () => {
    if (!message.trim()) return;

    socket.send(message);
    setMessage("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Real-Time Chat</h1>

      <div style={{ border: "1px solid black", height: "300px", padding: "10px" }}>
        {messages.map((msg, index) => (
          <p key={index}>{msg}</p>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        style={{ marginTop: "10px", width: "300px" }}
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default Chat;