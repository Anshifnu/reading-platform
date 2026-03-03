import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/Api";
import { UserPlus, CheckCircle, Users, MessageSquare, X } from "lucide-react";

// ── Simple Toast Component ──────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
    {toasts.map((t) => (
      <div
        key={t.id}
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-sm pointer-events-auto
          transition-all duration-300 animate-in slide-in-from-right-5
          ${t.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : t.type === "info"
              ? "bg-sky-50 border-sky-200 text-sky-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        style={{ minWidth: 260 }}
      >
        <span className="text-lg">
          {t.type === "success" ? "✅" : t.type === "info" ? "ℹ️" : "❌"}
        </span>
        <p className="flex-1 text-sm font-semibold">{t.message}</p>
        <button
          onClick={() => removeToast(t.id)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

// ── Main Component ──────────────────────────────────────────────────────────
const AuthorList = () => {
  const [authors, setAuthors] = useState([]);
  const [following, setFollowing] = useState([]);      // accepted follows
  const [pendingIds, setPendingIds] = useState(new Set()); // sent but not accepted
  const [toasts, setToasts] = useState([]);
  const [chatLoading, setChatLoading] = useState(null);
  const navigate = useNavigate();

  const me = JSON.parse(localStorage.getItem("user") || "{}");

  // ── Toast helpers ──────────────────────────────────────────────────────
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    api.get("authors/listing/").then((res) => setAuthors(res.data));
    api.get("my-following/").then((res) => setFollowing(res.data));
    api.get("my-pending-requests/")
      .then((res) => setPendingIds(new Set(res.data)))
      .catch((err) => console.error("Failed to fetch pending requests", err));
  }, []);

  const followAuthor = async (authorId) => {
    // Prevent double-clicking
    if (pendingIds.has(authorId)) return;

    try {
      await api.post("follow-request/", { following_id: authorId });
      setPendingIds((prev) => new Set(prev).add(authorId));
      addToast("Follow request sent! Waiting for acceptance. 🙌", "success");
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to send follow request";
      addToast(msg, "error");
    }
  };

  const startChat = async (author) => {
    try {
      setChatLoading(author.user);
      const res = await api.post("/chat/rooms/create/", {
        sender_role: me.role,
        receiver: { id: author.user, role: author.role },
      });
      navigate(`/chat/${res.data.room_id}`);
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to start chat", "error");
    } finally {
      setChatLoading(null);
    }
  };

  // Filter out logged-in author so they don't see their own card
  const visibleAuthors = authors.filter((a) => a.user !== me.id);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 font-sans">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-1">Community</p>
            <h2 className="text-2xl font-bold text-gray-900">Explore Authors</h2>
          </div>
          <span className="text-sm text-sky-700 font-semibold bg-sky-100 border border-sky-200 px-3 py-1 rounded-full flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> {visibleAuthors.length} Authors
          </span>
        </div>

        {/* Empty State */}
        {visibleAuthors.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-sky-100">
            <Users className="w-12 h-12 text-sky-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No authors in the community yet.</p>
          </div>
        )}

        {/* Author Cards */}
        <div className="space-y-4">
          {visibleAuthors.map((author) => {
            const isAccepted = following.includes(author.user);
            const isPending = pendingIds.has(author.user);

            return (
              <div
                key={author.user}
                className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-sky-100 hover:shadow-md hover:border-sky-200 transition-all group"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={
                      author.profile_image_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=0ea5e9&color=fff&size=64&bold=true`
                    }
                    alt="profile"
                    className="w-14 h-14 rounded-xl object-cover ring-2 ring-sky-100 group-hover:ring-sky-300 transition-all"
                  />
                  {isAccepted && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{author.name}</h4>
                  <span className="text-xs font-semibold text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full capitalize">
                    ✍️ {author.role}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/profile/${author.user}`)}
                    className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 transition-colors"
                  >
                    View Profile
                  </button>

                  {isAccepted ? (
                    <button
                      onClick={() => startChat(author)}
                      disabled={chatLoading === author.user}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl hover:opacity-90 transition-all shadow-sm disabled:opacity-60"
                    >
                      {chatLoading === author.user ? (
                        <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> ...</>
                      ) : (
                        <><MessageSquare className="w-3.5 h-3.5" /> Message</>
                      )}
                    </button>
                  ) : isPending ? (
                    <button
                      disabled
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl cursor-default"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Request Sent
                    </button>
                  ) : (
                    <button
                      onClick={() => followAuthor(author.user)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl hover:opacity-90 hover:-translate-y-0.5 active:scale-95 transition-all shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Follow
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AuthorList;