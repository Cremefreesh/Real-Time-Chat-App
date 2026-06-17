import { useEffect, useState } from "react";
import { login, signup, getRooms, createRoom, getMessages } from "./api";

function App() {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [activeRoom, setActiveRoom] = useState(null);

  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [socket, setSocket] = useState(null);

  const token = localStorage.getItem("token");

  async function handleAuth(e) {
    e.preventDefault();

    if (mode === "signup") {
      await signup(username, email, password);
      setMode("login");
      return;
    }

    await login(email, password);
    loadRooms();
  }

  async function loadRooms() {
    const data = await getRooms();
    setRooms(data);
  }

  async function handleCreateRoom(e) {
    e.preventDefault();

    await createRoom(roomName);
    setRoomName("");
    loadRooms();
  }

  async function openRoom(room) {
    setActiveRoom(room);

    const oldMessages = await getMessages(room.id);
    setMessages(oldMessages);

    if (socket) {
      socket.close();
    }

    const token = localStorage.getItem("token");
    const ws = new WebSocket(
      `ws://127.0.0.1:8000/ws/rooms/${room.id}?token=${token}`
    );

    ws.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      setMessages((prev) => [...prev, newMessage]);
    };

    setSocket(ws);
  }

  function sendMessage(e) {
    e.preventDefault();

    if (!socket || !messageInput.trim()) return;

    socket.send(
      JSON.stringify({
        content: messageInput,
      })
    );

    setMessageInput("");
  }

  useEffect(() => {
    if (token) {
      loadRooms();
    }
  }, []);

  if (!token) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Real-Time Chat</h1>

        <button onClick={() => setMode("login")}>Login</button>
        <button onClick={() => setMode("signup")}>Signup</button>

        <form onSubmit={handleAuth}>
          {mode === "signup" && (
            <input
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          )}

          <input
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            placeholder="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">
            {mode === "login" ? "Login" : "Signup"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial" }}>
      <aside style={{ width: "250px", borderRight: "1px solid #ddd", padding: "1rem" }}>
        <h2>Rooms</h2>

        <form onSubmit={handleCreateRoom}>
          <input
            placeholder="New room"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
          <button type="submit">Create</button>
        </form>

        {rooms.map((room) => (
          <div
            key={room.id}
            onClick={() => openRoom(room)}
            style={{
              padding: "0.75rem",
              cursor: "pointer",
              background: activeRoom?.id === room.id ? "#eee" : "white",
            }}
          >
            {room.name}
          </div>
        ))}
      </aside>

      <main style={{ flex: 1, padding: "1rem" }}>
        {activeRoom ? (
          <>
            <h2>{activeRoom.name}</h2>

            <div style={{ height: "70vh", overflowY: "auto", border: "1px solid #ddd", padding: "1rem" }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ marginBottom: "1rem" }}>
                  <strong>{msg.username || msg.user_id}</strong>
                  <p>{msg.content}</p>
                </div>
              ))}
            </div>

            <form onSubmit={sendMessage} style={{ marginTop: "1rem" }}>
              <input
                placeholder="Type message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                style={{ width: "80%" }}
              />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <h2>Select a room</h2>
        )}
      </main>
    </div>
  );
}

export default App;