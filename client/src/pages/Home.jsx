import { useEffect, useState } from 'react';
import { fetchBooks } from '../lib/api';
import { Book, Headphones, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const PROXY_URL = 'http://localhost:3000/api/proxy';

function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks().then((data) => {
      setBooks(data.results || []);
      setLoading(false);
    });
  }, []);

  const getProxyLink = (path) => `${PROXY_URL}?path=${encodeURIComponent(path)}`;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <header className="mb-8 flex items-center gap-3">
        <Headphones className="w-8 h-8 text-emerald-400" />
        <h1 className="text-3xl font-bold">Hidden Scrolls</h1>
      </header>

      {loading ? (
        <div className="text-center text-slate-500 animate-pulse mt-20">Loading Library...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {books.map((book) => (
            // LINK to the new details page
            <Link key={book.id} to={`/book/${book.id}`} className="group relative bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-emerald-500/20 transition-all border border-slate-700/50 block">
              <div className="aspect-[2/3] bg-slate-700 relative">
                <img 
                    src={getProxyLink(`/api/items/${book.id}/cover`)} 
                    alt={book.media.metadata.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="absolute inset-0 flex items-center justify-center z-0 opacity-20 pointer-events-none">
                    <Book className="w-12 h-12 text-slate-100" />
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <div className="bg-emerald-500 p-4 rounded-full shadow-xl">
                        <Play className="w-8 h-8 text-white fill-current ml-1" />
                    </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold truncate text-slate-200">{book.media.metadata.title}</h3>
                <p className="text-sm text-slate-400 truncate">{book.media.metadata.authorName}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;