import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { checkGrammar } from "../services/aiApi";
import axios from "../services/Api";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css"; // Import styles
import toast from "react-hot-toast";

const WriteContent = () => {
  const [content, setContent] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [correctedContent, setCorrectedContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const quillRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const workToEdit = location.state?.workToEdit;

  useEffect(() => {
    if (workToEdit) {
      setContent(workToEdit.content || "");
    }
  }, [workToEdit]);

  const handlePublish = async () => {
    // Check if content is empty (handling HTML tags)
    const plainText = content.replace(/<(.|\n)*?>/g, "").trim();
    if (!plainText) {
      toast.error("Content cannot be empty");
      return;
    }

    // Navigate to details page for both new and edit modes
    navigate("/publish-details", {
      state: {
        content,
        workToEdit: workToEdit // Pass existing work data if editing
      }
    });
  };

  const handleCheckGrammar = async () => {
    // We only strip HTML here momentarily just to check if the user actually typed any text
    if (!content.replace(/<(.|\n)*?>/g, "").trim()) {
      toast.error("Please write some content first.");
      return;
    }

    setLoading(true);
    setError("");
    setSuggestions([]);
    setCorrectedContent("");

    try {
      // Create a temporary DOM to safely manipulate the HTML structure
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const images = doc.querySelectorAll('img');
      const imageDict = {};
      let imgCount = 0;

      // Swap out all massive Base64 strings for tiny placeholders
      images.forEach((img) => {
        const src = img.getAttribute('src');
        if (src && src.startsWith('data:image')) {
          const placeholderId = `__IMAGE_PLACEHOLDER_${imgCount}__`;
          imageDict[placeholderId] = src;
          img.setAttribute('src', placeholderId);
          imgCount++;
        }
      });

      const lightweightContent = doc.body.innerHTML;

      // Send the ultra-lightweight HTML to the AI
      const data = await checkGrammar(lightweightContent);

      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);

        let restoredContent = data.corrected_content;

        // Swap all placeholders BACK to their original Base64 strings
        if (restoredContent && Object.keys(imageDict).length > 0) {
          Object.keys(imageDict).forEach((placeholderId) => {
            restoredContent = restoredContent.split(placeholderId).join(imageDict[placeholderId]);
          });
        }

        setCorrectedContent(restoredContent);
        toast.success(`Found ${data.suggestions.length} issues. Check the suggestions list.`, { icon: '📝' });
      } else {
        toast.success("No grammar errors found! Great job. 🎉");
      }

    } catch (err) {
      console.error("Grammar check failed:", err);
      setError("Failed to check grammar. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const applyCorrections = () => {
    if (correctedContent) {
      setContent(correctedContent);
      setSuggestions([]);
      setCorrectedContent("");
      toast.success("Corrections applied! (Note: Formatting might be reset)");
    }
  };

  // Modules for Toolbar
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
      ['link', 'image'],
      ['clean'],
      [{ 'align': [] }]
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'align'
  ];

  return (
    <div style={{ backgroundColor: "#f3f4f6", minHeight: "100vh", padding: "40px 20px", fontFamily: "'Merriweather', serif" }}>

      {/* Header / Actions */}
      <div style={{ maxWidth: "800px", margin: "0 auto 20px auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ color: "#333", margin: 0 }}>
          {workToEdit ? "Edit Draft" : "New Draft"}
        </h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleCheckGrammar}
            disabled={loading}
            style={{
              padding: "10px 15px",
              backgroundColor: "white",
              color: "#333",
              border: "1px solid #ddd",
              borderRadius: "5px",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontWeight: "500"
            }}
          >
            {loading ? "Checking..." : "✨ Check Grammar"}
          </button>

          <button
            onClick={handlePublish}
            style={{
              padding: "10px 20px",
              backgroundColor: "#d32f2f",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            {workToEdit ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      {/* Editor Container (The "Sheet") */}
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        backgroundColor: "white",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        borderRadius: "2px",
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column"
      }}>
        <ReactQuill
          theme="snow"
          ref={quillRef}
          value={content}
          onChange={setContent}
          modules={modules}
          formats={formats}
          placeholder="Tell your story..."
          style={{
            height: "calc(100% - 42px)", // Adjust for toolbar height approximately
            border: "none",
            flexGrow: 1
          }}
        />
      </div>

      {/* Grammar Suggestions Panel */}
      {suggestions.length > 0 && (
        <div style={{ maxWidth: "800px", margin: "20px auto", padding: "15px", backgroundColor: "white", borderRadius: "8px", borderLeft: "5px solid #ffc107", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h3 style={{ margin: 0 }}>Grammar Suggestions</h3>
            {correctedContent && (
              <button
                onClick={applyCorrections}
                style={{
                  padding: "5px 10px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.9em"
                }}
              >
                Apply Fixes
              </button>
            )}
          </div>
          <ul style={{ paddingLeft: "20px" }}>
            {suggestions.map((s, index) => (
              <li key={index} style={{ marginBottom: "5px" }}>{s}</li>
            ))}
          </ul>
          <p style={{ fontSize: "0.9em", color: "#666" }}>
            *Applying fixes will replace the editor content.
          </p>
        </div>
      )}

      {error && <div style={{ maxWidth: "800px", margin: "10px auto", color: "red", textAlign: "center" }}>{error}</div>}

      {/* Global Style overrides for Quill to look cleaner */}
      <style>{`
        .ql-container.ql-snow {
          border: none !important;
          font-size: 18px;
          line-height: 1.6;
        }
        .ql-toolbar.ql-snow {
          border: none !important;
          border-bottom: 1px solid #eee !important;
          position: sticky;
          top: 0;
          background: white;
          z-index: 10;
        }
        .ql-editor {
          min-height: 60vh;
          padding: 40px 50px; 
        }
        .ql-editor.ql-blank::before {
          font-style: italic;
          color: #aaa;
        }
      `}</style>

    </div>
  );
};

export default WriteContent;
