import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Bell } from "lucide-react";
import { useEffect } from "react";
import api from "../services/Api";
import { onMessage } from "firebase/messaging";
import { messaging } from "../pages/firebase"

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const role = user?.role;
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [isShining, setIsShining] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadNotifications();
      if (role === "author") fetchPendingRequests();
    }
  }, [isAuthenticated, location.pathname, role]); // Add location.pathname & role

  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Push received:", payload);

      // Increase unread count
      setUnreadCount(prev => prev + 1);

      // Trigger shining animation
      setIsShining(true);

      // Stop shining after 3 seconds
      setTimeout(() => {
        setIsShining(false);
      }, 3000);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);


  const fetchUnreadNotifications = async () => {
    try {
      const res = await api.get("/notifications/");
      const unread = res.data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed to fetch notifications");
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await api.get("follow-requests/pending/");
      setPendingRequestsCount(res.data.length);
    } catch (err) {
      console.error("Failed to fetch pending requests");
    }
  };


  const handleLogout = async () => {
    await logout();
    navigate("/login");
    setProfileOpen(false);
    setMobileMenuOpen(false);
  };


  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-sky-100 border-b border-sky-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Link
                to="/"
                className="flex items-center space-x-3 group"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg">
                  <span className="text-xl text-white">📚</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  ReadSphere
                </span>
              </Link>
            </div>

            {/* Desktop Navigation - Center */}
            <div className="hidden lg:flex items-center space-x-1">
              {/* Common Links (hidden for admin) */}
              {role !== "admin" && (
                <>
                  <Link
                    to="/"
                    className="nav-link-desktop"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex items-center space-x-2">
                      <span>🏠</span>
                      <span className="text-gray-900">Home</span>
                    </span>
                  </Link>
                  <Link
                    to="/books"
                    className="nav-link-desktop"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex items-center space-x-2">
                      <span>📖</span>
                      <span className="text-gray-900">Books</span>
                    </span>
                  </Link>
                </>
              )}

              {/* Reader */}
              {role === "reader" && (
                <>
                  <Link
                    to="/authors"
                    className="nav-link-desktop"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex items-center space-x-2">
                      <span>📚</span>
                      <span className="text-gray-900">Authors</span>
                    </span>
                  </Link>
                  <Link
                    to="/updates"
                    className="nav-link-desktop"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex items-center space-x-2">
                      <span>✨</span>
                      <span className="text-gray-900">Daily Updates</span>
                    </span>
                  </Link>
                  <Link
                    to="/subscription"
                    className="nav-link-desktop"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex items-center space-x-2">
                      <span>⭐</span>
                      <span className="text-gray-900">Subscription</span>
                    </span>
                  </Link>
                </>
              )}

              {/* Publisher */}
              {role === "author" && (
                <>
                  <Link
                    to="/publisher"
                    className="nav-link-desktop"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex items-center space-x-2">
                      <span>📊</span>
                      <span className="text-gray-900">Dashboard</span>
                    </span>
                  </Link>
                  <Link
                    to="/favorites"
                    className="nav-link-desktop"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex items-center space-x-2">
                      <span>❤️</span>
                      <span className="text-gray-900">Favorite</span>
                    </span>
                  </Link>
                  <Link
                    to="/authors"
                    className="nav-link-desktop"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex items-center space-x-2">
                      <span>👥</span>
                      <span className="text-gray-900">Authors</span>
                    </span>
                  </Link>
                  <Link
                    to="/updates"
                    className="nav-link-desktop"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex items-center space-x-2">
                      <span>✨</span>
                      <span className="text-gray-900">Daily Updates</span>
                    </span>
                  </Link>
                </>
              )}

              {/* Admin */}
              {role === "admin" && (
                <>
                  <Link
                    to="/admin"
                    className="nav-link-desktop"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex items-center space-x-2">
                      <span>👑</span>
                      <span className="text-gray-900">Admin</span>
                    </span>
                  </Link>
                  <Link
                    to="/admin/users"
                    className="nav-link-desktop"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex items-center space-x-2">
                      <span>👥</span>
                      <span className="text-gray-900">Users</span>
                    </span>
                  </Link>
                  <Link
                    to="/admin/books"
                    className="nav-link-desktop"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex items-center space-x-2">
                      <span>📚</span>
                      <span className="text-gray-900">Book Manage</span>
                    </span>
                  </Link>
                  <Link
                    to="/admin/analytics"
                    className="nav-link-desktop"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex items-center space-x-2">
                      <span>📊</span>
                      <span className="text-gray-900">Analytics</span>
                    </span>
                  </Link>
                </>
              )}

              {/* Notifications - Visible to all authenticated users */}
              {isAuthenticated && (
                <Link
                  to="/notifications"
                  className="nav-link-desktop relative"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex items-center space-x-2">
                    <span className={`text-xl ${isShining ? "animate-bounce" : ""}`}>🔔</span>

                    <span className="text-gray-900">Notifications</span>
                  </span>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </Link>
              )}
            </div>

            {/* Desktop Right Section */}
            <div className="hidden lg:flex items-center space-x-4">
              {/* Guest */}
              {!isAuthenticated && (
                <>
                  <Link
                    to="/login"
                    className="px-5 py-2.5 text-sm font-medium rounded-lg border border-blue-600 text-blue-700 hover:bg-blue-50 transition-colors duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/email-register"
                    className="px-5 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-500 to-sky-600 text-white hover:from-blue-600 hover:to-sky-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Get Started
                  </Link>
                </>
              )}

              {/* Logged in User Profile */}
              {isAuthenticated && (

                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-sky-200/50 transition-colors duration-200 group"
                  >
                    <div className="flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-sky-600 text-white font-semibold text-sm">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold text-gray-900">
                        {user?.username}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : role === "author"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-sky-100 text-sky-700"
                        }`}>
                        {role}
                      </span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Profile Dropdown */}
                  {profileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setProfileOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-sky-200 overflow-hidden z-50 animate-in slide-in-from-top-5 duration-200">
                        <div className="p-4 border-b border-sky-100">
                          <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                          <p className="text-xs text-gray-600">{user?.email}</p>
                        </div>

                        <div className="py-1">
                          {role === "admin" ? (
                            <Link
                              to="/admin/books"
                              className="dropdown-item"
                              onClick={() => setProfileOpen(false)}
                            >
                              <span>📚</span>
                              <span className="text-gray-900">Manage Books</span>
                            </Link>
                          ) : (
                            <Link
                              to={`/profile/${user.id}`}
                              className="dropdown-item"
                              onClick={() => setProfileOpen(false)}
                            >
                              <span>👤</span>
                              <span className="text-gray-900">Profile Settings</span>
                            </Link>
                          )}

                          {/* Reader */}
                          {role === "reader" && (
                            <>
                              <Link
                                to="/favorites"
                                className="dropdown-item"
                                onClick={() => setProfileOpen(false)}
                              >
                                <span>📚</span>
                                <span className="text-gray-900">My Library</span>
                              </Link>
                              <Link
                                to="/chat"
                                className="dropdown-item"
                                onClick={() => setProfileOpen(false)}
                              >
                                <span>💬</span>
                                <span className="text-gray-900">Messages</span>
                              </Link>
                            </>
                          )}

                          {/* Author */}
                          {role === "author" && (
                            <>
                              <Link
                                to="/readers-requests"
                                className="dropdown-item flex items-center justify-between"
                                onClick={() => setProfileOpen(false)}
                              >
                                <div className="flex items-center gap-2">
                                  <span>📥</span>
                                  <span className="text-gray-900">Requests</span>
                                </div>
                                {pendingRequestsCount > 0 && (
                                  <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                    {pendingRequestsCount}
                                  </span>
                                )}
                              </Link>
                              <Link
                                to="/chat"
                                className="dropdown-item"
                                onClick={() => setProfileOpen(false)}
                              >
                                <span>💬</span>
                                <span className="text-gray-900">Messages</span>
                              </Link>
                            </>
                          )}

                          {/* Admin */}
                          {role === "admin" && (
                            <>
                              <Link
                                to="/admin"
                                className="dropdown-item"
                                onClick={() => setProfileOpen(false)}
                              >
                                <span>👑</span>
                                <span className="text-gray-900">Admin Dashboard</span>
                              </Link>
                              <Link
                                to="/admin/users"
                                className="dropdown-item"
                                onClick={() => setProfileOpen(false)}
                              >
                                <span>👥</span>
                                <span className="text-gray-900">Manage Users</span>
                              </Link>
                            </>
                          )}

                          <div className="border-t border-sky-100 mt-1 pt-1">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-150"
                            >
                              <span>🚪</span>
                              <span>Logout</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex lg:hidden items-center space-x-3">

              {isAuthenticated && (
                <button
                  onClick={() => navigate("/notifications")}
                  className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-sky-100 transition duration-200"
                  title="Notifications"
                >
                  <span className="text-2xl">🔔</span>

                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}


              {isAuthenticated && (
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-sky-600 text-white font-semibold text-sm"
                  >
                    {user?.username?.charAt(0).toUpperCase()}
                  </button>

                  {profileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setProfileOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-sky-200 overflow-hidden z-50 animate-in slide-in-from-top-5 duration-200">
                        <div className="p-3 border-b border-sky-100">
                          <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                          <p className="text-xs text-gray-600 capitalize">{role}</p>
                        </div>
                        <div className="py-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                          >
                            <span>🚪</span>
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:bg-sky-200 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-sky-100 border-t border-sky-200 shadow-lg">
            <div className="px-4 pt-2 pb-3 space-y-1">
              {/* Common Links (hidden for admin) */}
              {role !== "admin" && (
                <>
                  <Link
                    to="/"
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>🏠</span>
                    <span className="text-gray-900">Home</span>
                  </Link>
                  <Link
                    to="/books"
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>📖</span>
                    <span className="text-gray-900">Books</span>
                  </Link>
                </>
              )}

              {/* Reader */}
              {role === "reader" && (
                <>
                  <Link
                    to="/library"
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>📚</span>
                    <span className="text-gray-900">My Library</span>
                  </Link>
                  <Link
                    to="/updates"
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>✨</span>
                    <span className="text-gray-900">Daily Updates</span>
                  </Link>
                  <Link
                    to="/subscription"
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>⭐</span>
                    <span className="text-gray-900">Subscription</span>
                  </Link>
                  <Link
                    to="/chat"
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>💬</span>
                    <span className="text-gray-900">Messages</span>
                  </Link>
                </>
              )}

              {/* Publisher */}
              {role === "author" && (
                <>
                  <Link
                    to="/publisher"
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>📊</span>
                    <span className="text-gray-900">Dashboard</span>
                  </Link>
                  <Link
                    to="/favorites"
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>❤️</span>
                    <span className="text-gray-900">Favorite</span>
                  </Link>
                  <Link
                    to="/authors"
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>👥</span>
                    <span className="text-gray-900">Authors</span>
                  </Link>
                  <Link
                    to="/updates"
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>✨</span>
                    <span className="text-gray-900">Daily Updates</span>
                  </Link>
                </>
              )}

              {/* Admin */}
              {role === "admin" && (
                <>
                  <Link
                    to="/admin"
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>👑</span>
                    <span className="text-gray-900">Admin</span>
                  </Link>
                  <Link
                    to="/admin/users"
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>👥</span>
                    <span className="text-gray-900">Users</span>
                  </Link>
                  <Link
                    to="/admin/books"
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>📚</span>
                    <span className="text-gray-900">Book Manage</span>
                  </Link>
                  <Link
                    to="/admin/analytics"
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>📊</span>
                    <span className="text-gray-900">Analytics</span>
                  </Link>
                </>
              )}

              {/* Guest Links */}
              {!isAuthenticated && (
                <div className="pt-4 space-y-2 border-t border-sky-200">
                  <Link
                    to="/login"
                    className="block px-4 py-3 text-center rounded-lg border border-blue-600 text-blue-700 hover:bg-blue-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/email-register"
                    className="block px-4 py-3 text-center rounded-lg bg-gradient-to-r from-blue-500 to-sky-600 text-white hover:from-blue-600 hover:to-sky-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Profile Link for Logged in Users */}
              {isAuthenticated && (
                role === "admin" ? (
                  <Link
                    to="/admin/books"
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>📚</span>
                    <span className="text-gray-900">Manage Books</span>
                  </Link>
                ) : (
                  <Link
                    to={`/profile/${user.id}`}
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>👤</span>
                    <span className="text-gray-900">Profile Settings</span>
                  </Link>
                )
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className="h-16 lg:h-20" />

      {/* Tailwind CSS for custom classes */}
      <style>{`
        .nav-link-desktop {
          display: inline-flex;
          align-items: center;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #4b5563;
          border-radius: 0.75rem;
          transition: all 0.2s ease;
        }
        
        .nav-link-desktop:hover {
          color: #111827;
          background-color: rgba(186, 230, 253, 0.5);
        }
        
        .dropdown-item {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: #374151;
          gap: 0.75rem;
          transition: background-color 0.15s ease;
        }
        
        .dropdown-item:hover {
          background-color: #f0f9ff;
        }
        
        .mobile-nav-link {
          display: flex;
          align-items: center;
          padding: 0.875rem 1rem;
          font-size: 1rem;
          font-weight: 500;
          color: #374151;
          border-radius: 0.75rem;
          gap: 0.75rem;
          transition: background-color 0.15s ease;
        }
        
        .mobile-nav-link:hover {
          background-color: rgba(186, 230, 253, 0.5);
        }
        
        @keyframes slide-in-from-top-5 {
          from {
            opacity: 0;
            transform: translateY(-0.5rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-in {
          animation: slide-in-from-top-5 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default Navbar;