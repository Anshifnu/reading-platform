import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/Api";
import {
  UserPlus, MessageSquare, Pencil, BookOpen,
  Coins, Users, TrendingUp, BadgeCheck, CheckCircle, X,
} from "lucide-react";

// ── Toast ──────────────────────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
    {toasts.map((t) => (
      <div
        key={t.id}
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border pointer-events-auto
          ${t.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : t.type === "info" ? "bg-sky-50 border-sky-200 text-sky-800"
              : "bg-red-50 border-red-200 text-red-800"}`}
        style={{ minWidth: 260 }}
      >
        <span className="text-lg">{t.type === "success" ? "✅" : t.type === "info" ? "ℹ️" : "❌"}</span>
        <p className="flex-1 text-sm font-semibold">{t.message}</p>
        <button onClick={() => removeToast(t.id)} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

const Profile = () => {
  const { authorId } = useParams();
  const navigate = useNavigate();
  const me = JSON.parse(localStorage.getItem("user") || "{}");

  const [profile, setProfile] = useState(null);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [requestSent, setRequestSent] = useState(false); // pending state
  const [toasts, setToasts] = useState([]);

  const isMyProfile = me.id === Number(authorId);
  const isFollowing = following.includes(Number(authorId));

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!authorId || authorId === "undefined") {
      console.error("❌ Invalid profile id:", authorId);
      return;
    }
    api.get(`profile/${authorId}/?t=${Date.now()}`).then(res => setProfile(res.data));
    api.get("my-following/").then(res => setFollowing(res.data));
    api.get(`followers-count/${authorId}/`).then(res => setFollowersCount(res.data.followers));
    api.get(`following-count/${authorId}/`).then(res => setFollowingCount(res.data.following));

    // Check if there's a pending follow request to this author
    api.get("my-pending-requests/")
      .then(res => {
        if (res.data.includes(Number(authorId))) {
          setRequestSent(true);
        }
      })
      .catch(err => console.error("Failed to check pending requests", err));
  }, [authorId]);

  const followUser = async () => {
    if (requestSent) return;
    try {
      await api.post("follow-request/", { following_id: authorId });
      setRequestSent(true);
      addToast("Follow request sent! Waiting for acceptance. 🙌", "success");
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to follow", "error");
    }
  };

  const startChat = async () => {
    try {
      setLoading(true);
      const res = await api.post("/chat/rooms/create/", {
        sender_role: me.role,
        receiver: { id: Number(authorId), role: profile.role },
      });
      navigate(`/chat/${res.data.room_id}`);
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to start chat", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state ─────────────────────────────────────
  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Toast toasts={toasts} removeToast={removeToast} />
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  // ── Stat cards config ─────────────────────────────────
  const stats = [
    profile.role === "reader"
      ? { icon: Coins, label: "Reader Coins", value: profile.coins ?? 0, gradient: "from-amber-500 to-yellow-500" }
      : { icon: Users, label: "Followers", value: followersCount, gradient: "from-sky-500 to-blue-600" },
    profile.role === "author" && isMyProfile
      ? { icon: TrendingUp, label: "Earnings (₹)", value: `₹${profile.earnings ?? 0}`, gradient: "from-emerald-500 to-teal-600" }
      : { icon: BookOpen, label: "Following", value: followingCount, gradient: "from-violet-500 to-indigo-600" },
  ];

  const roleBadge = {
    reader: { color: "bg-cyan-100 text-cyan-700 border-cyan-200", icon: "📖" },
    author: { color: "bg-violet-100 text-violet-700 border-violet-200", icon: "✍️" },
    admin: { color: "bg-rose-100 text-rose-700 border-rose-200", icon: "🛡️" },
  }[profile.role] ?? { color: "bg-gray-100 text-gray-600 border-gray-200", icon: "👤" };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── Hero / Cover Banner ── */}
      <div className="relative h-52 w-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0zNHY2aDZ2LTZoLTZ6TTYgNHY2aDZ2LTZINnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
      </div>

      {/* ── Profile Card ── */}
      <div className="max-w-3xl mx-auto px-4 -mt-24 pb-16 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

          {/* Avatar + Name Row */}
          <div className="px-8 pt-6 pb-6 flex flex-col sm:flex-row sm:items-end gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <img
                src={profile.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=0ea5e9&color=fff&size=128&bold=true`}
                alt="profile"
                className="w-28 h-28 rounded-2xl border-4 border-white object-cover shadow-lg"
              />
              {isFollowing && !isMyProfile && (
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-green-500 border-2 border-white" />
                </span>
              )}
            </div>

            {/* Name + role */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900 truncate">{profile.name}</h1>
                <BadgeCheck className="w-5 h-5 text-sky-500 shrink-0" />
              </div>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${roleBadge.color} capitalize`}>
                <span>{roleBadge.icon}</span> {profile.role}
              </span>
            </div>

            {/* Action button */}
            <div className="shrink-0">
              {isMyProfile ? (
                <button
                  onClick={() => navigate("/profile/edit")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-sky-200 text-sky-700 bg-sky-50 font-semibold text-sm hover:bg-sky-100 hover:border-sky-300 transition-all"
                >
                  <Pencil className="w-4 h-4" /> Edit Profile
                </button>
              ) : isFollowing ? (
                <button
                  onClick={startChat}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Connecting...</>
                  ) : (
                    <><MessageSquare className="w-4 h-4" /> Message</>
                  )}
                </button>
              ) : requestSent ? (
                <button
                  disabled
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-50 border-2 border-amber-200 text-amber-700 font-semibold text-sm cursor-default"
                >
                  <CheckCircle className="w-4 h-4" /> Request Sent
                </button>
              ) : (
                <button
                  onClick={followUser}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <UserPlus className="w-4 h-4" /> Follow
                </button>
              )}
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="h-px bg-gradient-to-r from-transparent via-sky-200 to-transparent mx-8" />

          {/* ── Bio ── */}
          <div className="px-8 py-6">
            <p className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-2">About</p>
            <p className="text-gray-600 leading-relaxed text-sm">
              {profile.bio || "This user hasn't shared a bio yet. Stay tuned! 🌟"}
            </p>
          </div>

          {/* ── Stats row ── */}
          <div className="grid grid-cols-2 gap-4 px-8 pb-8">
            {stats.map(({ icon: Icon, label, value, gradient }) => (
              <div
                key={label}
                className="bg-gray-50 rounded-2xl border border-gray-100 p-5 flex items-center gap-4"
              >
                <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-md shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;