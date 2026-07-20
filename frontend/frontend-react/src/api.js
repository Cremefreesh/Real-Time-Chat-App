const API_URL = "http://127.0.0.1:8000";

export async function register(username, email, password) {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Registration failed");
  }

  return data;
}

export async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (data.access_token) {
    localStorage.setItem("token", data.access_token);
  }

  return data;
}

export async function getRooms() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/chat/rooms`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}

export async function createRoom(name) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/chat/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  return res.json();
}

export async function getMessages(roomId) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/chat/rooms/${roomId}/messages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}

export async function getMyProfile() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/profiles/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to load profile");
  }

  return res.json();
}

export async function updateMyProfile(profile) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/profiles/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profile),
  });

  if (!res.ok) {
    throw new Error("Failed to update profile");
  }

  return res.json();
}

export async function getUserProfile(userId) {
  const res = await fetch(`${API_URL}/profiles/${userId}`);

  if (!res.ok) {
    throw new Error("Failed to load user profile");
  }

  return res.json();
}
