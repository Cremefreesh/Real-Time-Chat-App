import { useState, useEffect } from "react";

const API = "http://127.0.0.1:8001";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [output, setOutput] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  
  const register = async () => {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerData),
    });

    const data = await res.json();
    setOutput(JSON.stringify(data, null, 2));
  };

  const login = async () => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
    });

    const data = await res.json();
    setToken(data.access_token);
    localStorage.setItem("token", data.access_token);
    setOutput(JSON.stringify(data, null, 2));
  };

  const getMe = async () => {
    const res = await fetch(`${API}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

  const data = await res.json();

  setCurrentUser(data);
  setOutput(JSON.stringify(data, null, 2));
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setCurrentUser(null);
  };

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        await getMe();
      }
    };
  fetchUser();
  }, [token]);


  return (
    <div style={{ padding: "20px" }}>
  {!token ? (
    <>
      <h2>Register</h2>

      <input
        placeholder="Username"
        onChange={(e) =>
          setRegisterData({ ...registerData, username: e.target.value })
        }
      />
      <br />

      <input
        placeholder="Email"
        onChange={(e) =>
          setRegisterData({ ...registerData, email: e.target.value })
        }
      />
      <br />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) =>
          setRegisterData({ ...registerData, password: e.target.value })
        }
      />
      <br />

      <button onClick={register}>Register</button>

      <hr />

      <h2>Login</h2>

      <input
        placeholder="Email"
        onChange={(e) =>
          setLoginData({ ...loginData, email: e.target.value })
        }
      />
      <br />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) =>
          setLoginData({ ...loginData, password: e.target.value })
        }
      />
      <br />

      <button onClick={login}>Login</button>
    </>
  ) : (
    <>
      <h1>Welcome!</h1>

      <p>You are logged in.</p>

      {currentUser && (
        <>
          <p>Email: {currentUser.email}</p>
          <p>Username: {currentUser.username}</p>
        </>
      )}

      <button onClick={logout}>Logout</button>
    </>
  )}

  <hr />

  <pre>{output}</pre>
</div>
  );
}
//may need some indentation reshuffling if wrong

export default App;