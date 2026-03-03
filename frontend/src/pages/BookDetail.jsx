import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/Api";
import {
  Star,
  MessageSquare,
  Play,
  Square,
  Volume2,
  MoreHorizontal,
  Check,
  Plus,
  Download
} from "lucide-react";
import Chatbot from "../components/Chatbot";

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [speechLang, setSpeechLang] = useState(null);
  const [voices, setVoices] = useState([]);
  const [displaySummary, setDisplaySummary] = useState("");
  const [similarBooks, setSimilarBooks] = useState([]);

  const handleStartReading = () => {
    navigate(`/reader/${book.id}`);
  };

  // Fetch Similar Books
  useEffect(() => {
    const fetchSimilar = async () => {
      if (!book?.categories?.[0]?.name) return;
      try {
        const res = await api.get(`/books/?categories__name=${book.categories[0].name}`);
        // Filter out current book and limit to 10
        const filtered = res.data.results
          ? res.data.results.filter(b => b.id !== book.id)
          : res.data.filter(b => b.id !== book.id);
        setSimilarBooks(filtered.slice(0, 10));
      } catch (err) {
        console.error("Failed to fetch similar books", err);
      }
    };
    if (book) fetchSimilar();
  }, [book]);

  // Speech Setup
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) setVoices(availableVoices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Data Fetching
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await api.get(`/books/${id}/`);
        setBook(res.data);
        checkFavorite(res.data.id);
      } catch (err) {
        console.error("Failed to fetch book", err);
      }
    };
    const fetchFeedbacks = async () => {
      try {
        const res = await api.get(`/books/${id}/feedbacks/`);
        setFeedbacks(res.data);
        if (res.data.summary_text) setDisplaySummary(res.data.summary_text);
      } catch (err) {
        console.error("Failed to fetch feedback", err);
      }
    };
    fetchBook();
    fetchFeedbacks();
  }, [id]);

  const checkFavorite = async (bookId) => {
    try {
      const res = await api.get("/favorites/");
      const exists = res.data.some(fav => fav.id === bookId);
      setIsFavorite(exists);
    } catch (e) {
      console.log("Favorite check failed");
      setIsFavorite(false);
    }
  };

  // Translation Logic
  useEffect(() => {
    const translateAndSet = async () => {
      if (!book?.summary_text) return;
      if (!speechLang || speechLang === "English") {
        setDisplaySummary(book.summary_text);
        return;
      }
      const translated = await translateText(book.summary_text, speechLang);
      setDisplaySummary(translated);
    };
    translateAndSet();
  }, [speechLang, book]);

  const translateText = async (text, targetLang) => {
    try {
      const langMap = { Hindi: "hi", Tamil: "ta", Malayalam: "ml", Telugu: "te" };
      const res = await api.post("/translate/", { text, target: langMap[targetLang] });
      return res.data.translatedText || text;
    } catch (err) {
      return text;
    }
  };

  const languageMap = {
    English: "en-US", Hindi: "hi-IN", Tamil: "ta-IN", Malayalam: "ml-IN", Telugu: "te-IN",
  };

  const speakSummary = () => {
    if (!displaySummary) return;
    window.speechSynthesis.cancel();
    const langCode = languageMap[speechLang] || "en-US";
    const matchingVoice = voices.find(v => v.lang.startsWith(langCode.split("-")[0]));
    if (!matchingVoice) {
      alert(`Voice not available for ${speechLang}.`);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(displaySummary);
    utterance.lang = langCode;
    utterance.voice = matchingVoice;
    window.speechSynthesis.speak(utterance);
  };

  const stopVoice = () => window.speechSynthesis.cancel();

  const submitFeedback = async () => {
    if (!comment.trim()) return;
    try {
      await api.post(`/books/${id}/feedbacks/`, { comment, rating });
      setComment("");
      setRating(0);
      const res = await api.get(`/books/${id}/feedbacks/`);
      setFeedbacks(res.data);
    } catch (err) {
      console.error("Failed to submit feedback", err);
    }
  };

  const toggleFavorite = async () => {
    if (!book?.id || favLoading) return;

    try {
      setFavLoading(true);

      if (isFavorite) {
        // REMOVE favorite
        await api.delete(`/favorites/remove/${book.id}/`);
        setIsFavorite(false);
      } else {
        // ADD favorite
        await api.post("/favorites/add/", {
          book_id: book.id,
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Favorite toggle failed", error);
      alert("Failed to update favorite");
    } finally {
      setFavLoading(false);
    }
  };

  if (!book) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-black animate-spin"></div>
      </div>
    </div>
  );

  return (
    <div className="bg-[#FFFFFF] min-h-screen font-sans text-[#333333]">
      <div className="max-w-[1100px] mx-auto px-4 py-8">

        {/* Main 2-Column Layout */}
        <div className="flex flex-col md:flex-row gap-12 items-start relative">

          {/* LEFT COLUMN: Cover & Actions (Sticky) */}
          <div className="w-full md:w-[300px] flex-shrink-0 flex flex-col gap-4 sticky top-24 h-fit items-center">
            {/* Book Cover Container - Centered & Styled */}
            <div className="w-[260px] rounded-r-md rounded-b-md overflow-hidden shadow-xl border-r-[3px] border-b-[3px] border-gray-800 transform rotate-1 hover:rotate-0 transition-transform duration-300">
              <img
                src={book.images?.[0]?.image}
                alt={book.title}
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Goodreads-style Buttons */}
            <div className="w-full space-y-3 text-center mt-4 px-4">
              <button
                onClick={toggleFavorite}
                disabled={favLoading}
                className={`w-full py-2.5 rounded-full font-bold text-sm border-2 transition-all flex items-center justify-center gap-2 ${isFavorite
                  ? "bg-[#F2FCF6] text-[#377458] border-[#377458]"
                  : "bg-white text-[#333333] border-[#333333] hover:bg-gray-50"
                  }`}
              >
                {isFavorite ? <Check size={16} /> : <Plus size={16} />}
                {favLoading ? "Updating..." : isFavorite ? "Want to read" : "Want to read"}
              </button>

              <button
                onClick={handleStartReading}
                className="w-full py-2.5 border-2 border-[#409D69] rounded-full text-sm font-bold text-[#409D69] hover:bg-[#F2FCF6] transition-colors"
              >
                Start Reading
              </button>

              <a
                href={`https://t.me/WeWantBook_bot?start=download_book_${book.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 border-2 border-gray-300 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                title="Download PDF via Telegram"
              >
                <Download size={16} />
                Download PDF
              </a>

              <div className="flex flex-col items-center pt-4 gap-1">
                <div className="flex bg-white items-center justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${i < Math.round(book.average_rating) ? "fill-[#FA604A] text-[#FA604A]" : "fill-white text-gray-300"}`}
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
                <p className="text-xs text-[#333333] mt-1 font-sans">Rate this book</p>
              </div>
            </div>
          </div>


          {/* RIGHT COLUMN: Details */}
          <div className="flex-1">
            <h1 className="text-3xl font-serif font-bold text-[#333333] mb-1 leading-tight">{book.title}</h1>
            <h2 className="text-lg text-[#333333] mb-4 font-serif">
              <span className="text-gray-500">by</span> <span className="font-bold underline decoration-gray-300 underline-offset-2 hover:text-[#409D69] cursor-pointer">{book.author}</span>
            </h2>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-1">
                <div className="flex text-[#FA604A] text-xs">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(book.average_rating) ? "fill-current" : "fill-gray-200 text-gray-200"}`} />
                  ))}
                </div>
                <span className="font-bold text-[#333333] text-base ml-1">{book.average_rating ? book.average_rating.toFixed(2) : "0.00"}</span>
              </div>
              <span className="text-xs text-gray-300">•</span>
              <span className="text-[#00635D] font-semibold flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> {feedbacks.length} Ratings
              </span>
              <span className="text-xs text-gray-300">•</span>
              <span className="text-[#00635D] font-semibold">{feedbacks.length} Reviews</span>
            </div>

            <div className="prose prose-sm text-[#333333] leading-7 mb-8 font-serif text-[15px]">
              <p>{book.description}</p>
            </div>

            {/* Book Details Grid */}
            <div className="text-sm text-gray-500 mb-8 font-sans space-y-1">
              <p><span className="font-bold text-gray-400">Pages:</span> {book.pages}</p>
              <p><span className="font-bold text-gray-400">Published:</span> {new Date(book.created_at).toLocaleDateString()}</p>
              <p><span className="font-bold text-gray-400">Language:</span> {book.language}</p>
              <p><span className="font-bold text-gray-400">Publisher:</span> {book.publisher}</p>
            </div>

            {/* AI Summary Section */}
            {book.summary_text && (
              <div className="bg-[#F9F9F9] p-6 rounded-lg border border-gray-100 mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 font-serif flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-gray-400" /> AI Summary
                  </h3>
                  <div className="flex gap-2">
                    {["English", "Hindi", "Tamil", "Malayalam"].map((label) => (
                      <button
                        key={label}
                        onClick={() => setSpeechLang(label)}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${speechLang === label
                          ? "bg-gray-800 text-white border-gray-800"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 italic text-sm mb-4 leading-relaxed">"{displaySummary}"</p>
                <div className="flex gap-3">
                  <button onClick={speakSummary} className="text-xs font-bold text-[#409D69] flex items-center gap-1 hover:underline">
                    <Play className="w-3 h-3 fill-current" /> Listen
                  </button>
                  <button onClick={stopVoice} className="text-xs font-bold text-gray-500 flex items-center gap-1 hover:underline">
                    <Square className="w-3 h-3 fill-current" /> Stop
                  </button>
                </div>
              </div>
            )}

            {/* AI Chatbot for this Book */}
            {book && (
              <div className="mb-10 h-[500px]">
                <Chatbot
                  initialContext={`The user is currently looking at the book "${book.title}" by ${book.author}. Category: ${book.categories?.[0]?.name}. Summary: ${book.summary_text}. Pretend you have read the PDF of this book and use this summary to answer any questions about the book's contents, plot or summary.`}
                  placeholder={`Ask AI to read the PDF and summarize ${book.title}...`}
                />
              </div>
            )}

            {/* Books in this Category (Carousel) */}
            {similarBooks.length > 0 && (
              <div className="mb-10">
                <h3 className="font-serif font-bold text-xl mb-4 text-[#333333]">
                  Books in {book.categories?.[0]?.name}
                </h3>
                <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
                  {similarBooks.map((simBook) => (
                    <div
                      key={simBook.id}
                      onClick={() => navigate(`/books/${simBook.id}`)}
                      className="flex-shrink-0 w-[140px] cursor-pointer group"
                    >
                      <div className="w-full h-[210px] rounded-sm overflow-hidden border border-gray-200 mb-2 relative">
                        <img
                          src={simBook.images?.[0]?.image || simBook.image}
                          alt={simBook.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <h4 className="font-serif font-bold text-sm text-[#333333] leading-tight mb-1 group-hover:underline">
                        {simBook.title}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">{simBook.author}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <hr className="border-gray-200 my-8" />

            {/* Reviews Section */}
            <div>
              <h3 className="font-serif font-bold text-xl mb-6 text-[#333333]">Ratings & Reviews</h3>

              {/* My Review Input */}
              <div className="flex gap-4 mb-10">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold shrink-0">
                  ME
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">What do you think?</p>
                  </div>

                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button key={r} onClick={() => setRating(r)} className="focus:outline-none transition-transform hover:scale-110">
                        <Star className={`w-8 h-8 ${rating >= r ? "fill-[#FA604A] text-[#FA604A]" : "text-gray-200"}`} />
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <textarea
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#409D69] outline-none transition-all resize-none"
                      placeholder="Write a review..."
                      rows="3"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={submitFeedback}
                        className="bg-[#333333] text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-black transition-colors"
                      >
                        Post Review
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-8">
                {feedbacks.map((fb) => (
                  <div key={fb.id} className="border-b border-gray-100 pb-8 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#f4f1ea] border border-[#d6d0c4] flex items-center justify-center text-[#333333] text-xs font-bold">
                          {fb.user[0]}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#333333] hover:underline cursor-pointer">{fb.user}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date().toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3 pl-14">
                      <div className="flex text-[#FA604A] text-xs">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < fb.rating ? "fill-current" : "text-gray-200"}`} />
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-[#333333] leading-7 pl-14 font-serif">
                      {fb.comment}
                    </div>
                    <div className="mt-4 pl-14 flex gap-4 text-xs font-bold text-gray-400">
                      <button className="hover:text-gray-600 transition-colors">Like</button>
                      <button className="hover:text-gray-600 transition-colors">Comment</button>
                      <MoreHorizontal className="w-4 h-4 hover:text-gray-600 cursor-pointer" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div >
      </div >
    </div >
  );
};

export default BookDetail;