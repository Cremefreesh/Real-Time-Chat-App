export function RoomSelector({
  rooms,
  onSelectRoom,
  onLogout,
}) {
  return (
    <main>
      <header>
        <h1>Select a chat room</h1>

        <button type="button" onClick={onLogout}>
          Logout
        </button>
      </header>

      <section>
        {rooms.length === 0 ? (
          <p>No rooms are available yet.</p>
        ) : (
          rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => onSelectRoom(room)}
            >
              {room.name}
            </button>
          ))
        )}
      </section>
    </main>
  );
}