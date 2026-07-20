const API_URL = "http://127.0.0.1:8000";

function getErrorMessage(data, fallback) {
  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data?.detail)) {
    return data.detail
      .map((error) => {
        const location = error.loc?.join(" → ") || "request";
        return `${location}: ${error.msg}`;
      })
      .join("\n");
  }

  return fallback;
}

export async function register(username, email, password) {
  const payload = {
    username,
    email,
    password,
  };

  console.log("Register payload:", payload);

  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Registration failed")
    );
  }

  return data;
}

export async function login(email, password) {
  const payload = {
    email,
    password,
  };

  console.log("Login payload:", payload);

  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Login failed")
    );
  }

  localStorage.setItem("token", data.access_token);

  return data;
}

export async function getCurrentUser() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Unable to load user")
    );
  }

  return data;
}