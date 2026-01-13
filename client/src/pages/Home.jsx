import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchBooks, getProxyUrl } from '../lib/api'; // Import the helper

export default function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks().then((data) => {
      if (data && data.results) {
        setBooks(data.results);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-400">Loading Library...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-emerald-400">🎧 Hidden Scrolls</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {books.map((book) => (
          <Link key={book.id} to={`/book/${book.id}`} className="block bg-slate-800 rounded-lg overflow-hidden hover:scale-105 transition">
            
            {/* FIXED IMAGE SOURCE */}
            <div className="aspect-[2/3] bg-slate-700 relative">
                <img 
                  src={getProxyUrl(`/api/items/${book.id}/cover`)} 
                  alt={book.media?.metadata?.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
            </div>

            <div className="p-3">
              <h3 className="font-semibold text-white truncate">{book.media?.metadata?.title}</h3>
              <p className="text-sm text-gray-400 truncate">{book.media?.metadata?.authorName}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}