import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import { Volume2, Square, ArrowLeft } from "lucide-react";
import api from "../services/Api";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Ensure we use the exact version of pdfjs-dist matched with react-pdf 10+
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const BookReader = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [voices, setVoices] = useState([]);
  const [reading, setReading] = useState(false);
  const [currentPageInView, setCurrentPageInView] = useState(1);
  const [readingPage, setReadingPage] = useState(null);
  const [showBreakOverlay, setShowBreakOverlay] = useState(false);
  const [breakMessage, setBreakMessage] = useState("");
  const [forceExit, setForceExit] = useState(false);


  useEffect(() => {
    // time constants
    const ONE_HOUR = 60 * 60 * 1000;
    const TWO_HOURS = 2 * ONE_HOUR;
    const TEN_HOURS = 10 * ONE_HOUR;

    // 1️⃣ Show first break after 1 hour
    const firstBreakTimer = setTimeout(() => {
      setBreakMessage("📖 You’ve been reading for 1 hour. Take a short break ☕");
      setShowBreakOverlay(true);
    }, ONE_HOUR);

    // 2️⃣ Show break every 2 hours
    const repeatBreakInterval = setInterval(() => {
      setBreakMessage("⏳ You’ve been reading continuously. Please take a break ☕");
      setShowBreakOverlay(true);
    }, TWO_HOURS);

    // 3️⃣ Final warning after 10 hours (NO immediate navigation)
    const forceExitTimer = setTimeout(() => {
      setBreakMessage(
        "👀 Continuous screen reading for long hours may affect your eyes.\n\nWe will navigate you to Home. Please take a proper break."
      );
      setForceExit(true);          // 👈 mark as final
      setShowBreakOverlay(true);   // 👈 show overlay
    }, TEN_HOURS);

    // cleanup when user leaves page
    return () => {
      clearTimeout(firstBreakTimer);
      clearInterval(repeatBreakInterval);
      clearTimeout(forceExitTimer);
    };
  }, [navigate]);


  /* ---------------- SPEECH SETUP ---------------- */
  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  /* ---------------- FETCH BOOK ---------------- */
  useEffect(() => {
    const fetchBook = async () => {
      const res = await api.get(`/books/${id}/`);
      setBook(res.data);
    };
    fetchBook();
  }, [id]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const page = Number(entry.target.dataset.page);
            setCurrentPageInView(page);
          }
        });
      },
      { threshold: 0.6 }
    );

    const pages = document.querySelectorAll(".pdf-page");
    pages.forEach(page => observer.observe(page));

    return () => observer.disconnect();
  }, [numPages]);


  /* ---------------- AI READ CURRENT VIEW ---------------- */
  const readVisibleText = () => {
    const page = document.querySelector(
      `.pdf-page[data-page="${currentPageInView}"] 
     .react-pdf__Page__textContent`
    );

    if (!page) return;

    const text = page.innerText;
    if (!text) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice =
      voices.find(v => v.lang.startsWith("en")) || voices[0];

    setReading(true);
    setReadingPage(currentPageInView);

    utterance.onend = () => {
      setReading(false);
      setReadingPage(null);
    };

    window.speechSynthesis.speak(utterance);
  };


  const stopReading = () => {
    window.speechSynthesis.cancel();
    setReading(false);
    setReadingPage(null);
  };

  const getPdfUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;

    const cleanUrl = url.startsWith("/") ? url.substring(1) : url;
    if (cleanUrl.startsWith("media/")) {
      return `${process.env.REACT_APP_API_URL}/${cleanUrl}`;
    }
    return `${process.env.REACT_APP_API_URL}/media/${cleanUrl}`;
  };


  if (!book)
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">

      {/* -------- TOP BAR -------- */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <h2 className="font-bold text-slate-800 truncate max-w-md">
          {book.title}
        </h2>

        <div className="flex gap-3">
          <button
            onClick={readVisibleText}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Volume2 size={16} /> Read
          </button>

          <button
            onClick={stopReading}
            className="flex items-center gap-2 bg-slate-200 px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white"
          >
            <Square size={16} /> Stop
          </button>
        </div>
      </div>

      {/* -------- READING INDICATOR -------- */}
      {reading && (
        <div className="bg-blue-50 text-blue-700 text-sm py-2 text-center animate-pulse">
          🔊 Reading visible pages…
        </div>
      )}

      {/* -------- PDF CONTINUOUS SCROLL -------- */}
      <div className="flex-1 overflow-y-auto flex justify-center py-8">
        <Document
          file={getPdfUrl(book.pdf_file)}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<p className="text-slate-500">Loading PDF...</p>}
          error={<p className="text-red-500">Failed to load PDF file. Please try again.</p>}
        >
          {Array.from(new Array(numPages), (_, index) => {
            const pageNum = index + 1;
            const isReading = readingPage === pageNum;

            return (
              <div
                key={pageNum}
                data-page={pageNum}
                className={`pdf-page mb-10 p-3 transition-all ${isReading ? "bg-yellow-200" : ""
                  }`}
              >
                <Page
                  pageNumber={pageNum}
                  scale={1.3}
                  className="shadow-lg"
                />
              </div>
            );
          })}

        </Document>
      </div>
      {showBreakOverlay && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 max-w-md text-center shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Take a Break</h2>
            <p className="text-slate-700 mb-6">{breakMessage}</p>

            <button
              onClick={() => setShowBreakOverlay(false)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      )}


    </div>
  );
};

export default BookReader;
