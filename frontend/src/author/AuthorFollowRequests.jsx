import { useEffect, useState } from "react";
import api from "../services/Api";

const AuthorFollowRequests = () => {
  const [requests, setRequests] = useState([]);
  const [processingId, setProcessingId] = useState({ id: null, status: "" });

  useEffect(() => {
    api.get("follow-requests/pending/")
      .then(res => setRequests(res.data))
      .catch(err => console.error("Error fetching requests", err));
  }, []);

  const respond = async (followId, action) => {
    // Show the visual feedback immediately
    setProcessingId({ id: followId, status: action === "ACCEPT" ? "Following" : "Rejected" });

    try {
      await api.post("follow-respond/", {
        follow_id: followId,
        action,
      });

      // Wait a brief moment so the user can actually see the "Following/Rejected" text
      setTimeout(() => {
        setRequests(prev => prev.filter(r => r.id !== followId));
        setProcessingId({ id: null, status: "" });
      }, 800);
    } catch (error) {
      console.error("Failed to respond", error);
      setProcessingId({ id: null, status: "" }); // Reset on error
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "20px auto", fontFamily: "sans-serif" }}>
      <h2 style={{ borderBottom: "2px solid #eee", paddingBottom: "10px" }}>Follow Requests</h2>

      {requests.length === 0 && <p style={{ color: "#666" }}>No pending requests.</p>}

      {requests.map(req => {
        const isProcessing = processingId.id === req.id;

        return (
          <div
            key={req.id}
            style={{
              border: "1px solid #eee",
              borderRadius: "8px",
              padding: "15px",
              marginBottom: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: isProcessing ? "#f9f9f9" : "#fff",
              transition: "all 0.3s ease"
            }}
          >
            <div>
              <span style={{ fontWeight: "bold", display: "block" }}>Reader</span>
              <small style={{ color: "#888" }}>ID: {req.follower_id}</small>
            </div>

            <div style={{ minWidth: "120px", textAlign: "right" }}>
              {isProcessing ? (
                <span style={{ 
                  fontWeight: "bold", 
                  color: processingId.status === "Following" ? "#2ecc71" : "#e74c3c",
                  fontSize: "0.9rem"
                }}>
                  {processingId.status}
                </span>
              ) : (
                <>
                  <button 
                    onClick={() => respond(req.id, "ACCEPT")}
                    style={buttonStyle("#2ecc71")}
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => respond(req.id, "REJECT")}
                    style={{ ...buttonStyle("#fff", "#e74c3c"), marginLeft: "8px" }}
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Simple helper for button styles
const buttonStyle = (bg, color = "white") => ({
  backgroundColor: bg,
  color: color,
  border: color !== "white" ? `1px solid ${color}` : "none",
  padding: "6px 12px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "0.85rem",
  fontWeight: "600"
});

export default AuthorFollowRequests; 