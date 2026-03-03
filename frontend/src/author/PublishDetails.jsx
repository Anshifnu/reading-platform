import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/Api"; // your axios instance
import { ArrowLeft, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

const PublishDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const content = location.state?.content || "";
  const workToEdit = location.state?.workToEdit;

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (workToEdit) {
      setTitle(workToEdit.title || "");
      setSummary(workToEdit.summary || "");
      setCategory(workToEdit.category || "");
      // For existing image, we show duplicate preview (URL), but 'image' state remains null unless changed
      if (workToEdit.image) {
        setImagePreview(workToEdit.image);
      }
    }
  }, [workToEdit]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!title || !summary || !category) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("summary", summary);
      formData.append("category", category);
      formData.append("content", content);

      if (image) {
        formData.append("image", image);
      }

      // Map summary to description and summary_text
      formData.append("description", summary);
      formData.append("summary_text", summary);

      if (workToEdit) {
        await api.put(`authors/work/${workToEdit.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Work updated successfully! 🚀");
        navigate("/publisher");
      } else {
        await api.post("authors/work-create/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Work published successfully! 🚀");
        navigate("/publisher");
      }

    } catch (error) {
      console.error(error);
      toast.error("Error saving work. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#f9f9f9", minHeight: "100vh", padding: "40px 20px", display: "flex", justifyContent: "center", alignItems: "flex-start", fontFamily: "'Merriweather', serif" }}>

      <div style={{
        backgroundColor: "white",
        padding: "40px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "700px"
      }}>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          style={{ display: "flex", alignItems: "center", gap: "5px", background: "none", border: "none", cursor: "pointer", color: "#666", marginBottom: "20px", fontSize: "14px" }}
        >
          <ArrowLeft size={16} /> Back to Edit
        </button>

        <h2 style={{ fontSize: "28px", color: "#333", marginBottom: "30px", fontWeight: "700" }}>
          {workToEdit ? "Update Details" : "Story Preview"}
        </h2>

        {/* Cover Image Upload */}
        <div style={{ marginBottom: "30px" }}>
          <label style={{ display: "block", marginBottom: "10px", fontWeight: "600", color: "#444" }}>Story Cover</label>
          <div
            style={{
              border: "2px dashed #ddd",
              borderRadius: "8px",
              padding: "20px",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: "#fafafa",
              position: "relative",
              height: "200px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden"
            }}
            onClick={() => document.getElementById("cover-upload").click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Cover Preview" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0 }} />
            ) : (
              <>
                <ImageIcon size={48} color="#ccc" />
                <p style={{ color: "#888", marginTop: "10px", fontSize: "14px" }}>Click to upload cover image</p>
              </>
            )}
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
          </div>
          {imagePreview && (
            <button
              onClick={(e) => { e.stopPropagation(); setImage(null); setImagePreview(null); }}
              style={{ marginTop: "5px", background: "none", border: "none", color: "red", fontSize: "12px", cursor: "pointer", textDecoration: "underline" }}
            >
              Remove Image
            </button>
          )}
        </div>

        {/* Title Input */}
        <div style={{ marginBottom: "25px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#444" }}>Title</label>
          <input
            type="text"
            placeholder="Enter a catchy title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 15px",
              fontSize: "18px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              outline: "none",
              fontWeight: "500",
              backgroundColor: "#fff"
            }}
          />
        </div>

        {/* Summary Input */}
        <div style={{ marginBottom: "25px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#444" }}>Summary</label>
          <textarea
            placeholder="Briefly describe what your story is about..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows="4"
            style={{
              width: "100%",
              padding: "12px 15px",
              fontSize: "16px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              outline: "none",
              resize: "vertical",
              fontFamily: "inherit"
            }}
          />
          <p style={{ textAlign: "right", fontSize: "12px", color: "#888", marginTop: "5px" }}>{summary.length}/200</p>
        </div>

        {/* Category Input */}
        <div style={{ marginBottom: "35px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#444" }}>Category</label>
          <input
            type="text"
            placeholder="e.g. Technology, Fiction, Life..."
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 15px",
              fontSize: "16px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              outline: "none"
            }}
          />
          <p style={{ fontSize: "12px", color: "#888", marginTop: "5px" }}>Add a main category to help readers find your story.</p>
        </div>


        {/* Action Buttons */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "30px",
            fontSize: "18px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 4px 6px rgba(40, 167, 69, 0.2)",
            transition: "background-color 0.2s"
          }}
        >
          {loading ? "Processing..." : workToEdit ? "Update Work" : "Publish Now"}
        </button>

      </div>
    </div>
  );
};

export default PublishDetails;
