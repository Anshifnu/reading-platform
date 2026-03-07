import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/Api";

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("access_token");

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [connected, setConnected] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [receiverName, setReceiverName] = useState("");
  const [receiverId, setReceiverId] = useState(null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch Receiver Name
  useEffect(() => {
    if (!roomId || !token) return;


    api.get(`/chat/rooms/${roomId}/`)
      .then(async (res) => {
        const participants = res.data.participants;
        const other = participants.find(p => p.user_id !== user.id);
        if (other) {
          setReceiverId(other.user_id);
          try {
            const profile = await api.get(`/profile/${other.user_id}/`);
            setReceiverName(profile.data.name || "Chat Room");
          } catch (e) {
            console.error("Failed to fetch profile", e);
          }
        }
      })
      .catch(e => console.error("Failed to fetch room", e));
  }, [roomId, token, user.id]);

  useEffect(() => {
    // Load old messages
    api.get(`/chat/rooms/${roomId}/messages/`)
      .then(res => {
        const normalized = res.data.map(m => ({
          id: m.id,
          sender: m.sender ?? m.sender_id,
          message: m.message ?? m.content,
          attachment: m.attachment,
          message_type: m.message_type ?? (m.attachment ? (m.attachment.endsWith('.mp4') ? 'video' : 'image') : 'text'),
          time: m.time ?? m.created_at
        }));
        setMessages(normalized);
      })
      .catch(console.error);

    if (!token) {
      console.error("❌ No JWT token found");
      return;
    }

    const apiBase = process.env.REACT_APP_API_URL || window.location.origin;
    const WS_URL_BASE = apiBase.replace(/^http/, "ws");

    socketRef.current = new WebSocket(
      `${WS_URL_BASE}/ws/chat/${roomId}/?token=${token}`
    );

    socketRef.current.onopen = () => {
      console.log("✅ WebSocket connected");
      setConnected(true);
    };

    socketRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.error) {
        alert(data.error);
        return;
      }

      setMessages(prev => [...prev, {
        ...data,
        // Ensure consistent structure for new messages
        message_type: data.message_type ?? (data.attachment ? 'image' : 'text'),
        time: data.created_at // Normalize created_at to time for isDeletable check
      }]);
    };

    socketRef.current.onerror = (e) => {
      console.error("❌ WebSocket error", e);
    };

    socketRef.current.onclose = () => {
      console.log("❌ WebSocket closed");
      setConnected(false);
    };

    return () => socketRef.current?.close();
  }, [roomId, token]);

  const handleFileUpload = async () => {
    if (!file) return null;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await api.post("/chat/upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setUploading(false);
      return res.data; // { url, filename }
    } catch (err) {
      console.error("Upload failed", err);
      setUploading(false);
      alert("File upload failed");
      return null;
    }
  };

  const sendMessage = async () => {
    // Determine type
    let msgType = "text";
    let attachmentData = null;

    if (file) {
      // Upload first
      const uploadRes = await handleFileUpload();
      if (!uploadRes) return;

      attachmentData = uploadRes.filename; // Sending filename/path for consumer to save? 
      // OR sending the full URL to the other user directly?
      // Consumer expects 'attachment' to save to DB.

      // We need to determine if it's video or image
      if (file.type.startsWith("video/")) msgType = "video";
      else if (file.type.startsWith("image/")) msgType = "image";

      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      if (!text.trim()) return;
    }

    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      console.warn("❌ WebSocket not open");
      // Allow trying to send (maybe it reconnected or user just wants to try)
    }

    const payload = {
      message: text,
      message_type: msgType,
      attachment: attachmentData
    };

    try {
      socketRef.current.send(JSON.stringify(payload));
      setText("");
    } catch (e) {
      alert("Failed to send message: not connected");
    }
  };

  const deleteMessage = async (msgId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    try {
      await api.delete(`/chat/message/${msgId}/delete/`);
      // Remove from UI
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete");
    }
  };

  const isDeletable = (timestamp) => {
    if (!timestamp) return false;
    const msgTime = new Date(timestamp).getTime();
    const now = Date.now();
    return (now - msgTime) < 3600 * 1000; // 1 hour
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3
          onClick={() => receiverId && navigate(`/profile/${receiverId}`)}
          style={{ cursor: receiverId ? "pointer" : "default", textDecoration: receiverId ? "underline" : "none" }}
        >
          {receiverName || "Chat Room"}
        </h3>
        <span style={{ color: connected ? "#2ecc71" : "#e74c3c" }}>
          {connected ? "Online" : "Connecting..."}
        </span>
      </div>

      <div style={styles.chatWindow}>
        {messages.map((m, i) => {
          const isMe = m.sender === user.id;
          return (
            <div
              key={i}
              style={{
                ...styles.messageRow,
                justifyContent: isMe ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  ...styles.bubble,
                  backgroundColor: isMe ? "#007bff" : "#f1f0f0",
                  color: isMe ? "#fff" : "#000",
                  borderBottomRightRadius: isMe ? 0 : 20,
                  borderBottomLeftRadius: isMe ? 20 : 0,
                }}
              >
                {m.attachment && (
                  <div style={styles.mediaContainer}>
                    {(() => {
                      // Normalize URL
                      let mediaUrl = m.attachment;
                      if (!mediaUrl.startsWith("http") && !mediaUrl.startsWith("/media")) {
                        // It's likely just a filename from WebSocket immediate echo
                        // or a relative path without /media/
                        mediaUrl = `${process.env.REACT_APP_API_URL || ""}/media/chat_attachments/${mediaUrl}`;
                      } else if (mediaUrl.startsWith("/media")) {
                        // From API, it has /media/ prefix but needs domain
                        mediaUrl = `${process.env.REACT_APP_API_URL || ""}${mediaUrl}`;
                      }

                      return m.message_type === "video" ? (
                        <video src={mediaUrl} controls style={styles.media} />
                      ) : (
                        <img src={mediaUrl} alt="attachment" style={styles.media} />
                      );
                    })()}
                  </div>
                )}

                {/* Text Content */}
                {m.message && <p style={{ margin: 0 }}>{m.message}</p>}

                {/* Footer: Time & Delete */}
                <div style={styles.bubbleFooter}>
                  <span style={{ fontSize: "0.7em", opacity: 0.8 }}>
                    {m.time ? new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                  </span>
                  {isMe && m.id && isDeletable(m.time) && (
                    <button
                      onClick={() => deleteMessage(m.id)}
                      style={styles.deleteBtn}
                      title="Delete message"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputArea}>
        <div style={{ marginRight: 10, position: 'relative' }}>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files[0])}
            accept="image/*,video/*"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            style={styles.iconBtn}
            title="Attach file"
          >
            📎
          </button>
          {file && (
            <div style={styles.filePreview}>
              {file.name}
              <button onClick={() => { setFile(null); fileInputRef.current.value = "" }} style={styles.xBtn}>×</button>
            </div>
          )}
        </div>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={file ? "Add a caption..." : "Type message..."}
          style={styles.input}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />

        <button
          onClick={sendMessage}
          disabled={uploading || (!text.trim() && !file)}
          style={styles.sendBtn}
        >
          {uploading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "90vh",
    maxWidth: "800px",
    margin: "0 auto",
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  header: {
    padding: "15px 20px",
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderTopLeftRadius: "10px",
    borderTopRightRadius: "10px",
  },
  chatWindow: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    backgroundColor: "#fafafa",
  },
  messageRow: {
    display: "flex",
    marginBottom: "15px",
  },
  bubble: {
    maxWidth: "70%",
    padding: "10px 15px",
    borderRadius: "20px",
    position: "relative",
    wordBreak: "break-word",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },
  bubbleFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "5px",
    gap: "10px"
  },
  deleteBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
    padding: 0,
    opacity: 0.6,
    transition: "opacity 0.2s"
  },
  mediaContainer: {
    marginBottom: "10px",
    borderRadius: "10px",
    overflow: "hidden",
  },
  media: {
    maxWidth: "100%",
    maxHeight: "200px",
    display: "block",
  },
  inputArea: {
    padding: "15px",
    borderTop: "1px solid #eee",
    display: "flex",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomLeftRadius: "10px",
    borderBottomRightRadius: "10px",
  },
  input: {
    flex: 1,
    padding: "12px",
    borderRadius: "25px",
    border: "1px solid #ddd",
    marginRight: "10px",
    outline: "none",
    fontSize: "15px",
  },
  sendBtn: {
    padding: "10px 20px",
    borderRadius: "25px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background 0.2s",
  },
  iconBtn: {
    background: "#f0f2f5",
    border: "none",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    cursor: "pointer",
    fontSize: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  filePreview: {
    position: "absolute",
    bottom: "50px",
    left: 0,
    backgroundColor: "#333",
    color: "#fff",
    padding: "5px 10px",
    borderRadius: "5px",
    fontSize: "12px",
    whiteSpace: "nowrap",
  },
  xBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    marginLeft: "5px",
    cursor: "pointer",
  }
};

export default ChatRoom;
