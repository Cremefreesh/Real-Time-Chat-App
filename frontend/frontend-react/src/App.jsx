import { useEffect, useState } from "react";
import {
  register,
  login,
  getCurrentUser,
} from "./services/api";

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

  async function loadCurrentUser() {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      console.error(err);

      localStorage.removeItem("token");
      setToken(null);
      setCurrentUser(null);
    }
  }

  useEffect(() => {
    if (token) {
      loadCurrentUser();
    }
  }, [token]);

  async function handleAuth(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      if (mode === "signup") {
        await register(username, email, password);

        setMode("login");
        setPassword("");
        setError("Account created. You can now log in.");
        return;
      }

      const loginData = await login(email, password);

      setToken(loginData.access_token);
      setPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }


  async function handleLogin(email, password) {
    try {
      const data = await login(email, password);

      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
    } catch (error) {
      console.error("Login failed:", error);
    }
  }


  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
    setCurrentUser(null);
  }

  if (!token) {
    return (
      <div
        style={{
          maxWidth: "420px",
          margin: "4rem auto",
          padding: "2rem",
          fontFamily: "Arial",
        }}
      >
        <h1>Real-Time Chat</h1>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
            }}
          >
            Sign up
          </button>
        </div>

        <form
          onSubmit={handleAuth}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            marginTop: "1.5rem",
          }}
        >
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading
              ? "Loading..."
              : mode === "login"
                ? "Login"
                : "Create account"}
          </button>
        </form>

        {error && (
          <p
            style={{
              marginTop: "1rem",
              color: error.startsWith("Account created")
                ? "green"
                : "crimson",
            }}
          >
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "Arial",
      }}
    >
      <h1>Real-Time Chat</h1>

      {currentUser ? (
        <>
          <h2>Authentication works 🎉</h2>

          <p>
            Logged in as{" "}
            <strong>
              {currentUser.username || currentUser.email}
            </strong>
          </p>

          <pre>
            {JSON.stringify(currentUser, null, 2)}
          </pre>
        </>
      ) : (
        <p>Loading your profile...</p>
      )}

      <button type="button" onClick={handleLogout}>
        Log out
      </button>
    </div>
  );
}

export default App;