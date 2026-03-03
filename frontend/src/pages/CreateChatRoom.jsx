import { useState } from "react";
import api from "../services/Api";

const CreateChatRoom = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  const [senderRole, setSenderRole] = useState(user?.role || "reader");
  const [receiverId, setReceiverId] = useState("");
  const [receiverRole, setReceiverRole] = useState("author");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const createRoom = async () => {
    setError("");
    setSuccess("");

    if (!receiverId) {
      setError("Receiver ID is required");
      return;
    }

    try {
      const res = await api.post("/chat/rooms/create/", {
        sender_role: senderRole,
        receiver: {
          id: Number(receiverId),
          role: receiverRole,
        },
      });

      setSuccess(`Room created! ID: ${res.data.room_id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create room");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>Create Chat Room</h3>

      <p><b>Your ID:</b> {user?.id}</p>
      <p><b>Your Role:</b> {senderRole}</p>

      <label>Receiver ID</label>
      <input
        type="number"
        value={receiverId}
        onChange={(e) => setReceiverId(e.target.value)}
      />

      <label>Receiver Role</label>
      <select
        value={receiverRole}
        onChange={(e) => setReceiverRole(e.target.value)}
      >
        <option value="author">Author</option>
        <option value="reader">Reader</option>
      </select>

      <button onClick={createRoom}>Create Room</button>

      {error && <p style={{ color: "red" }}>❌ {error}</p>}
      {success && <p style={{ color: "green" }}>✅ {success}</p>}
    </div>
  );
};

export default CreateChatRoom;
