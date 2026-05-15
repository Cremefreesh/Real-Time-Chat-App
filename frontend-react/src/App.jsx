import { useState, useEffect, useCallback } from "react";

const API = "http://127.0.0.1:8001";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
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

  const getMe = useCallback(async () => {
    const res = await fetch(`${API}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setCurrentUser(data);
  }, [token]);

  useEffect(() => {
    if (token) {
      getMe();
    }
  }, [token, getMe]);

  const register = async () => {
    await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registerData),
    });
  };

  const login = async () => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    const data = await res.json();

    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setCurrentUser(null);
  };

  if (!token) {
    return (
      <div className="h-screen bg-zinc-900 flex items-center justify-center text-white">
        <div className="bg-zinc-800 p-8 rounded-2xl w-96">
          <h1 className="text-3xl font-bold mb-6">Chat App</h1>

          <input
            className="w-full p-2 mb-3 rounded bg-zinc-700"
            placeholder="Email"
            onChange={(e) =>
              setLoginData({ ...loginData, email: e.target.value })
            }
          />

          <input
            className="w-full p-2 mb-3 rounded bg-zinc-700"
            type="password"
            placeholder="Password"
            onChange={(e) =>
              setLoginData({ ...loginData, password: e.target.value })
            }
          />

          <button
            className="w-full bg-blue-600 p-2 rounded hover:bg-blue-500"
            onClick={login}
          >
            Login
          </button>

          <hr className="my-6 border-zinc-600" />

          <h2 className="text-xl mb-3">Register</h2>

          <input
            className="w-full p-2 mb-3 rounded bg-zinc-700"
            placeholder="Username"
            onChange={(e) =>
              setRegisterData({
                ...registerData,
                username: e.target.value,
              })
            }
          />

          <input
            className="w-full p-2 mb-3 rounded bg-zinc-700"
            placeholder="Email"
            onChange={(e) =>
              setRegisterData({
                ...registerData,
                email: e.target.value,
              })
            }
          />

          <input
            className="w-full p-2 mb-3 rounded bg-zinc-700"
            type="password"
            placeholder="Password"
            onChange={(e) =>
              setRegisterData({
                ...registerData,
                password: e.target.value,
              })
            }
          />

          <button
            className="w-full bg-green-600 p-2 rounded hover:bg-green-500"
            onClick={register}
          >
            Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-900 text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-800 p-4 flex flex-col">
        <h1 className="text-2xl font-bold mb-6">Chat App</h1>

        <div className="mb-4">
          <p className="text-sm text-zinc-400">Logged in as:</p>
          <p>{currentUser?.username}</p>
        </div>

        <button
          className="bg-red-600 p-2 rounded hover:bg-red-500 mt-auto"
          onClick={logout}
        >
          Logout
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-zinc-800 p-4 border-b border-zinc-700">
          <h2 className="text-xl font-semibold">General Chat</h2>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="bg-zinc-800 p-3 rounded-xl w-fit">
            Hello 👋
          </div>

          <div className="bg-blue-600 p-3 rounded-xl w-fit ml-auto">
            Hi there!
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-zinc-700 flex gap-2">
          <input
            className="flex-1 p-3 rounded-xl bg-zinc-800"
            placeholder="Type a message..."
          />

          <button className="bg-blue-600 px-6 rounded-xl hover:bg-blue-500">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;