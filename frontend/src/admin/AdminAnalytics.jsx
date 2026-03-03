import { useState, useEffect, useCallback } from "react";
import api from "../services/Api";
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
    Users, BookOpen, Star, CreditCard,
    RefreshCw, BarChart2,
} from "lucide-react";

// ─── Color palette ──────────────────────────────────────
const COLORS = {
    blue: "#3b82f6",
    indigo: "#6366f1",
    green: "#10b981",
    amber: "#f59e0b",
    rose: "#f43f5e",
    violet: "#8b5cf6",
    cyan: "#06b6d4",
};
const PIE_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

// ─── Stat card ─────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = "blue" }) => {
    const bg = {
        blue: "from-blue-500 to-blue-600",
        green: "from-emerald-500 to-emerald-600",
        violet: "from-violet-500 to-violet-600",
        amber: "from-amber-500 to-amber-600",
        rose: "from-rose-500 to-rose-600",
        indigo: "from-indigo-500 to-indigo-600",
    }[color];
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5">
            <div className={`p-3.5 rounded-xl bg-gradient-to-br ${bg} shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
};

// ─── Chart wrapper ──────────────────────────────────────
const ChartCard = ({ title, children }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-bold text-gray-900 mb-5">{title}</h3>
        {children}
    </div>
);

// ─── Period selector ────────────────────────────────────
const PERIODS = [
    { key: "day", label: "Daily" },
    { key: "week", label: "Weekly" },
    { key: "month", label: "Monthly" },
    { key: "year", label: "Yearly" },
];

// ─── Merge two series by label ──────────────────────────
const mergeSeries = (keys) => {
    const map = {};
    keys.forEach(({ data, key }) => {
        data.forEach(({ label, count }) => {
            if (!map[label]) map[label] = { label };
            map[label][key] = count;
        });
    });
    return Object.values(map).sort((a, b) => a.label.localeCompare(b.label));
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const AdminAnalytics = () => {
    const [period, setPeriod] = useState("month");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/analytics/?period=${period}`);
            setData(res.data);
        } catch (err) {
            console.error("Analytics fetch failed", err);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const Skeleton = () => (
        <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-100 rounded-xl" />
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 px-6 py-10 font-sans">
            <div className="max-w-7xl mx-auto">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h5 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">Admin</h5>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                            <BarChart2 className="w-8 h-8 text-indigo-500" />
                            Platform Analytics
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Period tabs */}
                        <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1 shadow-sm">
                            {PERIODS.map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setPeriod(key)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all
                    ${period === key
                                            ? "bg-indigo-600 text-white shadow"
                                            : "text-gray-500 hover:text-gray-800"
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={fetchData}
                            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors shadow-sm"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <Skeleton />
                ) : data ? (
                    <>
                        {/* ── KPI Cards ── */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                            <StatCard icon={Users} label="Total Users" value={data.totals.total_users} sub={`${data.totals.total_authors} authors · ${data.totals.total_readers} readers`} color="blue" />
                            <StatCard icon={BookOpen} label="Total Books" value={data.totals.total_books} sub={`Avg rating ${data.totals.avg_rating}★`} color="indigo" />
                            <StatCard icon={CreditCard} label="Active Subs" value={data.totals.active_subs} sub={`${data.totals.monthly_subs} monthly · ${data.totals.yearly_subs} yearly`} color="green" />
                            <StatCard icon={Star} label="Avg Book Rating" value={`${data.totals.avg_rating}★`} color="amber" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                            {/* ── 1. User Signups ── */}
                            <ChartCard title="👥 User Signups">
                                <ResponsiveContainer width="100%" height={260}>
                                    <AreaChart data={mergeSeries([
                                        { data: data.signups.total, key: "total" },
                                        { data: data.signups.authors, key: "authors" },
                                        { data: data.signups.readers, key: "readers" },
                                    ])}>
                                        <defs>
                                            <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.15} />
                                                <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gAuthors" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLORS.violet} stopOpacity={0.15} />
                                                <stop offset="95%" stopColor={COLORS.violet} stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gReaders" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.15} />
                                                <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                        <Tooltip />
                                        <Legend />
                                        <Area type="monotone" dataKey="total" stroke={COLORS.blue} fill="url(#gTotal)" name="Total" strokeWidth={2} />
                                        <Area type="monotone" dataKey="authors" stroke={COLORS.violet} fill="url(#gAuthors)" name="Authors" strokeWidth={2} />
                                        <Area type="monotone" dataKey="readers" stroke={COLORS.green} fill="url(#gReaders)" name="Readers" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            {/* ── 2. Author vs Reader Breakdown ── */}
                            <ChartCard title="👤 Authors vs Readers (Signups)">
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={mergeSeries([
                                        { data: data.signups.authors, key: "authors" },
                                        { data: data.signups.readers, key: "readers" },
                                    ])}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="authors" name="Authors" fill={COLORS.violet} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="readers" name="Readers" fill={COLORS.cyan} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            {/* ── 3. Subscription Activations ── */}
                            <ChartCard title="💳 Subscription Activations">
                                <ResponsiveContainer width="100%" height={260}>
                                    <LineChart data={mergeSeries([
                                        { data: data.subscriptions.all, key: "all" },
                                        { data: data.subscriptions.monthly, key: "monthly" },
                                        { data: data.subscriptions.yearly, key: "yearly" },
                                    ])}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="all" stroke={COLORS.blue} name="All" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="monthly" stroke={COLORS.amber} name="Monthly" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="yearly" stroke={COLORS.rose} name="Yearly" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            {/* ── 4. Monthly vs Yearly Plan Bars ── */}
                            <ChartCard title="📊 Monthly vs Yearly Plans">
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={mergeSeries([
                                        { data: data.subscriptions.monthly, key: "monthly" },
                                        { data: data.subscriptions.yearly, key: "yearly" },
                                    ])}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="monthly" name="Monthly" fill={COLORS.amber} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="yearly" name="Yearly" fill={COLORS.rose} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* ── 5. Books Added ── */}
                            <ChartCard title="📚 Books Added to Platform">
                                <ResponsiveContainer width="100%" height={260}>
                                    <AreaChart data={data.books}>
                                        <defs>
                                            <linearGradient id="gBooks" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLORS.indigo} stopOpacity={0.2} />
                                                <stop offset="95%" stopColor={COLORS.indigo} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="count" stroke={COLORS.indigo} fill="url(#gBooks)" name="Books" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            {/* ── 6. Book Ratings Distribution ── */}
                            <ChartCard title="⭐ Book Rating Distribution (All-time)">
                                {data.rating_distribution.length === 0 ? (
                                    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No ratings yet</div>
                                ) : (
                                    <div className="flex flex-col md:flex-row items-center gap-6">
                                        <ResponsiveContainer width="100%" height={220}>
                                            <PieChart>
                                                <Pie
                                                    data={data.rating_distribution}
                                                    dataKey="count"
                                                    nameKey="label"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={90}
                                                    innerRadius={50}
                                                    paddingAngle={3}
                                                    label={({ label, percent }) =>
                                                        `${label} ${(percent * 100).toFixed(0)}%`
                                                    }
                                                >
                                                    {data.rating_distribution.map((_, i) => (
                                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(v) => [`${v} ratings`, ""]} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        {/* legend */}
                                        <div className="flex flex-col gap-2 shrink-0">
                                            {data.rating_distribution.map((d, i) => (
                                                <div key={d.label} className="flex items-center gap-2 text-sm">
                                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                    <span className="text-gray-700">{d.label}</span>
                                                    <span className="text-gray-400 ml-auto pl-4">{d.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </ChartCard>

                        </div>

                        {/* ── Sub plan totals banner ── */}
                        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: "Monthly Plans Active", value: data.totals.monthly_subs, color: "bg-amber-50 text-amber-700 border-amber-200" },
                                { label: "Yearly Plans Active", value: data.totals.yearly_subs, color: "bg-rose-50  text-rose-700  border-rose-200" },
                                { label: "Total Authors", value: data.totals.total_authors, color: "bg-violet-50 text-violet-700 border-violet-200" },
                                { label: "Total Readers", value: data.totals.total_readers, color: "bg-cyan-50  text-cyan-700  border-cyan-200" },
                            ].map(({ label, value, color }) => (
                                <div key={label} className={`rounded-xl border px-5 py-4 text-center ${color}`}>
                                    <p className="text-2xl font-bold">{value}</p>
                                    <p className="text-xs font-semibold mt-0.5 opacity-80">{label}</p>
                                </div>
                            ))}
                        </div>

                    </>
                ) : (
                    <p className="text-center text-gray-400 mt-20">Failed to load analytics. Try refreshing.</p>
                )}
            </div>
        </div>
    );
};

export default AdminAnalytics;
