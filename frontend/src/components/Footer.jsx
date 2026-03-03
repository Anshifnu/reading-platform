import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    BookOpen, Home, Heart, Bell, MessageCircle,
    User, Star, TrendingUp, BarChart2, FileText, Users,
    Shield, Settings, CheckSquare, Mail,
} from "lucide-react";

// ─── Content config per role ───────────────────────────────────────────────
// Matches Navbar: bg-sky-100 / border-sky-200 / sky-blue accent palette
const FOOTER_CONFIG = {
    reader: {
        bg: "bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900",
        topBorder: "border-white/10",
        accent: "text-sky-400",
        headingColor: "text-sky-400",
        badge: "bg-white/10 text-sky-300 border-white/20",
        tagline: "Discover your next favourite story.",
        columns: [
            {
                title: "Explore",
                links: [
                    { to: "/", label: "Home", icon: Home },
                    { to: "/books", label: "Browse Books", icon: BookOpen },
                    { to: "/authors", label: "Authors", icon: Users },
                ],
            },
            {
                title: "My Space",
                links: [
                    { to: "/favorites", label: "My Library", icon: Heart },
                    { to: "/subscription", label: "Subscription", icon: Star },
                    { to: "/coins", label: "Coins & Wallet", icon: TrendingUp },
                ],
            },
            {
                title: "Connect",
                links: [
                    { to: "/chat", label: "Messages", icon: MessageCircle },
                    { to: "/notifications", label: "Notifications", icon: Bell },
                    { to: "/profile/edit", label: "Profile", icon: User },
                ],
            },
        ],
    },

    author: {
        bg: "bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900",
        topBorder: "border-white/10",
        accent: "text-sky-400",
        headingColor: "text-sky-400",
        badge: "bg-white/10 text-sky-300 border-white/20",
        tagline: "Write, publish, and inspire the world.",
        columns: [
            {
                title: "Studio",
                links: [
                    { to: "/publisher", label: "Dashboard", icon: BarChart2 },
                    { to: "/write", label: "Write Story", icon: FileText },
                    { to: "/submit-book", label: "Submit PDF Book", icon: BookOpen },
                ],
            },
            {
                title: "Community",
                links: [
                    { to: "/authors", label: "Author Network", icon: Users },
                    { to: "/readers-requests", label: "Reader Requests", icon: User },
                    { to: "/chat", label: "Messages", icon: MessageCircle },
                ],
            },
            {
                title: "Account",
                links: [
                    { to: "/notifications", label: "Notifications", icon: Bell },
                    { to: "/profile/edit", label: "Edit Profile", icon: Settings },
                ],
            },
        ],
    },

    admin: {
        bg: "bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900",
        topBorder: "border-white/10",
        accent: "text-sky-400",
        headingColor: "text-sky-400",
        badge: "bg-white/10 text-sky-300 border-white/20",
        tagline: "Manage, monitor, and maintain the platform.",
        columns: [
            {
                title: "Control Panel",
                links: [
                    { to: "/admin", label: "Dashboard", icon: Shield },
                    { to: "/admin/users", label: "User Management", icon: Users },
                    { to: "/admin/books", label: "Book Management", icon: BookOpen },
                ],
            },
            {
                title: "Review",
                links: [
                    { to: "/book-verification", label: "Book Submissions", icon: CheckSquare },
                    { to: "/admin/analytics", label: "Analytics", icon: BarChart2 },
                    { to: "/notifications", label: "Notifications", icon: Bell },
                ],
            },
        ],
    },

    guest: {
        bg: "bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900",
        topBorder: "border-white/10",
        accent: "text-sky-400",
        headingColor: "text-sky-400",
        badge: "bg-white/10 text-sky-300 border-white/20",
        tagline: "Your next great read is waiting.",
        columns: [
            {
                title: "Discover",
                links: [
                    { to: "/", label: "Home", icon: Home },
                    { to: "/books", label: "Books", icon: BookOpen },
                ],
            },
            {
                title: "Join Us",
                links: [
                    { to: "/login", label: "Log In", icon: User },
                    { to: "/email-register", label: "Sign Up", icon: Mail },
                ],
            },
        ],
    },
};

// ─── Footer ────────────────────────────────────────────────────────────────
const Footer = () => {
    const { user, isAuthenticated } = useAuth();
    const role = user?.role;
    const cfg = (isAuthenticated && FOOTER_CONFIG[role]) ? FOOTER_CONFIG[role] : FOOTER_CONFIG.guest;
    const year = new Date().getFullYear();

    return (
        <footer className={`${cfg.bg} border-t ${cfg.topBorder} text-gray-300`}>
            <div className="max-w-7xl mx-auto px-6 pt-10 pb-6">

                {/* ── Brand row ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shrink-0">
                            <span className="text-xl text-white">📚</span>
                        </div>
                        <div>
                            <span className="text-xl font-bold text-white">ReadSphere</span>
                            <p className={`text-xs mt-0.5 ${cfg.accent} font-medium`}>{cfg.tagline}</p>
                        </div>
                    </div>

                    {isAuthenticated && (
                        <span className={`self-start sm:self-auto text-xs font-semibold px-3 py-1 rounded-full border ${cfg.badge} capitalize`}>
                            {role} portal
                        </span>
                    )}
                </div>

                {/* ── Link columns ── */}
                <div className={`grid grid-cols-2 md:grid-cols-${cfg.columns.length} gap-8 border-t ${cfg.topBorder} pt-8`}>
                    {cfg.columns.map((col) => (
                        <div key={col.title}>
                            <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 ${cfg.headingColor}`}>
                                {col.title}
                            </h4>
                            <ul className="space-y-2.5">
                                {col.links.map(({ to, label, icon: Icon }) => (
                                    <li key={to}>
                                        <Link
                                            to={to}
                                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-sky-400 transition-colors duration-150 group"
                                        >
                                            <Icon className="w-3.5 h-3.5 shrink-0 text-sky-500 group-hover:scale-110 transition-transform" />
                                            {label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* ── Bottom bar ── */}
                <div className={`flex flex-col sm:flex-row items-center justify-between gap-2 mt-8 pt-5 border-t ${cfg.topBorder} text-xs text-white/40`}>
                    <span>© {year} ReadSphere. All rights reserved.</span>
                    <span className="hidden sm:block">Made with ❤️ for book lovers everywhere</span>
                </div>
            </div>
        </footer>
    );

};

export default Footer;
