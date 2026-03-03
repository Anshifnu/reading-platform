import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, BookOpen, UserCheck, CreditCard, Crown,
  CalendarDays, CalendarRange, BarChart2, Shield,
  CheckSquare, ArrowRight,
} from 'lucide-react';
import api from '../services/Api';

// ─── Stat card — same style as Analytics page ──────────
const StatCard = ({ icon: Icon, label, value, sub, gradient }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 hover:shadow-md transition-shadow">
    <div className={`p-3.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg shrink-0`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value?.toLocaleString() ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Quick action button ────────────────────────────────
const ActionBtn = ({ label, icon: Icon, onClick, gradient }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-5 py-3.5 rounded-xl bg-gradient-to-r ${gradient} text-white font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-sm`}
  >
    <Icon className="w-4 h-4" />
    {label}
    <ArrowRight className="w-4 h-4 ml-auto opacity-70" />
  </button>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin-stats/')
      .then(res => setStats(res.data))
      .catch(err => console.error('Failed to fetch admin stats:', err))
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    {
      label: 'Total Users',
      value: stats.total_users,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      sub: `${stats.total_authors} authors · ${stats.total_readers} readers`,
    },
    {
      label: 'Total Readers',
      value: stats.total_readers,
      icon: UserCheck,
      gradient: 'from-cyan-500 to-cyan-600',
    },
    {
      label: 'Total Authors',
      value: stats.total_authors,
      icon: Crown,
      gradient: 'from-violet-500 to-violet-600',
    },
    {
      label: 'Total Books',
      value: stats.total_books,
      icon: BookOpen,
      gradient: 'from-emerald-500 to-emerald-600',
    },
    {
      label: 'Active Subscriptions',
      value: stats.total_subscribed,
      icon: CreditCard,
      gradient: 'from-indigo-500 to-indigo-600',
      sub: `${stats.monthly_subscriptions} monthly · ${stats.yearly_subscriptions} yearly`,
    },
    {
      label: 'Monthly Plans',
      value: stats.monthly_subscriptions,
      icon: CalendarDays,
      gradient: 'from-amber-500 to-amber-600',
    },
    {
      label: 'Yearly Plans',
      value: stats.yearly_subscriptions,
      icon: CalendarRange,
      gradient: 'from-rose-500 to-rose-600',
    },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">Control Panel</p>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-8 h-8 text-indigo-500" />
              Admin Dashboard
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Manage users, books, and platform settings</p>
          </div>
          <button
            onClick={() => navigate('/admin/analytics')}
            className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all"
          >
            <BarChart2 className="w-4 h-4" />
            View Analytics
          </button>
        </div>

        {/* ── Stat Cards ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-7 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>
        )}

        {/* ── Quick Actions ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="text-base font-bold text-gray-900 mb-5">⚡ Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <ActionBtn
              label="Manage Users"
              icon={Users}
              onClick={() => navigate('/admin/users')}
              gradient="from-blue-500 to-blue-600"
            />
            <ActionBtn
              label="Manage Books"
              icon={BookOpen}
              onClick={() => navigate('/admin/books')}
              gradient="from-violet-500 to-violet-600"
            />
            <ActionBtn
              label="Book Submissions"
              icon={CheckSquare}
              onClick={() => navigate('/book-verification')}
              gradient="from-emerald-500 to-emerald-600"
            />
            <ActionBtn
              label="Platform Analytics"
              icon={BarChart2}
              onClick={() => navigate('/admin/analytics')}
              gradient="from-indigo-500 to-indigo-600"
            />
          </div>
        </div>

        {/* ── Sub plan summary row ── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Monthly Plans Active', value: stats.monthly_subscriptions, color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { label: 'Yearly Plans Active', value: stats.yearly_subscriptions, color: 'bg-rose-50  text-rose-700  border-rose-200' },
              { label: 'Total Authors', value: stats.total_authors, color: 'bg-violet-50 text-violet-700 border-violet-200' },
              { label: 'Total Readers', value: stats.total_readers, color: 'bg-cyan-50  text-cyan-700  border-cyan-200' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`rounded-xl border px-5 py-4 text-center ${color}`}>
                <p className="text-2xl font-bold">{value?.toLocaleString() ?? '—'}</p>
                <p className="text-xs font-semibold mt-0.5 opacity-80">{label}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
