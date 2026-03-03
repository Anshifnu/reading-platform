import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import api from "../services/Api";
import { useAuth } from "../context/AuthContext";
import { ChevronLeft, ChevronRight, BookOpen, Search, Grid, MapPin, CheckCircle2 } from "lucide-react";
import Chatbot from "../components/Chatbot";

const Books = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const bookSliderRefs = useRef({});
  const categorySliderRef = useRef(null);

  const params = new URLSearchParams(location.search);
  const categoryFromUrl = params.get("category");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const catRes = await api.get("/categories/");
        setCategories(catRes.data);

        let url = "/books/";
        const queryParams = [];
        if (categoryFromUrl) queryParams.push(`categories__name=${encodeURIComponent(categoryFromUrl)}`);
        if (searchQuery) queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
        if (queryParams.length > 0) url += `?${queryParams.join("&")}`;

        const res = await api.get(url);
        setBooks(res.data.results || res.data);
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categoryFromUrl, searchQuery]);

  const booksByCategory = {};
  books.forEach(book => {
    const cats = book.categories?.length > 0 ? book.categories : [{ name: "Uncategorized" }];
    cats.forEach(category => {
      if (!booksByCategory[category.name]) booksByCategory[category.name] = [];
      booksByCategory[category.name].push(book);
    });
  });

  const sortedCategories = Object.keys(booksByCategory).sort((a, b) => booksByCategory[b].length - booksByCategory[a].length);
  const displayCategories = categoryFromUrl ? [categoryFromUrl].filter(cat => booksByCategory[cat]) : sortedCategories;

  if (user?.role === "admin") return <Navigate to="/admin" replace />;

  const scrollSlider = (sliderRef, direction) => {
    if (sliderRef) {
      sliderRef.scrollBy({ left: direction === 'left' ? -500 : 500, behavior: 'smooth' });
    }
  };


  return (
    <div className="min-h-screen bg-[#FDFCFB] text-slate-900 font-sans">
      {/* --- PREMIUM HEADER --- */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2 rounded-lg shadow-blue-200 shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {categoryFromUrl ? categoryFromUrl : "Central Library"}
              </h1>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Digital Archives</p>
            </div>
          </div>

          <div className="relative group w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 transition-colors group-focus-within:text-blue-600" />
            <input
              type="text"
              placeholder="Search by title, author, or ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-100/50 border-none rounded-full focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm outline-none"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* --- AI LIBRARIAN CHATBOT --- */}
        <section className="mb-16">
          <Chatbot />
        </section>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm font-medium">Curating your collection...</p>
          </div>
        ) : (
          <div className="space-y-20">
            {displayCategories.map((categoryName) => (
              <section key={categoryName} className="relative">
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">{categoryName}</h2>
                    <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
                  </div>
                  {!categoryFromUrl && (
                    <button
                      onClick={() => navigate(`/books?category=${encodeURIComponent(categoryName)}`)}
                      className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest"
                    >
                      Browse All
                    </button>
                  )}
                </div>

                <div className="group relative">
                  {/* Navigation Arrows */}
                  <button
                    onClick={() => scrollSlider(bookSliderRefs.current[categoryName], 'left')}
                    className="absolute -left-5 top-[40%] -translate-y-1/2 z-20 bg-white shadow-xl border border-slate-100 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-700" />
                  </button>

                  <div
                    ref={el => bookSliderRefs.current[categoryName] = el}
                    className="flex gap-8 overflow-x-auto scrollbar-hide pb-8 snap-x"
                  >
                    {booksByCategory[categoryName]?.map((book) => (
                      <div key={book.id} className="flex-shrink-0 w-44 snap-start">
                        <div className="flex flex-col gap-4">
                          {/* Book Cover Container */}
                          <div
                            onClick={() => navigate(`/books/${book.id}`)}
                            className="relative aspect-[2/3] rounded-md overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] cursor-pointer group/cover transition-transform duration-500 hover:-translate-y-2"
                          >
                            {book.images?.length > 0 ? (
                              <img
                                src={book.images[0].image}
                                alt={book.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-200 flex items-center justify-center"><BookOpen className="text-slate-400" /></div>
                            )}
                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-xs font-bold uppercase tracking-widest border border-white/50 px-3 py-1.5 backdrop-blur-sm">Quick View</span>
                            </div>
                          </div>

                          {/* Controls based on availability */}
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => navigate(`/books/${book.id}`)}
                              className={`w-full py-2.5 text-xs font-bold uppercase tracking-tighter rounded border transition-all ${book.is_public
                                ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                              <span className="flex items-center justify-center gap-2">
                                {book.is_public ? <BookOpen className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                                {book.is_public ? "Read Online" : "Locate Book"}
                              </span>
                            </button>

                            {/* Status Indicator */}
                            <div className="flex items-center gap-1.5 px-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Available Now</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => scrollSlider(bookSliderRefs.current[categoryName], 'right')}
                    className="absolute -right-5 top-[40%] -translate-y-1/2 z-20 bg-white shadow-xl border border-slate-100 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-700" />
                  </button>
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-slate-200 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-400 text-sm">© 2026 Institutional Library Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Books;