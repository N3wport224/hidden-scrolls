import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLibrary, getProxyUrl } from '../lib/api';

export default function Home() {
  const [books, setBooks] = useState([]);
  const [sortBy, setSortBy] = useState('title'); // Default sort by title

  useEffect(() => {
    fetchLibrary().then(setBooks);
  }, []);

  // SORTING LOGIC
  const sortedBooks = [...books].sort((a, b) => {
    const valA = sortBy === 'title' 
      ? (a.media?.metadata?.title || '').toLowerCase() 
      : (a.media?.metadata?.authorName || '').toLowerCase();
    
    const valB = sortBy === 'title' 
      ? (b.media?.metadata?.title || '').toLowerCase() 
      : (b.media?.metadata?.authorName || '').toLowerCase();

    return valA.localeCompare(valB);
  });

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header & Sort Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <h1 className="text-4xl font-black tracking-tighter text-cyan-400">HIDDEN SCROLLS</h1>
          
          <div className="flex bg-slate-800/50 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setSortBy('title')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortBy === 'title' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              SORT BY TITLE
            </button>
            <button 
              onClick={() => setSortBy('author')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortBy === 'author' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              SORT BY AUTHOR
            </button>
          </div>
        </div>

        {/* Book Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {sortedBooks.map((book) => (
            <Link 
              to={`/player/${book.id}`} 
              key={book.id}
              className="group flex flex-col items-center text-center transition-transform active:scale-95"
            >
              <div className="aspect-[2/3] w-full bg-slate-800 rounded-2xl overflow-hidden mb-3 shadow-xl border border-white/5 group-hover:border-cyan-500/50 transition-colors">
                <img 
                  src={getProxyUrl(`/api/items/${book.id}/cover`)} 
                  className="w-full h-full object-cover"
                  alt={book.media?.metadata?.title}
                />
              </div>
              <h3 className="text-sm font-bold truncate w-full px-1">{book.media?.metadata?.title}</h3>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{book.media?.metadata?.authorName || 'Unknown Author'}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}