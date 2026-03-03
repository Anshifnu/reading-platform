import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/Api";
import { BookOpen, Lock } from "lucide-react";

const Favorite = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await api.get("/favorites/");
      setFavorites(res.data);
    } catch (err) {
      console.error("Failed to load favorites", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 font-semibold">
        Loading favorites...
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 font-semibold">
        No favorite books yet ❤️
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-black text-slate-900 mb-10">
          Your Favorite Books
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all"
            >
              {/* Book Image */}
              <div
                onClick={() => navigate(`/books/${fav.id}`)}
                className="cursor-pointer overflow-hidden"
              >
                <img
                  src={fav.image || "/placeholder-book.jpg"}
                  alt={fav.title}
                  className="w-full h-56 object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <h3
                  onClick={() => navigate(`/books/${fav.id}`)}
                  className="font-bold text-slate-900 cursor-pointer hover:text-blue-600 transition"
                >
                  {fav.title}
                </h3>

                {fav.is_public ? (
                  <button
                    onClick={() => navigate(`/reader/${fav.id}`)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <BookOpen className="w-4 h-4" />
                    Read Book
                  </button>
                ) : (
                  <div className="w-full bg-slate-100 text-slate-500 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
                    <Lock className="w-4 h-4" />
                    Private Book
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Favorite;
