import { useEffect, useState } from "react";
import api from "../services/Api";
import { useNavigate } from "react-router-dom";

const ChatList = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [roomDetails, setRoomDetails] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    api.get("/chat/rooms/")
      .then(async (res) => {
        const roomData = res.data;
        setRooms(roomData);
        setFilteredRooms(roomData);
        setLoading(false);

        const details = {};
        for (const room of roomData) {
          const other = room.participants?.find(p => p.user_id !== user.id);
          if (other) {
            try {
              const profileRes = await api.get(`/profile/${other.user_id}/`);
              details[room.id] = {
                name: profileRes.data.name || "Unknown",
                avatar: profileRes.data.profile_image_url
              };
            } catch (e) {
              console.error(`Failed to fetch profile for room ${room.id}`, e);
              details[room.id] = { name: "Unknown" };
            }
          } else {
            details[room.id] = { name: "Chat Room" };
          }
        }
        setRoomDetails(details);
      })
      .catch(err => {
        console.error("Failed to fetch rooms", err);
        setLoading(false);
      });
  }, [user.id]);

  useEffect(() => {
    if (!search) {
      setFilteredRooms(rooms);
      return;
    }
    const lowerSearch = search.toLowerCase();
    const filtered = rooms.filter(room => {
      const name = roomDetails[room.id]?.name?.toLowerCase() || "";
      return name.includes(lowerSearch);
    });
    setFilteredRooms(filtered);
  }, [search, rooms, roomDetails]);

  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col h-[80vh]">

        {/* Header */}
        <div className="bg-white p-6 pb-4 border-b border-gray-100 sticky top-0 z-10">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Messages</h1>
            <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
              {rooms.length} Chats
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 sm:text-sm"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-gray-400 text-sm">Loading chats...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-gray-800 font-semibold mb-1">No conversations found</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">
                {search ? "Try adjusting your search terms." : "Start connecting with authors and readers!"}
              </p>
              {!search && (
                <button
                  onClick={() => navigate('/authors')}
                  className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-medium transition-colors shadow-md shadow-indigo-200"
                >
                  Find Authors
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredRooms.map((room) => {
                const details = roomDetails[room.id] || { name: "Loading..." };
                const initials = details.name !== "Loading..." && details.name !== "Unknown"
                  ? details.name.slice(0, 2).toUpperCase()
                  : "?";

                return (
                  <div
                    key={room.id}
                    onClick={() => navigate(`/chat/${room.id}`)}
                    className="group relative p-4 hover:bg-indigo-50/40 cursor-pointer transition-colors duration-200 border-l-4 border-transparent hover:border-indigo-500"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0 relative">
                        {details.avatar ? (
                          <img
                            src={details.avatar.startsWith('http') ? details.avatar : `http://localhost:8000${details.avatar}`}
                            alt={details.name}
                            className="w-14 h-14 rounded-full object-cover shadow-sm group-hover:shadow-md transition-shadow"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:shadow-md transition-shadow">
                            {initials}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h2 className="text-base font-bold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                            {details.name}
                          </h2>
                          {room.last_active && (
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {formatTime(room.last_active)}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-500 truncate group-hover:text-gray-700 transition-colors max-w-[85%]">
                            {room.last_message || <span className="italic text-gray-400">Media or no messages yet...</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-center">
          <button
            onClick={() => navigate('/authors')}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold flex items-center space-x-1 transition-colors"
          >
            <span>+ Start New Chat</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ChatList;