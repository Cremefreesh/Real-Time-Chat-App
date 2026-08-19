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

  // Tracks messages waiting for an ACK.
  //
  // {
  //   "uuid-123": {
  //      content: "hello",
  //      timeoutId: ...
  //   }
  // }
  const pendingMessagesRef = useRef({});

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

        setMessages(
          Array.isArray(data)
            ? data.map((message) => ({
                ...message,
                delivery_status: "sent",
              }))
            : []
        );
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

        // ---------------------------------------------
        // Normal chat message
        // ---------------------------------------------

        if (incomingMessage.type === "chat_message") {
          setMessages((currentMessages) => {
            const existingIndex =
              currentMessages.findIndex(
                (message) =>
                  message.client_message_id &&
                  message.client_message_id ===
                    incomingMessage.client_message_id
              );

            // If this is our own optimistic message,
            // replace it with the real server message.
            if (existingIndex !== -1) {
              const updatedMessages = [
                ...currentMessages,
              ];

              updatedMessages[existingIndex] = {
                ...incomingMessage,
                delivery_status: "sent",
              };

              return updatedMessages;
            }

            // Otherwise it came from another user.
            return [
              ...currentMessages,
              {
                ...incomingMessage,
                delivery_status: "sent",
              },
            ];
          });
        }

        // ---------------------------------------------
        // ACK
        // ---------------------------------------------

        if (incomingMessage.type === "message_ack") {
          const clientMessageId =
            incomingMessage.client_message_id;

          console.log(
            "MESSAGE ACK:",
            clientMessageId,
            incomingMessage.status
          );

          const pendingMessage =
            pendingMessagesRef.current[
              clientMessageId
            ];

          if (pendingMessage?.timeoutId) {
            clearTimeout(
              pendingMessage.timeoutId
            );
          }

          delete pendingMessagesRef.current[
            clientMessageId
          ];

          setMessages((currentMessages) =>
            currentMessages.map((message) => {
              if (
                message.client_message_id !==
                clientMessageId
              ) {
                return message;
              }

              return {
                ...message,
                id:
                  incomingMessage.message_id ??
                  message.id,
                delivery_status:
                  incomingMessage.status ===
                  "duplicate"
                    ? "sent"
                    : "sent",
              };
            })
          );
        }

        // ---------------------------------------------
        // Moderation
        // ---------------------------------------------

        if (
          incomingMessage.type ===
          "moderation_warning"
        ) {
          const clientMessageId =
            incomingMessage.client_message_id;

          const pendingMessage =
            pendingMessagesRef.current[
              clientMessageId
            ];

          if (pendingMessage?.timeoutId) {
            clearTimeout(
              pendingMessage.timeoutId
            );
          }

          delete pendingMessagesRef.current[
            clientMessageId
          ];

          setMessages((currentMessages) =>
            currentMessages.map((message) =>
              message.client_message_id ===
              clientMessageId
                ? {
                    ...message,
                    delivery_status: "blocked",
                  }
                : message
            )
          );

          console.warn(
            "Message blocked:",
            incomingMessage.reason
          );
        }

        // ---------------------------------------------
        // Server-side error
        // ---------------------------------------------

        if (
          incomingMessage.type ===
          "message_error"
        ) {
          const clientMessageId =
            incomingMessage.client_message_id;

          if (clientMessageId) {
            const pendingMessage =
              pendingMessagesRef.current[
                clientMessageId
              ];

            if (pendingMessage?.timeoutId) {
              clearTimeout(
                pendingMessage.timeoutId
              );
            }

            delete pendingMessagesRef.current[
              clientMessageId
            ];

            setMessages((currentMessages) =>
              currentMessages.map((message) =>
                message.client_message_id ===
                clientMessageId
                  ? {
                      ...message,
                      delivery_status: "failed",
                    }
                  : message
              )
            );
          }

          console.error(
            incomingMessage.message
          );
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

      Object.values(
        pendingMessagesRef.current
      ).forEach((pendingMessage) => {
        if (pendingMessage.timeoutId) {
          clearTimeout(
            pendingMessage.timeoutId
          );
        }
      });

      pendingMessagesRef.current = {};
    };
  }, [room, token]);

  useEffect(() => {
    bottomOfMessagesRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  function sendMessage(
    clientMessageId,
    content
  ) {
    const socket = socketRef.current;

    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN
    ) {
      console.error(
        "WebSocket is not connected"
      );

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.client_message_id ===
          clientMessageId
            ? {
                ...message,
                delivery_status: "failed",
              }
            : message
        )
      );

      return;
    }

    socket.send(
      JSON.stringify({
        client_message_id: clientMessageId,
        content,
      })
    );

    // If no ACK arrives within 5 seconds,
    // retry using the SAME client_message_id.
    const timeoutId = setTimeout(() => {
      console.warn(
        "ACK timeout. Retrying:",
        clientMessageId
      );

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.client_message_id ===
          clientMessageId
            ? {
                ...message,
                delivery_status: "retrying",
              }
            : message
        )
      );

      sendMessage(
        clientMessageId,
        content
      );
    }, 5000);

    pendingMessagesRef.current[
      clientMessageId
    ] = {
      content,
      timeoutId,
    };
  }

  function handleSubmit(event) {
    event.preventDefault();

    const content = messageInput.trim();

    if (!content) {
      return;
    }

    const socket = socketRef.current;

    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN
    ) {
      console.error(
        "WebSocket is not connected"
      );
      return;
    }

    const clientMessageId =
      crypto.randomUUID();

    // Optimistic message:
    // show it immediately before the server responds.
    const optimisticMessage = {
      client_message_id: clientMessageId,
      content,
      username: "You",
      room_id: room.id,
      created_at: new Date().toISOString(),
      delivery_status: "sending",
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      optimisticMessage,
    ]);

    sendMessage(
      clientMessageId,
      content
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
            <div className="empty-chat-icon">
              #
            </div>

            <h2>Welcome to {room.name}</h2>

            <p>
              This is the beginning of the
              conversation.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const username =
              message.username ||
              message.user?.username ||
              `User ${
                message.user_id ?? "Unknown"
              }`;

            const content =
              message.content ||
              message.message ||
              "";

            const messageKey =
              message.client_message_id ||
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
                    <strong>
                      {username}
                    </strong>

                    {message.created_at && (
                      <time>
                        {new Date(
                          message.created_at
                        ).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </time>
                    )}
                  </div>

                  <p>{content}</p>

                  {message.delivery_status ===
                    "sending" && (
                    <small>Sending...</small>
                  )}

                  {message.delivery_status ===
                    "retrying" && (
                    <small>
                      Retrying...
                    </small>
                  )}

                  {message.delivery_status ===
                    "failed" && (
                    <small>
                      Failed to send
                    </small>
                  )}

                  {message.delivery_status ===
                    "blocked" && (
                    <small>
                      Blocked by moderation
                    </small>
                  )}
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
              setMessageInput(
                event.target.value
              )
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