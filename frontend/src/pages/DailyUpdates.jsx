import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/Api";
import { ArrowRight, Sparkles, PenTool, Image as ImageIcon, Search, ChevronRight, Clock, User, Bookmark } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const DailyUpdates = () => {
    const [works, setWorks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const fetchUpdates = async () => {
            try {
                const res = await api.get("/authors/work-list/");
                setWorks(res.data);
            } catch (err) {
                console.error("Failed to load daily updates", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUpdates();
    }, []);

    // Extract unique categories
    const categories = ["All", ...new Set(works.map(w => w.category).filter(Boolean))];

    const filteredWorks = works.filter((work) => {
        const matchesSearch = work.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            work.author_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            work.summary?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = activeCategory === "All" || work.category === activeCategory;

        return matchesSearch && matchesCategory;
    });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fafcff]">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-sky-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-sky-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafcff] font-sans selection:bg-sky-200">

            {/* ═ HERO SECTION ═════════════════════════════════ */}
            <div className="relative pt-32 pb-24 overflow-hidden border-b border-gray-100 bg-white">
                {/* Abstract Background Elements */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-sky-50 to-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-80" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-50 to-purple-50/50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 opacity-80" />

                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12">

                        <div className="flex-1 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 border border-sky-100 text-sky-700 text-sm font-semibold tracking-wide mb-8 shadow-sm">
                                <Sparkles className="w-4 h-4 text-sky-500" />
                                <span>Discover Fresh Stories</span>
                            </div>

                            <h1 className="text-5xl lg:text-7xl font-extrabold text-[#0f172a] tracking-tight leading-[1.1] mb-6">
                                The Author's <br className="hidden lg:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">
                                    Daily Canvas
                                </span>
                            </h1>

                            <p className="text-xl text-slate-500 max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed font-light">
                                Immerse yourself in the latest chapters, poems, and short stories crafted beautifully by our community of masterful authors.
                            </p>

                            {/* Search & Actions */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 max-w-2xl mx-auto lg:mx-0">
                                <div className="relative w-full group">
                                    <div className="absolute inset-0 bg-sky-100 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                    <div className="relative flex items-center w-full bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="pl-5 text-gray-400">
                                            <Search className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search by title, author, or keyword..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-3 pr-6 py-4 bg-transparent border-none text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0 text-lg"
                                        />
                                    </div>
                                </div>

                                {user?.role === "author" && (
                                    <button
                                        onClick={() => navigate("/write")}
                                        className="w-full sm:w-auto shrink-0 px-8 py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-semibold shadow-lg shadow-gray-900/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3 active:scale-95"
                                    >
                                        <PenTool className="w-5 h-5" />
                                        <span>Publish</span>
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* ═ MAIN CONTENT ═════════════════════════════════ */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">

                {/* Category Pills */}
                {categories.length > 1 && (
                    <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-10 scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeCategory === cat
                                        ? "bg-slate-800 text-white shadow-md scale-105"
                                        : "bg-white text-slate-600 border border-slate-200 hover:border-sky-300 hover:bg-sky-50"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                {/* Grid */}
                {filteredWorks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-12">
                        {filteredWorks.map((work) => (
                            <div
                                key={work.id}
                                onClick={() => navigate(`/work/${work.id}`)}
                                className="group relative bg-white rounded-[2rem] border border-gray-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 cursor-pointer overflow-hidden flex flex-col hover:-translate-y-1"
                            >
                                {/* Cover Image Container */}
                                <div className="aspect-[4/3] w-full relative overflow-hidden bg-slate-50 p-2">
                                    <div className="w-full h-full relative rounded-[1.5rem] overflow-hidden shadow-inner">
                                        {work.image ? (
                                            <>
                                                <img
                                                    src={work.image.startsWith("http") ? work.image : `${(process.env.REACT_APP_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "")}${work.image}`}
                                                    alt={work.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-60"></div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-sky-100 flex items-center justify-center">
                                                <div className="bg-white/50 w-24 h-24 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm">
                                                    <ImageIcon className="w-10 h-10 text-sky-400" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Floating Category Badge */}
                                        <div className="absolute top-4 left-4 z-10">
                                            <span className="bg-white/90 backdrop-blur-md text-sky-800 text-[11px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-sm">
                                                {work.category || "Story"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-8 flex flex-col flex-1">
                                    <h3 className="text-2xl font-bold text-slate-900 leading-tight mb-3 group-hover:text-sky-600 transition-colors line-clamp-2">
                                        {work.title}
                                    </h3>

                                    <p className="text-slate-500 text-[15px] leading-relaxed line-clamp-3 mb-6 flex-1">
                                        {work.summary}
                                    </p>

                                    {/* Author & Meta Footer */}
                                    <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-auto">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center shadow-md shadow-sky-200">
                                                <span className="text-white font-bold text-sm">
                                                    {(work.author_name || "A").charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-800 tracking-tight">
                                                    {work.author_name || "Unknown Author"}
                                                </span>
                                                <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {formatDate(work.created_at)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-sky-50 flex items-center justify-center transition-colors">
                                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors group-hover:translate-x-0.5" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center text-center py-32 px-6 bg-white rounded-[3rem] border border-gray-100 shadow-sm mt-8">
                        <div className="relative mb-8 group">
                            <div className="absolute inset-0 bg-sky-100 rounded-full scale-150 blur-xl opacity-50"></div>
                            <div className="relative w-24 h-24 bg-gradient-to-br from-sky-50 to-indigo-50 rounded-[2rem] rotate-12 flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                                <Bookmark className="w-10 h-10 text-sky-500 -rotate-12 group-hover:-rotate-6 transition-transform" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Where did the stories go?</h3>
                        <p className="text-lg text-slate-500 max-w-lg mb-10 leading-relaxed font-light">
                            {searchQuery
                                ? "We explored every chapter but couldn't find a match for your search. Try different keywords to uncover more stories."
                                : "The authors' canvas is completely blank right now. Check back soon for beautiful new tales."}
                        </p>
                        {searchQuery && (
                            <button
                                onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
                                className="px-8 py-4 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-2xl transition-all duration-300"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
};

export default DailyUpdates;
