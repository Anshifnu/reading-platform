import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/Api";
import {
  Plus, Edit3, BookOpen, TrendingUp, Users, Calendar,
  ChevronRight, FileText, CheckCircle, XCircle, Clock, Search,
} from "lucide-react";

// ─── Status badge helper ───────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    pending: { label: "Pending", cls: "bg-yellow-100 text-yellow-700" },
    verified: { label: "Verified", cls: "bg-blue-100   text-blue-700" },
    approved: { label: "Approved", cls: "bg-green-100  text-green-700" },
    rejected: { label: "Rejected", cls: "bg-red-100    text-red-600" },
  };
  const { label, cls } = cfg[status] || cfg.pending;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
};

// ─── Status icon helper ────────────────────────────────────────────────────
const StatusIcon = ({ status }) => {
  if (status === "approved") return <CheckCircle className="w-4 h-4 text-green-600" />;
  if (status === "rejected") return <XCircle className="w-4 h-4 text-red-500" />;
  if (status === "verified") return <Search className="w-4 h-4 text-blue-500" />;
  return <Clock className="w-4 h-4 text-yellow-500" />;
};

const AuthorDashboard = () => {
  const navigate = useNavigate();
  const [works, setWorks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(true);
  const [stats, setStats] = useState({
    earnings: 0,
    totalWorks: 0,
    activeReaders: 0,
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.id) {
      fetchDashboardData(user.id);
    }
    fetchSubmissions();
  }, []);

  const fetchDashboardData = async (userId) => {
    try {
      const [worksRes, profileRes, followersRes] = await Promise.all([
        axios.get("/authors/my-works/"),
        axios.get(`/profile/${userId}/`),
        axios.get(`/followers-count/${userId}/`),
      ]);

      setWorks(worksRes.data);
      setStats({
        totalWorks: worksRes.data.length,
        earnings: profileRes.data.earnings || 0,
        activeReaders: followersRes.data.followers || 0,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const res = await axios.get("/submissions/");
      // Backend returns array directly (or results from pagination)
      setSubmissions(res.data.results || res.data || []);
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
    } finally {
      setSubLoading(false);
    }
  };

  const handleEditWork = (work) => {
    navigate("/write", { state: { workToEdit: work } });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div>
            <h5 className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-2">Workspace</h5>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900">Author Studio</h1>
          </div>
          <div className="flex gap-3 mt-6 md:mt-0">
            <button
              onClick={() => navigate("/write")}
              className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Create New Story</span>
            </button>
            <button
              onClick={() => navigate("/submit-book")}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-full hover:bg-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">Submit Book (PDF)</span>
            </button>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Earnings */}
          <div className="bg-white p-8 rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 hover:border-indigo-100 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-green-50 rounded-xl text-green-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lifetime</span>
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-1">₹{stats.earnings.toLocaleString()}</h3>
            <p className="text-sm text-gray-500 font-medium">Total Earnings</p>
          </div>

          {/* Works */}
          <div className="bg-white p-8 rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 hover:border-indigo-100 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Library</span>
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-1">{stats.totalWorks}</h3>
            <p className="text-sm text-gray-500 font-medium">Published Works</p>
          </div>

          {/* Readers */}
          <div className="bg-white p-8 rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 hover:border-indigo-100 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Audience</span>
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-1">{stats.activeReaders}</h3>
            <p className="text-sm text-gray-500 font-medium">Active Followers</p>
          </div>
        </div>

        {/* ── My Book Submissions ── */}
        <div className="mb-16">
          <div className="mb-6 flex items-end justify-between border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-500" />
              My Book Submissions
            </h2>
            <button
              onClick={() => navigate("/submit-book")}
              className="text-sm text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1"
            >
              + Submit New
            </button>
          </div>

          {subLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <div className="mx-auto w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text-indigo-400">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No submissions yet</h3>
              <p className="text-gray-500 text-sm mb-6">Submit a book PDF for admin review and earn 50 coins on approval!</p>
              <button
                onClick={() => navigate("/submit-book")}
                className="text-indigo-600 font-bold hover:text-indigo-800"
              >
                Submit Your First Book →
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Book</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Submitted</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Admin Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                      {/* Title + cover */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {sub.cover_image ? (
                            <img
                              src={sub.cover_image}
                              alt={sub.title}
                              className="w-9 h-12 object-cover rounded shadow-sm"
                            />
                          ) : (
                            <div className="w-9 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded shadow-sm flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 max-w-[180px] truncate">{sub.title}</p>
                            <p className="text-xs text-gray-400">{sub.author || "—"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4 text-gray-500">
                        {sub.category_name || sub.suggested_category_name
                          ? (
                            <span className={sub.suggested_category_name && !sub.category_name ? "text-blue-600 font-medium" : ""}>
                              {sub.category_name || `★ ${sub.suggested_category_name}`}
                            </span>
                          )
                          : <span className="text-gray-300">—</span>
                        }
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-gray-400 whitespace-nowrap">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <StatusIcon status={sub.status} />
                          <StatusBadge status={sub.status} />
                        </div>
                        {sub.status === "approved" && (
                          <p className="text-xs text-green-600 mt-0.5 font-medium">🪙 +50 coins earned</p>
                        )}
                      </td>

                      {/* Admin feedback */}
                      <td className="px-5 py-4">
                        {sub.admin_feedback ? (
                          <p className="text-sm text-red-600 max-w-[220px] line-clamp-2" title={sub.admin_feedback}>
                            {sub.admin_feedback}
                          </p>
                        ) : (
                          <span className="text-gray-300 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Publications (Written Works) ── */}
        <div className="mb-8 flex items-end justify-between border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-serif font-bold text-gray-900">Your Publications</h2>
          <span className="text-sm text-gray-500 font-medium">{works.length} Stories</span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : works.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <Edit3 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No stories yet</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">Your audience is waiting. Start writing your first masterpiece.</p>
            <button
              onClick={() => navigate("/write")}
              className="text-indigo-600 font-bold hover:text-indigo-800"
            >
              Start Writing &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {works.map((work) => (
              <div
                key={work.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full"
                onClick={() => handleEditWork(work)}
              >
                <div className="aspect-[16/9] w-full bg-gray-100 overflow-hidden relative">
                  {work.image ? (
                    <img
                      src={work.image}
                      alt={work.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                      <BookOpen className="w-12 h-12 opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-gray-800 shadow-sm">
                    {work.category || "General"}
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors font-serif">
                      {work.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">
                      {work.summary || "No summary available for this story."}
                    </p>
                  </div>

                  <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-400 gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(work.created_at).toLocaleDateString()}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditWork(work); }}
                      className="flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Edit <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default AuthorDashboard;
