import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLibrary, getProxyUrl } from '../lib/api';

export default function Home() {
  const [books, setBooks] = useState([]);
  const [sortBy, setSortBy] = useState('title');

  useEffect(() => {
    // Fetches the library from the proxy-enabled API helper
    fetchLibrary().then(setBooks).catch(err => console.error("Library load error:", err));
  }, []);

  // Sorts books dynamically based on the selected criteria
  const sorted = [...books].sort((a, b) => {
    const field = sortBy === 'title' ? 'title' : 'authorName';
    const valA = (a.media?.metadata?.[field] || '').toLowerCase();
    const valB = (b.media?.metadata?.[field] || '').toLowerCase();
    return valA.localeCompare(valB);
  });

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-cyan-400 italic tracking-tighter">HIDDEN SCROLLS</h1>
        
        {/* Sort Controls: Car-friendly button sizes */}
        <div className="flex bg-slate-800 p-1 rounded-lg border border-white/5">
          <button 
            onClick={() => setSortBy('title')} 
            className={`px-4 py-2 rounded-md text-[10px] font-bold transition-all ${sortBy === 'title' ? 'bg-cyan-500 text-[#0f172a]' : 'text-slate-400'}`}
          >
            TITLE
          </button>
          <button 
            onClick={() => setSortBy('author')} 
            className={`px-4 py-2 rounded-md text-[10px] font-bold transition-all ${sortBy === 'author' ? 'bg-cyan-500 text-[#0f172a]' : 'text-slate-400'}`}
          >
            AUTHOR
          </button>
        </div>
      </div>

      {/* Grid Display: Proxy handles cover image authentication */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {sorted.map(b => (
          <Link to={`/player/${b.id}`} key={b.id} className="group text-center">
            <div className="relative overflow-hidden rounded-2xl aspect-[2/3] mb-3 border border-white/10 shadow-lg group-active:scale-95 transition-transform">
              <img 
                src={getProxyUrl(`/api/items/${b.id}/cover`)} 
                className="w-full h-full object-cover" 
                alt={b.media?.metadata?.title}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[11px] font-bold truncate px-1 uppercase tracking-tight">{b.media?.metadata?.title}</p>
            <p className="text-[9px] text-slate-500 truncate px-1 italic">{b.media?.metadata?.authorName}</p>
          </Link>
        ))}
      </div>

      {books.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
          <p className="animate-pulse italic">Scanning library for scrolls...</p>
        </div>
      )}
    </div>
  );
}