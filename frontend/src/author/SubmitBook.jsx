import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/Api";
import { ArrowLeft, FileText, Upload, Book, Image, AlertCircle } from "lucide-react";
import uploadToCloudinary from "../utils/cloudinaryUpload";
import toast from "react-hot-toast";

const SubmitBook = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [authorName, setAuthorName] = useState("");
    const [publisher, setPublisher] = useState("");
    const [description, setDescription] = useState("");
    const [summaryText, setSummaryText] = useState("");
    const [category, setCategory] = useState("");
    const [isOtherCategory, setIsOtherCategory] = useState(false);
    const [newCategory, setNewCategory] = useState("");
    const [categoryWarning, setCategoryWarning] = useState(null);
    const [pdfFile, setPdfFile] = useState(null);
    const [coverImage, setCoverImage] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [language, setLanguage] = useState("English");
    const [uploadStatus, setUploadStatus] = useState("");

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get("categories/");
                setCategories(res.data.results || res.data || []);
            } catch (err) {
                console.error("Failed to load categories", err);
            }
        };
        fetchCategories();
    }, []);

    // Debounced category duplicate check
    const checkCategoryExists = useCallback(
        (name) => {
            // simplified debounce or let's just make it a normal function to fix the hook error.
            if (!name || name.trim().length < 2) {
                setCategoryWarning(null);
                return;
            }
            setTimeout(async () => {
                try {
                    const res = await api.get(`categories/check/?name=${encodeURIComponent(name.trim())}`);
                    if (res.data.exists) {
                        setCategoryWarning(`Category "${res.data.match.name}" already exists. Please select it from the dropdown.`);
                    } else {
                        setCategoryWarning(null);
                    }
                } catch {
                    setCategoryWarning(null);
                }
            }, 500);
        },
        []
    );

    const handleNewCategoryChange = (e) => {
        const val = e.target.value;
        setNewCategory(val);
        checkCategoryExists(val);
    };

    const handleCoverImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverImage(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!title || !authorName || !publisher || !description || !summaryText || !pdfFile) {
            toast.error("Please fill in all required fields and upload a PDF.");
            return;
        }

        if ((!category && !isOtherCategory) || (isOtherCategory && !newCategory)) {
            toast.error("Please select or enter a category.");
            return;
        }

        if (categoryWarning) {
            toast.error("The category you entered already exists. Please select it from the dropdown instead.");
            return;
        }

        setLoading(true);

        try {
            setUploadStatus("Uploading PDF...");
            const uploadedPdfUrl = await uploadToCloudinary(pdfFile, (pct) =>
                setUploadStatus(`Uploading PDF... ${pct}%`)
            );

            let uploadedCoverUrl = "";
            if (coverImage) {
                setUploadStatus("Uploading Cover Image...");
                uploadedCoverUrl = await uploadToCloudinary(coverImage, (pct) =>
                    setUploadStatus(`Uploading Cover... ${pct}%`)
                );
            }

            setUploadStatus("Finalizing Submission...");
            const payload = {
                title: title,
                author: authorName,
                publisher: publisher,
                description: description,
                summary_text: summaryText,
                pdf_file: uploadedPdfUrl,
                language: language
            };

            if (isOtherCategory) {
                payload.suggested_category_name = newCategory;
            } else {
                payload.category = category;
            }

            if (uploadedCoverUrl) {
                payload.cover_image = uploadedCoverUrl;
            }

            await api.post("submissions/", payload);
            toast.success("Book Submitted Successfully! \nIt has been sent to the Admin for AI Verification.");
            navigate("/publisher");
        } catch (error) {
            console.error("Submission error:", error);
            toast.error("Failed to submit book. " + (error.response?.data?.message || "Please try again."));
        } finally {
            setLoading(false);
            setUploadStatus("");
        }
    };

    const languages = ["English", "Spanish", "French", "German", "Hindi", "Arabic", "Chinese", "Japanese", "Korean", "Portuguese", "Russian", "Malayalam"];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">

            {/* Header */}
            <div className="w-full max-w-2xl flex items-center mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full hover:bg-gray-200 transition"
                >
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-2xl font-bold ml-4 text-gray-800">Submit a New Book</h1>
            </div>

            {/* Form Container */}
            <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-8">

                {/* Title */}
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Book Title <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Enter book title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                {/* Author & Publisher */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Author Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. J.K. Rowling"
                            value={authorName}
                            onChange={(e) => setAuthorName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Publisher <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Penguin Random House"
                            value={publisher}
                            onChange={(e) => setPublisher(e.target.value)}
                        />
                    </div>
                </div>

                {/* Category */}
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Category <span className="text-red-500">*</span></label>
                    <select
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={isOtherCategory ? "other" : category}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === "other") {
                                setIsOtherCategory(true);
                                setCategory("");
                            } else {
                                setIsOtherCategory(false);
                                setCategory(val);
                                setCategoryWarning(null);
                                setNewCategory("");
                            }
                        }}
                    >
                        <option value="">Select a Category</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                        <option value="other" className="font-bold text-blue-600">➕ Other / Add New</option>
                    </select>

                    {isOtherCategory && (
                        <div className="mt-2">
                            <input
                                type="text"
                                className={`w-full p-3 border rounded-lg focus:ring-2 outline-none ${categoryWarning
                                    ? "border-orange-400 focus:ring-orange-400"
                                    : "focus:ring-green-500"
                                    }`}
                                placeholder="Enter new category name..."
                                value={newCategory}
                                onChange={handleNewCategoryChange}
                            />
                            {categoryWarning ? (
                                <div className="flex items-center gap-1 mt-1">
                                    <AlertCircle size={14} className="text-orange-500" />
                                    <p className="text-xs text-orange-600">{categoryWarning}</p>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 mt-1">This category will be reviewed by admins.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Language */}
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Language</label>
                    <select
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        {languages.map((lang) => (
                            <option key={lang} value={lang}>{lang}</option>
                        ))}
                    </select>
                </div>

                {/* Description */}
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Description <span className="text-red-500">*</span></label>
                    <textarea
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                        placeholder="Write a short description of the book..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <p className="text-xs text-gray-400 mt-1">A brief overview that will appear in book listings.</p>
                </div>

                {/* Summary */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Summary <span className="text-red-500">*</span></label>
                    <textarea
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                        placeholder="Write a detailed summary of the book..."
                        value={summaryText}
                        onChange={(e) => setSummaryText(e.target.value)}
                    />
                    <p className="text-xs text-gray-400 mt-1">A detailed summary for AI verification and reader preview.</p>
                </div>

                {/* Cover Image Upload */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Book Cover Image</label>
                    <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition 
                ${coverPreview ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"}`}
                        onClick={() => document.getElementById("book-cover-upload").click()}
                    >
                        {coverPreview ? (
                            <div className="flex flex-col items-center">
                                <img src={coverPreview} alt="Cover preview" className="max-h-40 rounded-lg shadow-md mb-2" />
                                <span className="text-xs text-green-600">Click to change</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-gray-500">
                                <Image size={40} />
                                <span className="mt-2 text-sm">Click to upload cover image</span>
                                <span className="text-xs text-gray-400 mt-1">PNG, JPG (optional)</span>
                            </div>
                        )}
                    </div>
                    <input
                        id="book-cover-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleCoverImageChange}
                        className="hidden"
                    />
                </div>

                {/* PDF Upload */}
                <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Upload Book PDF <span className="text-red-500">*</span></label>
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition 
                ${pdfFile ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"}`}
                        onClick={() => document.getElementById("book-pdf-upload").click()}
                    >
                        {pdfFile ? (
                            <div className="flex flex-col items-center text-green-700">
                                <FileText size={48} />
                                <span className="mt-2 font-medium">{pdfFile.name}</span>
                                <span className="text-xs text-green-600 mt-1">Click to change</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-gray-500">
                                <Upload size={48} />
                                <span className="mt-2 text-sm">Click to upload PDF</span>
                                <span className="text-xs text-gray-400 mt-1">Max size: 50MB</span>
                            </div>
                        )}
                    </div>
                    <input
                        id="book-pdf-upload"
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setPdfFile(e.target.files[0])}
                        className="hidden"
                    />
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`w-full py-3 rounded-lg text-white font-bold text-lg transition flex items-center justify-center gap-2
            ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-md"}`}
                >
                    {loading ? (uploadStatus || "Submitting...") : (
                        <>
                            <Book size={20} /> Submit for Verification
                        </>
                    )}
                </button>

            </div>
        </div>
    );
};

export default SubmitBook;
