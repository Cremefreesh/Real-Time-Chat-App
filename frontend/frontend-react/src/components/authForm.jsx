import "./AuthForm.css";

export function AuthForm({
  mode,
  username,
  email,
  password,
  error,
  onUsernameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onToggleMode,
}) {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h1>

        <p className="auth-subtitle">
          {mode === "login"
            ? "Sign in to continue chatting"
            : "Join the conversation"}
        </p>

        <form className="auth-form" onSubmit={onSubmit}>
          {mode === "signup" && (
            <div className="input-group">
              <label htmlFor="username">Username</label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={onUsernameChange}
                placeholder="Enter your username"
                required
              />
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">Email</label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={onEmailChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={onPasswordChange}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" type="submit">
            {mode === "login" ? "Login" : "Register"}
          </button>
        </form>

        <button
          className="auth-toggle"
          type="button"
          onClick={onToggleMode}
        >
          {mode === "login"
            ? "Need an account? Register"
            : "Already have an account? Login"}
        </button>
      </div>
    </main>
  );
}