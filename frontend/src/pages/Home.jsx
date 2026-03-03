import { useEffect, useRef, useState } from "react";
import api from "../services/Api";
import { useAuth } from "../context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Search, ChevronLeft, ChevronRight, MessageCircle, Send,
  User, Star, BookOpen, Calendar, ChevronDown, ChevronUp,
  Sparkles, TrendingUp, Users,
} from "lucide-react";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categorySearch, setCategorySearch] = useState("");
  const [newComment, setNewComment] = useState("");
  const [selectedRating, setSelectedRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedFeedback, setExpandedFeedback] = useState(null);
  const [currentWorkIndex, setCurrentWorkIndex] = useState(0);

  const categoryRef = useRef(null);
  const feedbackRef = useRef(null);

  // ── Auto-rotate works ──────────────────────────────────────────────
  useEffect(() => {
    if (works.length === 0) return;
    const interval = setInterval(() => {
      setCurrentWorkIndex((prev) => (prev + 1) % works.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [works.length]);

  // ── Submit feedback ────────────────────────────────────────────────
  const submitFeedback = async () => {
    if (!newComment.trim()) { setErrorMsg("Comment cannot be empty"); return; }
    if (selectedRating === 0) { setErrorMsg("Please select a rating"); return; }
    try {
      setSubmitting(true); setErrorMsg("");
      await api.post("/feedback/", { comment: newComment, rating: selectedRating });
      setNewComment(""); setSelectedRating(0);
      const res = await api.get("/feedback/");
      setFeedbacks(res.data);
    } catch (err) {
      if (err.response) {
        const data = err.response.data;
        if (typeof data === "string") setErrorMsg(data);
        else if (data.detail) setErrorMsg(data.detail);
        else { const k = Object.keys(data)[0]; setErrorMsg(data[k]?.[0] || "Something went wrong"); }
      } else { setErrorMsg("Network error. Please try again."); }
    } finally { setSubmitting(false); }
  };

  // ── Fetch data ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, fbRes, worksRes] = await Promise.all([
          api.get("/categories/"),
          api.get("/feedback/"),
          api.get("/authors/work-list/"),
        ]);
        setCategories(catRes.data);
        setFeedbacks(fbRes.data);
        setWorks(worksRes.data);
      } catch (err) {
        console.error("Failed to load home data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const diffInDays = Math.floor((new Date() - date) / 86400000);
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) { const w = Math.floor(diffInDays / 7); return `${w} ${w === 1 ? "week" : "weeks"} ago`; }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const calculateAverageRating = () => {
    if (feedbacks.length === 0) return 0;
    return (feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length).toFixed(1);
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const scroll = (ref, dir) => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  const toggleFeedbackExpand = (id) => setExpandedFeedback(expandedFeedback === id ? null : id);

  // 🔒 Admin redirect
  if (user?.role === "admin") return <Navigate to="/admin" replace />;

  const averageRating = calculateAverageRating();
  const visibleWorks = works.length > 0
    ? works.slice(currentWorkIndex, currentWorkIndex + 3).concat(
      works.slice(0, Math.max(0, 3 - (works.length - currentWorkIndex)))
    )
    : [];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">

      {/* ═══════════════════ HERO SECTION ═══════════════════ */}
      <section className="relative bg-gradient-to-br from-sky-100 via-blue-50 to-white border-b border-sky-200 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-sky-200/40 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-200/30 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 py-16 relative">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Hero text */}
            <div className="flex-1 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 border border-sky-300 text-sky-700 text-xs font-bold uppercase tracking-widest mb-5">
                <Sparkles className="w-3.5 h-3.5" /> Your Reading Universe
              </span>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
                Discover Stories That{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">
                  Move You
                </span>
              </h1>
              <p className="text-gray-500 text-lg mb-8 max-w-xl">
                Browse thousands of books across every genre. From timeless classics to fresh releases — your next favourite story is just a click away.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 lg:justify-start justify-center">
                <button
                  onClick={() => navigate("/books")}
                  className="px-7 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                >
                  <BookOpen className="w-5 h-5" /> Browse Books
                </button>
                {!user && (
                  <button
                    onClick={() => navigate("/email-register")}
                    className="px-7 py-3 border-2 border-sky-300 text-sky-700 font-semibold rounded-xl hover:bg-sky-50 transition-all duration-200"
                  >
                    Get Started Free
                  </button>
                )}
              </div>

              {/* Mini stats */}
              <div className="flex items-center gap-6 mt-8 lg:justify-start justify-center">
                {[
                  { icon: BookOpen, val: `${categories.length}+`, label: "Categories" },
                  { icon: Users, val: `${feedbacks.length}+`, label: "Reviews" },
                  { icon: TrendingUp, val: averageRating, label: "Avg Rating" },
                ].map(({ icon: Icon, val, label }) => (
                  <div key={label} className="text-center">
                    <div className="text-xl font-bold text-sky-600">{val}</div>
                    <div className="text-xs text-gray-400">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero recent works card */}
            <div className="w-full lg:w-80 shrink-0">
              <div className="bg-white rounded-2xl border border-sky-200 shadow-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Recent Works</h3>
                </div>
                <div className="space-y-3">
                  {visibleWorks.length > 0 ? visibleWorks.map((work, i) => (
                    <div
                      key={`${work.id}-${i}`}
                      onClick={() => navigate(`/work/${work.id}`)}
                      className="group flex gap-3 p-3 rounded-xl hover:bg-sky-50 cursor-pointer transition-colors border border-transparent hover:border-sky-200"
                    >
                      {work.image ? (
                        <img
                          src={work.image.startsWith("http") ? work.image : `${(process.env.REACT_APP_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "")}${work.image}`}
                          alt={work.title}
                          className="w-12 h-16 object-cover rounded-lg shrink-0 shadow-sm"
                          onError={(e) => e.target.style.display = "none"}
                        />
                      ) : (
                        <div className="w-12 h-16 bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg shrink-0 flex items-center justify-center shadow-sm">
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-sky-600 transition-colors">{work.title}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">{work.author_name || `Author ${work.author}`}</p>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{work.summary}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-gray-400 text-sm text-center py-4">No works yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* ═══════════════════ CATEGORIES SECTION ═══════════════════ */}
        <section className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-1">Explore</p>
              <h2 className="text-3xl font-bold text-gray-900">Browse Categories</h2>
              <p className="text-gray-500 mt-1">Find your next great read by genre</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-sky-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400 outline-none transition-all text-sm shadow-sm"
              />
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => scroll(categoryRef, "left")}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 bg-white border border-sky-200 rounded-full w-10 h-10 shadow-md hover:shadow-lg hover:border-sky-400 hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-sky-500"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div ref={categoryRef} className="flex gap-5 overflow-x-auto px-1 scrollbar-hide pb-2">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex-shrink-0 w-48 group cursor-pointer"
                  onClick={() => navigate(`/books?category=${encodeURIComponent(category.name)}`)}
                >
                  <div className="bg-white border border-sky-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden hover:-translate-y-1">
                    <div className="relative w-full h-44 overflow-hidden bg-sky-50">
                      {category.images?.length > 0 ? (
                        <img
                          src={category.images[0].image}
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-100">
                          <BookOpen className="w-12 h-12 text-sky-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-sky-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
                        <span className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 text-xs font-semibold text-gray-900">
                          View Books →
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 truncate text-sm">{category.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{category.book_count} books</p>
                      <button className="mt-3 w-full py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">
                        Explore
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => scroll(categoryRef, "right")}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 bg-white border border-sky-200 rounded-full w-10 h-10 shadow-md hover:shadow-lg hover:border-sky-400 hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-sky-500"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* ═══════════════════ REVIEWS SECTION ═══════════════════ */}
        <section className="bg-gradient-to-br from-sky-50 to-white rounded-3xl border border-sky-200 p-8 mb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg mb-4">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">What Our Readers Say</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">
              Join thousands of readers sharing their experiences with our book collection
            </p>
          </div>

          {/* Review stats */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-10">
            {[
              {
                val: averageRating,
                label: "Avg Rating",
                sub: [...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(averageRating) ? "text-yellow-400 fill-current" : "text-gray-200"}`} />
                )),
              },
              { val: feedbacks.length, label: "Total Reviews", sub: null },
              {
                val: feedbacks.length > 0
                  ? `${Math.round((feedbacks.filter(fb => fb.rating >= 4).length / feedbacks.length) * 100)}%`
                  : "0%",
                label: "Recommended",
                sub: null,
              },
            ].map(({ val, label, sub }) => (
              <div key={label} className="bg-white rounded-2xl border border-sky-100 p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-gray-900">{val}</div>
                {sub && <div className="flex justify-center gap-0.5 my-1">{sub}</div>}
                <p className="text-xs text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Feedback cards carousel */}
          <div className="relative">
            <button
              onClick={() => scroll(feedbackRef, "left")}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 bg-white border border-sky-200 rounded-full w-10 h-10 shadow-md hover:shadow-lg hover:border-sky-400 hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-sky-500"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div ref={feedbackRef} className="flex gap-5 overflow-x-auto px-1 scrollbar-hide pb-3">
              {feedbacks.map((fb) => (
                <div key={fb.id} className="flex-shrink-0 w-80">
                  <div className="bg-white rounded-2xl border border-sky-100 shadow-sm hover:shadow-md transition-all h-full flex flex-col p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-base shrink-0">
                          {fb.user?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">{fb.user}</h4>
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < fb.rating ? "text-yellow-400 fill-current" : "text-gray-200"}`} />
                            ))}
                            <span className="text-xs text-gray-400 ml-1">{fb.rating}.0</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded-full font-semibold shrink-0">
                        Verified
                      </span>
                    </div>

                    <p className={`text-gray-600 text-sm leading-relaxed break-words flex-1 ${expandedFeedback === fb.id ? "" : "line-clamp-3"}`}>
                      "{fb.comment}"
                    </p>

                    {fb.comment.length > 150 && (
                      <button
                        onClick={() => toggleFeedbackExpand(fb.id)}
                        className="mt-2 text-sky-600 hover:text-sky-700 text-xs font-semibold flex items-center gap-1"
                      >
                        {expandedFeedback === fb.id ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Read more</>}
                      </button>
                    )}

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-sky-50 text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />{formatDate(fb.created_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />Helpful
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => scroll(feedbackRef, "right")}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 bg-white border border-sky-200 rounded-full w-10 h-10 shadow-md hover:shadow-lg hover:border-sky-400 hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-sky-500"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* ═══════════════════ WRITE A REVIEW ═══════════════════ */}
        <section className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl border border-sky-200 shadow-sm p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg mb-4">
                <Send className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Share Your Experience</h3>
              <p className="text-gray-500 text-sm">Your feedback helps us improve your reading journey</p>
            </div>

            {user ? (
              <>
                {/* Rating */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                    Your Rating *
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setSelectedRating(rating)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 transition-all text-sm font-semibold
                          ${selectedRating >= rating
                            ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                            : "border-gray-200 bg-gray-50 text-gray-400 hover:border-sky-300 hover:bg-sky-50"}`}
                      >
                        <Star className={`w-4 h-4 ${selectedRating >= rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
                        {rating}
                      </button>
                    ))}
                    <span className="text-sm text-gray-400 ml-2">
                      {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][selectedRating] || "Select a rating"}
                    </span>
                  </div>
                </div>

                {/* Comment */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Your Review *</label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="What did you think of our book collection? Share your thoughts..."
                    rows={4}
                    className="w-full p-4 bg-gray-50 border border-sky-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400 outline-none transition-all resize-none text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{200 - newComment.length} characters remaining</p>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{errorMsg}</div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">Your honest review helps other readers</p>
                  <button
                    onClick={submitFeedback}
                    disabled={submitting || !newComment.trim() || selectedRating === 0}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-sm hover:shadow-md hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {submitting ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</>
                    ) : (
                      <><Send className="w-4 h-4" />Post Review</>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sky-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-sky-400" />
                </div>
                <p className="text-gray-500 mb-5 text-sm">Join our community of readers to share your experience</p>
                <button
                  onClick={() => navigate("/login")}
                  className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold shadow-sm hover:shadow-md hover:opacity-90 transition-all"
                >
                  Login to Share Review
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-sky-50/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-14 h-14 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sky-600 font-semibold text-sm">Loading your reading experience...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;