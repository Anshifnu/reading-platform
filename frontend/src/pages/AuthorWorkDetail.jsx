import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/Api";
import { ArrowLeft, User, Calendar, BookOpen, Sparkles } from "lucide-react";

const AuthorWorkDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [work, setWork] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWork = async () => {
            try {
                const res = await api.get(`/authors/work/${id}/`);
                setWork(res.data);
            } catch (err) {
                console.error("Failed to load work details", err);
            } finally {
                setLoading(false);
            }
        };
        fetchWork();
    }, [id]);

    // Helper to constructing valid image URL
    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        // Strip trailing slash from API URL if present
        const baseUrl = (process.env.REACT_APP_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
        return `${baseUrl}${path}`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
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

    if (!work) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafcff] px-6">
                <div className="w-24 h-24 bg-sky-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <BookOpen className="w-12 h-12 text-sky-400" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Story Not Found</h2>
                <p className="text-lg text-slate-500 max-w-md text-center mb-8">
                    The chapter or story you're looking for might have been removed or the link is broken.
                </p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-8 py-3.5 bg-gray-900 hover:bg-black text-white font-semibold flex items-center gap-2 rounded-2xl shadow-lg transition-all hover:-translate-y-0.5"
                >
                    <ArrowLeft className="w-5 h-5" /> Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafcff] font-sans selection:bg-sky-200">
            {/* ═ IMMERSIVE HERO SECTION ═════════════════════════════════ */}
            <div className="relative w-full h-[50vh] min-h-[400px] max-h-[600px] bg-slate-900 overflow-hidden flex items-end">
                {/* Background Image / Pattern */}
                {work.image ? (
                    <>
                        <img
                            src={getImageUrl(work.image)}
                            alt={work.title}
                            className="absolute inset-0 w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
                    </>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-sky-900">
                        {/* Abstract pattern fallback */}
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400 via-transparent to-transparent"></div>
                    </div>
                )}

                {/* Floating Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-8 left-6 lg:left-12 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-lg transition-all hover:-translate-x-1"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="relative z-10 w-full max-w-4xl mx-auto px-6 lg:px-12 pb-12 lg:pb-16 hidden md:block">
                    {/* Header elements for desktop - overlaps image */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold uppercase tracking-widest mb-4 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5" /> {work.category || "General"}
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 drop-shadow-md">
                        {work.title}
                    </h1>
                </div>
            </div>

            {/* ═ MAIN CONTENT CONTAINER ═════════════════════════════════ */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 -mt-16 md:-mt-8 relative z-20 pb-24">
                <div className="bg-white rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-gray-100 p-8 sm:p-12 overflow-hidden">

                    {/* Mobile Header (Hidden on Desktop) */}
                    <div className="md:hidden mb-8 pb-8 border-b border-gray-100">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold uppercase tracking-widest mb-4">
                            {work.category || "General"}
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 leading-tight mb-4">
                            {work.title}
                        </h1>
                    </div>

                    {/* Author Meta Info */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-200">
                                <span className="text-white font-bold text-xl">
                                    {(work.author_name || "A").charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-0.5">Written By</span>
                                <span className="text-lg font-bold text-slate-900 tracking-tight">
                                    {work.author_name || `Author #${work.author}`}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-4 py-2 rounded-xl">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium">{formatDate(work.created_at)}</span>
                        </div>
                    </div>

                    {/* Summary Callout */}
                    <div className="mb-12 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-sky-400 rounded-full"></div>
                        <div className="pl-6 py-2">
                            <p className="text-xl text-slate-600 font-medium italic leading-relaxed">
                                "{work.summary}"
                            </p>
                        </div>
                    </div>

                    {/* HTML Content Body */}
                    <div className="prose prose-lg prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-sky-600 prose-img:rounded-xl prose-img:shadow-md">
                        <div dangerouslySetInnerHTML={{ __html: work.content }} />
                    </div>

                    {/* Footer / End of Content */}
                    <div className="mt-16 pt-8 border-t border-dashed border-gray-200 flex flex-col items-center justify-center">
                        <div className="w-3 h-3 bg-sky-300 rounded-full shadow-sm shadow-sky-200 mb-6"></div>
                        <p className="text-slate-400 text-sm font-medium uppercase tracking-widest text-center">
                            End of Update
                        </p>
                        <button
                            onClick={() => navigate('/updates')}
                            className="mt-6 px-6 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold rounded-full transition-colors flex items-center gap-2"
                        >
                            Read More Updates
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AuthorWorkDetail;