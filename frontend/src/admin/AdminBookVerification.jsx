import React, { useState, useEffect } from "react";
import api from "../services/Api";
import { Check, X, FileText, Search } from "lucide-react";

const AdminBookVerification = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [verificationReport, setVerificationReport] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        try {
            const res = await api.get("admin/submissions/");
            setSubmissions(res.data);
        } catch (error) {
            console.error("Error fetching submissions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id) => {
        setActionLoading(true);
        try {
            const res = await api.post(`admin/submissions/${id}/verify/`);
            setVerificationReport(res.data);
            setSelectedSubmission(submissions.find(s => s.id === id));
            // Update local state to show verified status
            setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: "verified", verification_report: res.data } : s));
        } catch (error) {
            alert("Verification failed: " + (error.response?.data?.error || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm("Are you sure you want to approve and publish this book?")) return;
        setActionLoading(true);
        try {
            await api.post(`admin/submissions/${id}/approve/`);
            alert("Book Approved and Published!");
            fetchSubmissions(); // Refresh list
            setSelectedSubmission(null);
            setVerificationReport(null);
        } catch (error) {
            alert("Approval failed: " + (error.response?.data?.error || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (id) => {
        if (!rejectReason) {
            alert("Please provide a reason for rejection.");
            return;
        }
        setActionLoading(true);
        try {
            await api.post(`admin/submissions/${id}/reject/`, { feedback: rejectReason });
            alert("Submission Rejected.");
            fetchSubmissions();
            setSelectedSubmission(null);
            setRejectReason("");
        } catch (error) {
            alert("Rejection failed: " + (error.response?.data?.error || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="text-center p-4">Loading Submissions...</div>;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow mt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="text-amber-500" /> Pending Book Submissions
            </h2>

            {submissions.length === 0 ? (
                <p className="text-gray-500">No pending submissions.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            <tr>
                                <th className="p-3">Title</th>
                                <th className="p-3">Author</th>
                                <th className="p-3">Category</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map((sub) => (
                                <tr key={sub.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                                    <td className="p-3 font-medium text-gray-900 dark:text-white">{sub.title}</td>
                                    <td className="p-3">{sub.author || sub.submitter}</td>
                                    <td className="p-3">
                                        {sub.category_name ? (
                                            <span className="text-gray-700">{sub.category_name}</span>
                                        ) : sub.suggested_category_name ? (
                                            <span className="text-blue-600 font-semibold" title="New Category Suggestion">
                                                ★ {sub.suggested_category_name}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">N/A</span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                                            ${sub.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                                                sub.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    sub.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'}`}>
                                            {sub.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-3 flex gap-2">
                                        {sub.pdf_file && (
                                            <a href={sub.pdf_file} target="_blank" rel="noopener noreferrer"
                                                className="text-blue-500 hover:underline mr-2 text-xs flex items-center">
                                                View PDF
                                            </a>
                                        )}

                                        {/* Verify Button */}
                                        {sub.status === 'pending' && (
                                            <button
                                                onClick={() => handleVerify(sub.id)}
                                                disabled={actionLoading}
                                                className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 text-xs flex items-center gap-1"
                                            >
                                                <Search size={12} /> AI Verify
                                            </button>
                                        )}

                                        {/* View Report / Approve / Reject */}
                                        {(sub.status === 'verified' || sub.status === 'pending') && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setSelectedSubmission(sub);
                                                        setVerificationReport(sub.verification_report);
                                                    }}
                                                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs"
                                                >
                                                    Review
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Verification Modal / Detail View */}
            {selectedSubmission && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Verification Report: {selectedSubmission.title}</h3>
                            <button onClick={() => setSelectedSubmission(null)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* AI Duplicate Check */}
                            {verificationReport?.duplicate_check && (
                                <div className={`p-4 rounded-lg border-l-4 ${verificationReport.duplicate_check.is_duplicate
                                    ? 'bg-red-50 border-red-500'
                                    : 'bg-green-50 border-green-500'
                                    }`}>
                                    <h4 className="font-semibold text-gray-700 mb-1">
                                        {verificationReport.duplicate_check.is_duplicate ? '🔴' : '✅'} Duplicate Check
                                    </h4>
                                    <p className="text-sm text-gray-600">{verificationReport.duplicate_check.details}</p>
                                    {verificationReport.duplicate_check.similar_books?.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs font-semibold text-gray-500 mb-1">Similar books found:</p>
                                            {verificationReport.duplicate_check.similar_books.map((book, i) => (
                                                <p key={i} className="text-xs text-red-600 ml-2">
                                                    • "{book.title}" by {book.author} <span className="text-gray-400">({book.match_type})</span>
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Quality Score */}
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Quality Score</h4>
                                {verificationReport ? (
                                    <div className="flex items-center gap-3">
                                        <span className={`text-3xl font-bold ${verificationReport.quality_score >= 7 ? 'text-green-600' :
                                            verificationReport.quality_score >= 4 ? 'text-yellow-600' : 'text-red-600'
                                            }`}>
                                            {verificationReport.quality_score}/10
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${verificationReport.recommendation === 'approve' ? 'bg-green-100 text-green-800' :
                                            verificationReport.recommendation === 'review' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {verificationReport.recommendation?.toUpperCase()}
                                        </span>
                                    </div>
                                ) : <p className="text-sm text-gray-500">No report yet.</p>}
                            </div>

                            {/* Author Verification */}
                            {verificationReport?.author_verification && (
                                <div className={`p-4 rounded-lg border-l-4 ${verificationReport.author_verification.is_correct_author
                                    ? 'bg-green-50 border-green-500'
                                    : 'bg-red-50 border-red-500'
                                    }`}>
                                    <h4 className="font-semibold text-gray-700 mb-1">
                                        {verificationReport.author_verification.is_correct_author ? '✅' : '❌'} Author Verification
                                    </h4>
                                    <p className="text-sm text-gray-600">{verificationReport.author_verification.details}</p>
                                    {!verificationReport.author_verification.is_correct_author && (
                                        <p className="text-sm text-red-600 mt-1 font-medium">
                                            Known author: {verificationReport.author_verification.known_author}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Summary Accuracy */}
                            {verificationReport?.summary_accuracy && (
                                <div className={`p-4 rounded-lg border-l-4 ${verificationReport.summary_accuracy.is_accurate
                                    ? 'bg-green-50 border-green-500'
                                    : 'bg-orange-50 border-orange-500'
                                    }`}>
                                    <h4 className="font-semibold text-gray-700 mb-1">
                                        {verificationReport.summary_accuracy.is_accurate ? '✅' : '⚠️'} Summary Accuracy
                                    </h4>
                                    <p className="text-sm text-gray-600">{verificationReport.summary_accuracy.details}</p>
                                </div>
                            )}

                            {/* Content Analysis */}
                            {verificationReport?.content_analysis && (
                                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Content Analysis</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{verificationReport.content_analysis}</p>
                                </div>
                            )}

                            {/* Category Relevance */}
                            {verificationReport?.category_relevance && (
                                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Category Relevance</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{verificationReport.category_relevance}</p>
                                </div>
                            )}

                            {/* Flagged Issues */}
                            {verificationReport?.flagged_issues?.length > 0 && (
                                <div className="bg-yellow-50 dark:bg-gray-700 p-4 rounded-lg">
                                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">⚠️ Flagged Issues</h4>
                                    <ul className="list-disc pl-5 text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                                        {verificationReport.flagged_issues.map((issue, i) => (
                                            <li key={i}>{issue}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Recommendation Reason */}
                            {verificationReport?.recommendation_reason && (
                                <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg">
                                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">AI Recommendation</h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">{verificationReport.recommendation_reason}</p>
                                </div>
                            )}

                            {/* Submission Details */}
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Submission Details</h4>
                                <p className="text-sm"><strong>Author:</strong> {selectedSubmission.author}</p>
                                <p className="text-sm mt-1"><strong>Description:</strong> {selectedSubmission.description}</p>
                                <p className="text-sm mt-1"><strong>Summary:</strong> {selectedSubmission.summary_text}</p>
                                {selectedSubmission.suggested_category_name && (
                                    <p className="text-sm mt-2 text-blue-600">
                                        <strong>Suggested New Category:</strong> {selectedSubmission.suggested_category_name}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 mt-4 border-t pt-4">
                                <h4 className="font-semibold">Decision</h4>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleApprove(selectedSubmission.id)}
                                        disabled={actionLoading}
                                        className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2"
                                    >
                                        <Check size={18} /> Approve & Publish
                                    </button>

                                    <button
                                        onClick={() => handleVerify(selectedSubmission.id)}
                                        disabled={actionLoading}
                                        className="flex-1 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 flex items-center justify-center gap-2"
                                    >
                                        <Search size={18} /> Re-verify AI
                                    </button>

                                    <div className="flex-1 flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Rejection reason..."
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                            className="flex-1 border rounded px-2 text-sm dark:bg-gray-700 dark:text-white"
                                        />
                                        <button
                                            onClick={() => handleReject(selectedSubmission.id)}
                                            disabled={actionLoading}
                                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBookVerification;
