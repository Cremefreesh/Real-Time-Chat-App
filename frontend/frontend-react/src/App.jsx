import { useEffect, useState } from "react";
import {
  register,
  login,
  getRooms,
} from "./services/api";

import { RoomSelector } from "./components/roomSelector";
import { ChatRoom } from "./components/chat-room";


function App() {
  const [mode, setMode] = useState("login");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState(() =>
    localStorage.getItem("token")
  );

  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [rooms, setRooms] = useState([
  { id: 1, name: "General" },
  { id: 2, name: "Gaming" },
  { id: 3, name: "Programming" },
  ]);

  const [selectedRoom, setSelectedRoom] =
    useState(null);

  /*
  useEffect(() => {
    if (!token) {
      return;
    }

    async function loadRooms() {
      try {
        const roomData = await getRooms(token);
        setRooms(roomData);
      } catch (loadError) {
        console.error(loadError);
        setError(loadError.message);
      }
    }

    loadRooms();
  }, [token]);
  */

  async function handleAuth(event) {
    event.preventDefault();
    setError("");

    try {
      if (mode === "signup") {
        await register(username, email, password);

        setMode("login");
        setPassword("");
        return;
      }

      const data = await login(email, password);

      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);

    } catch (authError) {
      console.error(authError);
      setError(authError.message);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");

    setToken(null);
    setRooms([]);
    setSelectedRoom(null);
    setEmail("");
    setPassword("");
  }

  if (!token) {
    return (
      <main>
        <h1>
          {mode === "login"
            ? "Login"
            : "Create account"}
        </h1>

        <form onSubmit={handleAuth}>
          {mode === "signup" && (
            <input
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="Username"
              required
            />
          )}

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="Email"
            required
          />

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Password"
            required
          />

          <button type="submit">
            {mode === "login"
              ? "Login"
              : "Register"}
          </button>
        </form>

        {error && <p>{error}</p>}

        <button
          type="button"
          onClick={() => {
            setError("");

            setMode((currentMode) =>
              currentMode === "login"
                ? "signup"
                : "login"
            );
          }}
        >
          {mode === "login"
            ? "Create an account"
            : "Return to login"}
        </button>
      </main>
    );
  }

  if (!selectedRoom) {
    return (
      <RoomSelector
        rooms={rooms}
        onSelectRoom={setSelectedRoom}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <ChatRoom
      room={selectedRoom}
      token={token}
      onLeaveRoom={() => setSelectedRoom(null)}
    />
  );
}

export default App;