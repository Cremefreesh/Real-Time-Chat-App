import "./roomSelector.css";

export function RoomSelector({
  rooms,
  onSelectRoom,
  onLogout,
}) {
  return (
    <main className="room-page">
      <section className="room-panel">
        <header className="room-header">
          <div>
            <p className="room-eyebrow">Real-Time Chat</p>
            <h1>Choose a room</h1>
            <p className="room-description">
              Join a conversation and start chatting.
            </p>
          </div>

          <button
            className="logout-button"
            type="button"
            onClick={onLogout}
          >
            Logout
          </button>
        </header>

        <section className="room-grid">
          {rooms.length === 0 ? (
            <div className="empty-rooms">
              <h2>No rooms available</h2>
              <p>Please try again later.</p>
            </div>
          ) : (
            rooms.map((room) => (
              <button
                className="room-card"
                key={room.id}
                type="button"
                onClick={() => onSelectRoom(room)}
              >
                <span className="room-icon">#</span>

                <span className="room-information">
                  <strong>{room.name}</strong>
                  <small>Enter chat room</small>
                </span>

                <span className="room-arrow">→</span>
              </button>
            ))
          )}
        </section>
      </section>
    </main>
  );
}