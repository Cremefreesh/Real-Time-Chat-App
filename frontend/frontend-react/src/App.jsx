import { useEffect, useState } from "react";
import {
  register,
  login,
  getRooms,
} from "./services/api";

import { RoomSelector } from "./components/roomSelector";
import { ChatRoom } from "./components/chat-room";
import { AuthForm } from "./components/authForm";


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
  setSelectedRoom(null);
  setEmail("");
  setPassword("");
}

  if (!token) {
    return (
      <AuthForm
        mode={mode}
        username={username}
        email={email}
        password={password}
        error={error}
        onUsernameChange={(event) =>
          setUsername(event.target.value)
        }
        onEmailChange={(event) =>
          setEmail(event.target.value)
        }
        onPasswordChange={(event) =>
          setPassword(event.target.value)
        }
        onSubmit={handleAuth}
        onToggleMode={() => {
          setError("");

          setMode((currentMode) =>
            currentMode === "login"
              ? "signup"
              : "login"
          );
        }}
      />
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