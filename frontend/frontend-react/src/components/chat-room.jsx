import { useEffect, useRef, useState } from "react";

const API_URL = "http://127.0.0.1:8000";
const WEBSOCKET_URL = "ws://127.0.0.1:8000";

export function ChatRoom({
  room,
  token,
  onLeaveRoom,
}) {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [connectionStatus, setConnectionStatus] =
    useState("Connecting...");

  const socketRef = useRef(null);

  useEffect(() => {
    if (!room || !token) {
      return;
    }

    async function loadMessages() {
      try {
        const response = await fetch(
          `${API_URL}/messages/${room.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Could not load messages");
        }

        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error("Message loading error:", error);
      }
    }

    loadMessages();

    const socket = new WebSocket(
      `${WEBSOCKET_URL}/ws/rooms/${room.id}?token=${encodeURIComponent(token)}`
    );

    socketRef.current = socket;

    socket.onopen = () => {
      setConnectionStatus("Connected");
    };

    socket.onmessage = (event) => {
      const incomingMessage = JSON.parse(event.data);

      if (incomingMessage.type === "chat_message") {
        setMessages((currentMessages) => [
          ...currentMessages,
          incomingMessage,
        ]);
      }

      if (incomingMessage.type === "error") {
        console.error(incomingMessage.message);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("Connection error");
    };

    socket.onclose = () => {
      setConnectionStatus("Disconnected");
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [room, token]);

  function handleSubmit(event) {
    event.preventDefault();

    const content = messageInput.trim();
    const socket = socketRef.current;

    if (!content) {
      return;
    }

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected");
      return;
    }

    socket.send(
      JSON.stringify({
        content,
      })
    );

    setMessageInput("");
  }

  return (
    <main>
      <header>
        <button type="button" onClick={onLeaveRoom}>
          Back to rooms
        </button>

        <h1>{room.name}</h1>

        <span>{connectionStatus}</span>
      </header>

      <section>
        {messages.length === 0 ? (
          <p>No messages yet. Start the conversation!</p>
        ) : (
          messages.map((message) => (
            <article key={message.id}>
              <strong>
                {message.username ||
                  `User ${message.user_id}`}
              </strong>

              <p>{message.content}</p>
            </article>
          ))
        )}
      </section>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={messageInput}
          onChange={(event) =>
            setMessageInput(event.target.value)
          }
          placeholder={`Message ${room.name}`}
          maxLength={2000}
        />

        <button type="submit">
          Send
        </button>
      </form>
    </main>
  );
}