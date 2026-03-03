import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/Api";
import {
    Users, UserCheck, Crown, Search, Shield, ShieldOff,
    UserCog, X, ArrowLeft, Mail, CreditCard,
} from "lucide-react";

// ─── Shared stat card (same as Analytics / Dashboard) ──
const StatCard = ({ icon: Icon, label, value, gradient }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5">
        <div className={`p-3.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg shrink-0`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{value?.toLocaleString() ?? "—"}</p>
        </div>
    </div>
);

// ─── Role badge ─────────────────────────────────────────
const RoleBadge = ({ role }) => {
    const cfg = {
        author: "bg-violet-100 text-violet-700",
        reader: "bg-cyan-100 text-cyan-700",
    };
    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg[role] ?? "bg-gray-100 text-gray-600"}`}>
            {role?.charAt(0).toUpperCase() + role?.slice(1)}
        </span>
    );
};

// ─── Modal wrapper ───────────────────────────────────────
const Modal = ({ onClose, children }) => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
            </button>
            {children}
        </div>
    </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const AdminUserManagement = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [counts, setCounts] = useState({ total_users: 0, total_readers: 0, total_authors: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const [blockModal, setBlockModal] = useState(null);
    const [blockReason, setBlockReason] = useState("");
    const [roleModal, setRoleModal] = useState(null);
    const [newRole, setNewRole] = useState("reader");
    const [roleReason, setRoleReason] = useState("");

    const fetchUsers = async (search = "") => {
        setLoading(true);
        try {
            const params = search ? `?search=${encodeURIComponent(search)}` : "";
            const res = await api.get(`/admin/users/${params}`);
            setUsers(res.data.users);
            setCounts(res.data.counts);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);
    useEffect(() => {
        const t = setTimeout(() => fetchUsers(searchQuery), 400);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const handleBlock = async () => {
        if (!blockReason.trim()) return alert("Please provide a reason.");
        setActionLoading(true);
        try {
            await api.post(`/admin/users/${blockModal.id}/block/`, {
                reason: blockReason, block: blockModal.is_active,
            });
            setBlockModal(null); setBlockReason("");
            fetchUsers(searchQuery);
        } catch (err) {
            alert("Action failed: " + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleRoleChange = async () => {
        if (!roleReason.trim()) return alert("Please provide a reason.");
        setActionLoading(true);
        try {
            await api.post(`/admin/users/${roleModal.id}/change-role/`, {
                new_role: newRole, reason: roleReason,
            });
            setRoleModal(null); setRoleReason(""); setNewRole("reader");
            fetchUsers(searchQuery);
        } catch (err) {
            alert("Action failed: " + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 px-6 py-10 font-sans">
            <div className="max-w-7xl mx-auto">

                {/* ── Header ── */}
                <div className="flex items-center gap-4 mb-10">
                    <button
                        onClick={() => navigate("/admin")}
                        className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-0.5">Admin</p>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-8 h-8 text-indigo-500" />
                            User Management
                        </h1>
                        <p className="text-gray-500 text-sm mt-0.5">Block accounts, assign roles, and view members</p>
                    </div>
                </div>

                {/* ── Stat cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                    <StatCard icon={Users} label="Total Users" value={counts.total_users} gradient="from-blue-500 to-blue-600" />
                    <StatCard icon={UserCheck} label="Total Readers" value={counts.total_readers} gradient="from-cyan-500 to-cyan-600" />
                    <StatCard icon={Crown} label="Total Authors" value={counts.total_authors} gradient="from-violet-500 to-violet-600" />
                </div>

                {/* ── Search bar ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
                    <div className="flex items-center gap-3 px-5 py-3.5">
                        <Search className="w-5 h-5 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search by username or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-400 text-sm"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Table ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-gray-400 text-sm">Loading users...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="py-16 text-center text-gray-400 text-sm">No users found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider border-b border-gray-100">
                                    <tr>
                                        {["User", "Email", "Role", "Plan", "Status", "Joined", "Actions"].map(h => (
                                            <th key={h} className="px-5 py-3.5 font-semibold">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50/70 transition-colors">

                                            {/* User */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                        {user.username?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-gray-900">{user.username}</span>
                                                </div>
                                            </td>

                                            {/* Email */}
                                            <td className="px-5 py-4 text-gray-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Mail className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="truncate max-w-[180px]">{user.email}</span>
                                                </div>
                                            </td>

                                            {/* Role */}
                                            <td className="px-5 py-4"><RoleBadge role={user.role} /></td>

                                            {/* Plan */}
                                            <td className="px-5 py-4">
                                                {user.subscription ? (
                                                    <div>
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                                            <CreditCard className="w-3 h-3" />{user.subscription.plan_name}
                                                        </span>
                                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                                            {user.subscription.plan_type === "yearly" ? "Yearly" : "Monthly"} · ends{" "}
                                                            {new Date(user.subscription.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-400">No Plan</span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                          ${user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                                    {user.is_active ? "Active" : "Blocked"}
                                                </span>
                                            </td>

                                            {/* Joined */}
                                            <td className="px-5 py-4 text-gray-400 text-xs">
                                                {new Date(user.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setBlockModal(user)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors
                              ${user.is_active
                                                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                                                : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                                                    >
                                                        {user.is_active ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                                                        {user.is_active ? "Block" : "Unblock"}
                                                    </button>
                                                    <button
                                                        onClick={() => { setRoleModal(user); setNewRole(user.role === "reader" ? "author" : "reader"); }}
                                                        className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1 transition-colors"
                                                    >
                                                        <UserCog className="w-3.5 h-3.5" /> Role
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Block/Unblock Modal ── */}
            {blockModal && (
                <Modal onClose={() => { setBlockModal(null); setBlockReason(""); }}>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
                        {blockModal.is_active
                            ? <><ShieldOff className="w-5 h-5 text-red-500" /> Block User</>
                            : <><Shield className="w-5 h-5 text-green-500" /> Unblock User</>}
                    </h3>
                    <p className="text-sm text-gray-500 mb-1">
                        {blockModal.is_active
                            ? `"${blockModal.username}" will not be able to log in.`
                            : `"${blockModal.username}" will regain access.`}
                    </p>
                    <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Email will be sent to {blockModal.email}
                    </p>
                    <textarea
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        placeholder="Reason for this action..."
                        rows={3}
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-300 mb-4 resize-none"
                    />
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setBlockModal(null); setBlockReason(""); }}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleBlock}
                            disabled={actionLoading}
                            className={`flex-1 py-2.5 rounded-xl font-semibold text-white transition-colors disabled:opacity-50
                ${blockModal.is_active ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
                        >
                            {actionLoading ? "Processing..." : blockModal.is_active ? "Block User" : "Unblock User"}
                        </button>
                    </div>
                </Modal>
            )}

            {/* ── Role Change Modal ── */}
            {roleModal && (
                <Modal onClose={() => { setRoleModal(null); setRoleReason(""); }}>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
                        <UserCog className="w-5 h-5 text-indigo-500" /> Change Role
                    </h3>
                    <p className="text-sm text-gray-500 mb-1">
                        Changing role for <strong>{roleModal.username}</strong>{" "}
                        (currently: <span className="font-semibold capitalize">{roleModal.role}</span>)
                    </p>
                    <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Email will be sent to {roleModal.email}
                    </p>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">New Role</label>
                    <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-300 mb-3"
                    >
                        <option value="reader">Reader</option>
                        <option value="author">Author</option>
                    </select>
                    <textarea
                        value={roleReason}
                        onChange={(e) => setRoleReason(e.target.value)}
                        placeholder="Reason for role change..."
                        rows={3}
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-300 mb-4 resize-none"
                    />
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setRoleModal(null); setRoleReason(""); }}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleRoleChange}
                            disabled={actionLoading || newRole === roleModal.role}
                            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors disabled:opacity-50"
                        >
                            {actionLoading ? "Processing..." : "Update Role"}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AdminUserManagement;
