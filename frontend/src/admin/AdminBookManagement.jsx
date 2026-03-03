import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/Api";
import { uploadToCloudinary, uploadMultipleToCloudinary } from "../utils/cloudinaryUpload";
import {
    BookOpen, Search, Plus, Pencil, Trash2, X, ArrowLeft,
    Image, FolderOpen, Upload, Tag, Loader2,
} from "lucide-react";

// ─── Shared field style ─────────────────────────────────
const field = "w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-300";

// ─── Field label ────────────────────────────────────────
const Label = ({ children }) => (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{children}</label>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const AdminBookManagement = () => {
    const navigate = useNavigate();

    // ─── Books ──
    const [books, setBooks] = useState([]);
    const [totalBooks, setTotalBooks] = useState(0);
    const [bookSearch, setBookSearch] = useState("");
    const [loading, setLoading] = useState(true);

    // ─── Categories ──
    const [categories, setCategories] = useState([]);
    const [catLoading, setCatLoading] = useState(true);

    // ─── Modals ──
    const [bookModal, setBookModal] = useState(null);
    const [catModal, setCatModal] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState("");

    // ─── Book form ──
    const emptyBookForm = {
        title: "", author: "", description: "", publisher: "",
        summary_text: "", voice_type: "manual", language: "English",
        is_public: true, category_ids: [],
    };
    const [bookForm, setBookForm] = useState(emptyBookForm);
    const [bookImages, setBookImages] = useState([]);
    const [bookPdf, setBookPdf] = useState(null);

    // ─── Category form ──
    const [catName, setCatName] = useState("");
    const [catImage, setCatImage] = useState(null);

    // ─── Tab ──
    const [tab, setTab] = useState("books");

    // ━━━ Fetch ━━━
    const fetchBooks = async (search = "") => {
        setLoading(true);
        try {
            const params = search ? `?search=${encodeURIComponent(search)}` : "";
            const res = await api.get(`/admin/books/${params}`);
            setBooks(res.data.books);
            setTotalBooks(res.data.total_books);
        } catch (err) {
            console.error("Failed to fetch books:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        setCatLoading(true);
        try {
            const res = await api.get("/admin/categories/");
            setCategories(res.data.categories);
        } catch (err) {
            console.error("Failed to fetch categories:", err);
        } finally {
            setCatLoading(false);
        }
    };

    useEffect(() => { fetchBooks(); fetchCategories(); }, []);
    useEffect(() => {
        const t = setTimeout(() => fetchBooks(bookSearch), 400);
        return () => clearTimeout(t);
    }, [bookSearch]);

    // ━━━ Book CRUD ━━━
    const openAddBook = () => {
        setBookForm(emptyBookForm); setBookImages([]); setBookPdf(null); setUploadStatus("");
        setBookModal("add");
    };
    const openEditBook = (book) => {
        setBookForm({
            title: book.title, author: book.author, description: book.description,
            publisher: book.publisher, summary_text: book.summary_text,
            voice_type: book.voice_type, language: book.language, is_public: book.is_public,
            category_ids: book.categories?.map(c => c.id) || [],
        });
        setBookImages([]); setBookPdf(null); setUploadStatus("");
        setBookModal(book);
    };

    const submitBook = async () => {
        setActionLoading(true);
        try {
            let pdfUrl = "";
            let imageUrls = [];
            if (bookPdf) {
                setUploadStatus("Uploading PDF...");
                pdfUrl = await uploadToCloudinary(bookPdf, (pct) => setUploadStatus(`Uploading PDF... ${pct}%`));
            }
            if (bookImages.length > 0) {
                setUploadStatus("Uploading images...");
                imageUrls = await uploadMultipleToCloudinary(bookImages, ({ current, total, percent }) =>
                    setUploadStatus(`Uploading image ${current}/${total}... ${percent}%`));
            }
            setUploadStatus("Saving to database...");
            const payload = { ...bookForm, pdf_url: pdfUrl, image_urls: imageUrls };
            if (bookModal === "add") {
                await api.post("/admin/books/create/", payload);
            } else {
                await api.put(`/admin/books/${bookModal.id}/update/`, payload);
            }
            setBookModal(null); setUploadStatus(""); fetchBooks(bookSearch);
        } catch (err) {
            alert("Failed: " + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(false); setUploadStatus("");
        }
    };

    const deleteBook = async (id) => {
        setActionLoading(true);
        try {
            await api.delete(`/admin/books/${id}/delete/`);
            setDeleteConfirm(null); fetchBooks(bookSearch);
        } catch (err) {
            alert("Failed: " + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    // ━━━ Category CRUD ━━━
    const openAddCat = () => { setCatName(""); setCatImage(null); setUploadStatus(""); setCatModal("add"); };
    const openEditCat = (cat) => { setCatName(cat.name); setCatImage(null); setUploadStatus(""); setCatModal(cat); };

    const submitCategory = async () => {
        setActionLoading(true);
        try {
            let imageUrl = "";
            if (catImage) {
                setUploadStatus("Uploading image...");
                imageUrl = await uploadToCloudinary(catImage, (pct) => setUploadStatus(`Uploading... ${pct}%`));
            }
            setUploadStatus("Saving...");
            const payload = { name: catName, image_url: imageUrl };
            if (catModal === "add") {
                await api.post("/admin/categories/create/", payload);
            } else {
                await api.put(`/admin/categories/${catModal.id}/update/`, payload);
            }
            setCatModal(null); setUploadStatus(""); fetchCategories();
        } catch (err) {
            alert("Failed: " + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(false); setUploadStatus("");
        }
    };

    const deleteCat = async (id) => {
        if (!window.confirm("Delete this category?")) return;
        try {
            await api.delete(`/admin/categories/${id}/delete/`);
            fetchCategories();
        } catch (err) {
            alert("Failed: " + (err.response?.data?.error || err.message));
        }
    };

    const getBookCover = (book) => book.images?.[0]?.image || null;

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
                            <BookOpen className="w-8 h-8 text-indigo-500" />
                            Book & Category Management
                        </h1>
                        <p className="text-gray-500 text-sm mt-0.5">Add, edit, and manage all books and categories</p>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1 shadow-sm mb-8 w-fit">
                    {[
                        { key: "books", label: `Books (${totalBooks})`, icon: BookOpen },
                        { key: "categories", label: `Categories (${categories.length})`, icon: Tag },
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all
                ${tab === key ? "bg-indigo-600 text-white shadow" : "text-gray-500 hover:text-gray-800"}`}
                        >
                            <Icon className="w-4 h-4" />{label}
                        </button>
                    ))}
                </div>

                {/* ═══════ BOOKS TAB ═══════ */}
                {tab === "books" && (
                    <>
                        <div className="flex gap-4 mb-6">
                            <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 px-5">
                                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Search books by title or author..."
                                    value={bookSearch}
                                    onChange={e => setBookSearch(e.target.value)}
                                    className="flex-1 bg-transparent outline-none py-3.5 text-gray-900 placeholder:text-gray-400 text-sm"
                                />
                                {bookSearch && <button onClick={() => setBookSearch("")} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
                            </div>
                            <button
                                onClick={openAddBook}
                                className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl font-semibold flex items-center gap-2 shadow-sm hover:shadow-md transition-all whitespace-nowrap"
                            >
                                <Plus className="w-4 h-4" /> Add Book
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-gray-400 text-sm">Loading books...</p>
                                </div>
                            ) : books.length === 0 ? (
                                <div className="py-16 text-center text-gray-400 text-sm">No books found.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider border-b border-gray-100">
                                            <tr>
                                                {["Book", "Author", "Categories", "Rating", "Public", "Actions"].map(h => (
                                                    <th key={h} className="px-5 py-3.5 font-semibold">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {books.map(book => (
                                                <tr key={book.id} className="hover:bg-gray-50/70 transition-colors">
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {getBookCover(book) ? (
                                                                <img src={getBookCover(book)} alt="" className="w-10 h-14 object-cover rounded-lg shadow-sm" />
                                                            ) : (
                                                                <div className="w-10 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg shadow-sm flex items-center justify-center shrink-0">
                                                                    <BookOpen className="w-5 h-5 text-white" />
                                                                </div>
                                                            )}
                                                            <span className="font-semibold text-gray-900 max-w-[200px] truncate">{book.title}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-gray-500">{book.author || "—"}</td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {book.categories?.map(c => (
                                                                <span key={c.id} className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">{c.name}</span>
                                                            ))}
                                                            {(!book.categories || book.categories.length === 0) && <span className="text-gray-400 text-xs">None</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="text-amber-500 font-bold">★ {book.average_rating}</span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${book.is_public ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                                            {book.is_public ? "Yes" : "No"}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => openEditBook(book)}
                                                                className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirm(book)}
                                                                className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
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
                    </>
                )}

                {/* ═══════ CATEGORIES TAB ═══════ */}
                {tab === "categories" && (
                    <>
                        <div className="flex justify-end mb-6">
                            <button
                                onClick={openAddCat}
                                className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl font-semibold flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
                            >
                                <Plus className="w-4 h-4" /> Add Category
                            </button>
                        </div>

                        {catLoading ? (
                            <div className="flex justify-center py-16">
                                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {categories.map(cat => (
                                    <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                        {cat.images?.[0]?.image ? (
                                            <img src={cat.images[0].image} alt={cat.name} className="w-full h-36 object-cover" />
                                        ) : (
                                            <div className="w-full h-36 bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                                                <FolderOpen className="w-10 h-10 text-white/60" />
                                            </div>
                                        )}
                                        <div className="p-4 flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                                                <p className="text-xs text-gray-400">{cat.book_count} book{cat.book_count !== 1 ? "s" : ""}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => openEditCat(cat)} className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => deleteCat(cat.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ════ BOOK ADD/EDIT MODAL ════ */}
            {bookModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                {bookModal === "add"
                                    ? <><Plus className="w-5 h-5 text-indigo-500" /> Add New Book</>
                                    : <><Pencil className="w-5 h-5 text-indigo-500" /> Edit Book</>}
                            </h3>
                            <button onClick={() => setBookModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>Title *</Label><input type="text" value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} className={field} /></div>
                                <div><Label>Author</Label><input type="text" value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value })} className={field} /></div>
                            </div>
                            <div><Label>Description *</Label><textarea value={bookForm.description} onChange={e => setBookForm({ ...bookForm, description: e.target.value })} rows={3} className={`${field} resize-none`} /></div>
                            <div><Label>Summary *</Label><textarea value={bookForm.summary_text} onChange={e => setBookForm({ ...bookForm, summary_text: e.target.value })} rows={3} className={`${field} resize-none`} /></div>
                            <div className="grid grid-cols-3 gap-4">
                                <div><Label>Publisher</Label><input type="text" value={bookForm.publisher} onChange={e => setBookForm({ ...bookForm, publisher: e.target.value })} className={field} /></div>
                                <div><Label>Language</Label><input type="text" value={bookForm.language} onChange={e => setBookForm({ ...bookForm, language: e.target.value })} className={field} /></div>
                                <div>
                                    <Label>Voice Type</Label>
                                    <select value={bookForm.voice_type} onChange={e => setBookForm({ ...bookForm, voice_type: e.target.value })} className={field}>
                                        <option value="manual">Manual</option>
                                        <option value="ai">AI Generated</option>
                                    </select>
                                </div>
                            </div>

                            {/* Categories */}
                            <div>
                                <Label>Categories</Label>
                                <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-xl bg-gray-50 min-h-[44px]">
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setBookForm(prev => ({
                                                ...prev,
                                                category_ids: prev.category_ids.includes(cat.id)
                                                    ? prev.category_ids.filter(id => id !== cat.id)
                                                    : [...prev.category_ids, cat.id],
                                            }))}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all
                        ${bookForm.category_ids.includes(cat.id) ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"}`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* PDF Upload */}
                            <div>
                                <Label>PDF File</Label>
                                <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-400 transition-colors">
                                    <Upload className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-500">{bookPdf ? bookPdf.name : "Choose PDF file..."}</span>
                                    <input type="file" accept=".pdf" className="hidden" onChange={e => setBookPdf(e.target.files[0])} />
                                </label>
                            </div>

                            {/* Image Upload */}
                            <div>
                                <Label>Cover Images</Label>
                                <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-400 transition-colors">
                                    <Image className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-500">{bookImages.length > 0 ? `${bookImages.length} image(s) selected` : "Choose images..."}</span>
                                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => setBookImages([...e.target.files])} />
                                </label>
                            </div>

                            {/* Public toggle */}
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={bookForm.is_public} onChange={e => setBookForm({ ...bookForm, is_public: e.target.checked })} className="w-4 h-4 rounded accent-indigo-600" />
                                <span className="text-sm text-gray-700 font-medium">Public (visible to all users)</span>
                            </label>
                        </div>

                        {uploadStatus && (
                            <div className="mt-4 flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 p-3 rounded-xl">
                                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                <span>{uploadStatus}</span>
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setBookModal(null)} disabled={actionLoading} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">Cancel</button>
                            <button onClick={submitBook} disabled={actionLoading} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {actionLoading ? "Processing..." : bookModal === "add" ? "Create Book" : "Update Book"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ DELETE CONFIRM ════ */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Book?</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>? This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50">Cancel</button>
                            <button onClick={() => deleteBook(deleteConfirm.id)} disabled={actionLoading} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50">
                                {actionLoading ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ CATEGORY ADD/EDIT MODAL ════ */}
            {catModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                {catModal === "add"
                                    ? <><Plus className="w-5 h-5 text-indigo-500" /> Add Category</>
                                    : <><Pencil className="w-5 h-5 text-indigo-500" /> Edit Category</>}
                            </h3>
                            <button onClick={() => setCatModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-4">
                            <div><Label>Category Name *</Label>
                                <input type="text" value={catName} onChange={e => setCatName(e.target.value)} className={field} />
                            </div>
                            <div>
                                <Label>Category Image</Label>
                                <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-400 transition-colors">
                                    <Image className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-500">{catImage ? catImage.name : "Choose image..."}</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={e => setCatImage(e.target.files[0])} />
                                </label>
                            </div>
                        </div>

                        {uploadStatus && (
                            <div className="mt-4 flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 p-3 rounded-xl">
                                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                <span>{uploadStatus}</span>
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setCatModal(null)} disabled={actionLoading} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                            <button onClick={submitCategory} disabled={actionLoading || !catName.trim()} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {actionLoading ? "Processing..." : catModal === "add" ? "Create" : "Update"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBookManagement;
