import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/Api";
import { Camera, User, Phone, Save, X } from "lucide-react";
import uploadToCloudinary from "../utils/cloudinaryUpload";

// ── Toast ──────────────────────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
            <div
                key={t.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border pointer-events-auto
          ${t.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : t.type === "info" ? "bg-sky-50 border-sky-200 text-sky-800"
                            : "bg-red-50 border-red-200 text-red-800"}`}
                style={{ minWidth: 260 }}
            >
                <span className="text-lg">{t.type === "success" ? "✅" : t.type === "info" ? "ℹ️" : "❌"}</span>
                <p className="flex-1 text-sm font-semibold">{t.message}</p>
                <button type="button" onClick={() => removeToast(t.id)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                </button>
            </div>
        ))}
    </div>
);

const EditProfile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [uploadStatus, setUploadStatus] = useState("");

    const [profile, setProfile] = useState({
        name: "",
        phone_number: "",
        bio: "",
        profile_image: null,
    });

    const [previewImage, setPreviewImage] = useState(null);
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = "success") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    useEffect(() => {
        // Fetch current user profile
        const fetchProfile = async () => {
            try {
                const user = JSON.parse(localStorage.getItem("user") || "{}");
                if (!user.id) {
                    navigate("/login");
                    return;
                }

                // We fetch the profile using the user ID
                const res = await api.get(`profile/${user.id}/`);
                const data = res.data;

                setProfile({
                    name: data.name || "",
                    phone_number: data.phone_number || "", // Assuming this field exists in response
                    bio: data.bio || "",
                    profile_image: null, // We don't set the file object here, just the URL for preview if needed
                });

                if (data.profile_image_url) {
                    setPreviewImage(data.profile_image_url);
                }
            } catch (err) {
                console.error("Failed to fetch profile", err);
                addToast("Failed to load profile data", "error");
            } finally {
                setFetching(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfile({ ...profile, profile_image: file });
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let profileImageUrl = profile.profile_image_url || ""; // Existing or none

            if (profile.profile_image) {
                // Upload newly selected image to Cloudinary
                profileImageUrl = await uploadToCloudinary(profile.profile_image, (pct) =>
                    setUploadStatus(`Uploading Image... ${pct}%`)
                );
            }

            const payload = {
                bio: profile.bio,
            };

            if (profileImageUrl) {
                payload.profile_image_url = profileImageUrl;
            }

            await api.patch("profile/update/", payload);

            addToast("Profile updated successfully!", "success");

            // Navigate back to profile page after a short delay
            setTimeout(() => {
                const user = JSON.parse(localStorage.getItem("user") || "{}");
                navigate(`/profile/${user.id}`);
            }, 1000);
        } catch (err) {
            console.error("Update failed", err);
            addToast(err.response?.data?.error || "Failed to update profile", "error");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
            <Toast toasts={toasts} removeToast={removeToast} />
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
                <div className="md:flex md:flex-col">
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">Edit Profile</h2>
                            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Profile Image Upload */}
                            <div className="flex flex-col items-center justify-center mb-6">
                                <div className="relative group cursor-pointer">
                                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 shadow-sm relative">
                                        <img
                                            src={previewImage || "https://via.placeholder.com/150"}
                                            alt="Profile Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="text-white w-8 h-8" />
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        id="profile-image"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Click to change photo</p>
                            </div>

                            {/* Read-Only Fields */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={profile.name}
                                        readOnly
                                        disabled
                                        className="pl-10 block w-full rounded-md border-gray-300 bg-gray-100 text-gray-500 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 border"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Name cannot be changed.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={profile.phone_number}
                                        readOnly
                                        disabled
                                        className="pl-10 block w-full rounded-md border-gray-300 bg-gray-100 text-gray-500 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 border"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Phone number cannot be changed.</p>
                            </div>

                            {/* Editable Fields */}
                            <div>
                                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                <textarea
                                    id="bio"
                                    rows={4}
                                    value={profile.bio}
                                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                                    placeholder="Tell us a little about yourself..."
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="mr-3 inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 flex items-center gap-2"
                                >
                                    {loading ? (uploadStatus || "Saving...") : <><Save size={16} /> Save Changes</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProfile;
