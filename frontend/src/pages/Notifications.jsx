import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/Api";
import { Bell, CheckCircle, Trash2, FileText, BookOpen } from "lucide-react";

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications/");
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.post(`/notifications/${id}/read/`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        )
      );
    } catch (err) {
      console.error("Failed to mark as read");
    }
  };

  const removeNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await api.post(`/notifications/${id}/remove/`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to remove notification");
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.is_read) {
      try {
        await api.post(`/notifications/${n.id}/read/`);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === n.id ? { ...item, is_read: true } : item
          )
        );
      } catch (err) {
        console.error("Failed to mark read on click");
      }
    }

    if (n.type === "NEW_POST" && n.related_object_id) {
      navigate(`/work/${n.related_object_id}`);
    }
    if (n.type === "BOOK_APPROVED" && n.related_object_id) {
      navigate(`/book/${n.related_object_id}`);
    }
  };

  // Helper: icon + colour per notification type
  const getTypeStyle = (type) => {
    switch (type) {
      case "BOOK_APPROVED":
        return {
          bg: "bg-green-100",
          text: "text-green-700",
          icon: <BookOpen className="w-5 h-5" />,
        };
      case "BOOK_REJECTED":
        return {
          bg: "bg-red-100",
          text: "text-red-600",
          icon: <BookOpen className="w-5 h-5" />,
        };
      case "NEW_POST":
        return {
          bg: "bg-indigo-100",
          text: "text-indigo-600",
          icon: <FileText className="w-5 h-5" />,
        };
      case "COINS_ADDED":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-600",
          icon: <span className="w-5 h-5 flex items-center justify-center font-bold text-xs">🪙</span>,
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-500",
          icon: <Bell className="w-5 h-5" />,
        };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-slate-400">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
        <Bell className="w-6 h-6 text-blue-600" />
        Notifications
      </h1>

      {notifications.length === 0 ? (
        <p className="text-slate-500 text-center mt-20">
          You have no notifications
        </p>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => {
            const typeStyle = getTypeStyle(n.type);
            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`border rounded-xl p-5 flex justify-between items-start gap-4 cursor-pointer transition-colors
                  ${n.is_read ? "bg-white hover:bg-gray-50" : "bg-blue-50 border-blue-200 hover:bg-blue-100"}
                `}
              >
                <div className="flex gap-4">
                  {/* Type icon */}
                  <div className={`mt-1 p-2 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
                    {typeStyle.icon}
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">{n.title}</h3>
                    <p className="text-slate-600 text-sm mt-1">{n.message}</p>

                    {/* Extra badge for approved / rejected */}
                    {n.type === "BOOK_APPROVED" && (
                      <span className="inline-block mt-2 text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        ✅ Approved · +50 coins rewarded
                      </span>
                    )}
                    {n.type === "BOOK_REJECTED" && (
                      <span className="inline-block mt-2 text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        ❌ Rejected
                      </span>
                    )}

                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  {!n.is_read && (
                    <button
                      onClick={(e) => markAsRead(n.id, e)}
                      className="text-green-600 hover:text-green-700 p-1 hover:bg-green-50 rounded"
                      title="Mark as read"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}

                  <button
                    onClick={(e) => removeNotification(n.id, e)}
                    className="text-red-500 hover:text-red-600 p-1 hover:bg-red-50 rounded"
                    title="Remove"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notification;
