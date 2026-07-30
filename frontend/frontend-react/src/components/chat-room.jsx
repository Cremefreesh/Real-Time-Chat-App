import { useEffect, useRef, useState } from "react";
import "./chat-room.css";

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
  const bottomOfMessagesRef = useRef(null);

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

        console.log("Loaded messages:", data);

        setMessages(Array.isArray(data) ? data : []);
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
      console.log("WebSocket connected");
      setConnectionStatus("Connected");
    };

    socket.onmessage = (event) => {
      console.log("Raw WebSocket message:", event.data);

      try {
        const incomingMessage = JSON.parse(event.data);

        console.log(
          "Parsed WebSocket message:",
          incomingMessage
        );

        if (incomingMessage.type === "chat_message") {
          setMessages((currentMessages) => [
            ...currentMessages,
            incomingMessage,
          ]);
        }

        if (incomingMessage.type === "error") {
          console.error(incomingMessage.message);
        }
      } catch (error) {
        console.error(
          "Could not parse WebSocket message:",
          error
        );
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("Connection error");
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      setConnectionStatus("Disconnected");
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [room, token]);

  useEffect(() => {
    bottomOfMessagesRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

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
    <main className="chat-page">
      <header className="chat-header">
        <button
          className="back-button"
          type="button"
          onClick={onLeaveRoom}
        >
          ← Rooms
        </button>

        <div className="chat-room-details">
          <span className="room-hash">#</span>

          <div>
            <h1>{room.name}</h1>
            <p>Real-time conversation</p>
          </div>
        </div>

        <div className="connection-indicator">
          <span
            className={`connection-dot ${
              connectionStatus === "Connected"
                ? "connected"
                : ""
            }`}
          />

          {connectionStatus}
        </div>
      </header>

      <section className="message-feed">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-chat-icon">#</div>

            <h2>Welcome to {room.name}</h2>

            <p>
              This is the beginning of the conversation.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const username =
              message.username ||
              message.user?.username ||
              `User ${message.user_id ?? "Unknown"}`;

            const content =
              message.content ||
              message.message ||
              "";

            const messageKey =
              message.id ||
              message.message_id ||
              `${index}-${content}`;

            return (
              <article
                className="chat-message"
                key={messageKey}
              >
                <div className="message-avatar">
                  {username
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="message-body">
                  <div className="message-header">
                    <strong>{username}</strong>

                    {message.created_at && (
                      <time>
                        {new Date(
                          message.created_at
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    )}
                  </div>

                  <p>{content}</p>
                </div>
              </article>
            );
          })
        )}

        <div ref={bottomOfMessagesRef} />
      </section>

      <footer className="message-composer-wrapper">
        <form
          className="message-composer"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            value={messageInput}
            onChange={(event) =>
              setMessageInput(event.target.value)
            }
            placeholder={`Message #${room.name}`}
            maxLength={2000}
          />

          <button
            type="submit"
            disabled={
              !messageInput.trim() ||
              connectionStatus !== "Connected"
            }
          >
            Send
          </button>
        </form>
      </footer>
    </main>
  );
}