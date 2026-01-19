import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLibrary, getProxyUrl } from '../lib/api';

export default function Home() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [sortBy, setSortBy] = useState('title');
  
  // Real IDs from your dashboard
  const LIBRARIES = {
    EVA: "575767a4-d45d-466c-8295-8766aa060b44", 
    ANDREW: "0ba1af4e-3bc0-4192-9d2d-dc9811e5f6e5"
  };

  const [activeLib, setActiveLib] = useState(localStorage.getItem('active_lib') || LIBRARIES.EVA);

  useEffect(() => {
    localStorage.setItem('active_lib', activeLib);
    fetchLibrary(activeLib)
      .then(data => {
        setBooks(sortBooks(data, sortBy));
      })
      .catch(err => console.error("Library Switch Error:", err));
  }, [activeLib]);

  const sortBooks = (bookList, criteria) => {
    return [...bookList].sort((a, b) => {
      const valA = (criteria === 'title' ? a.media?.metadata?.title : a.media?.metadata?.authorName) || "";
      const valB = (criteria === 'title' ? b.media?.metadata?.title : b.media?.metadata?.authorName) || "";
      return valA.localeCompare(valB);
    });
  };

  const handleSortChange = (criteria) => {
    setSortBy(criteria);
    setBooks(sortBooks(books, criteria));
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 font-sans text-slate-200">
      {/* IMPROVED STACKED HEADER TO PREVENT OVERLAP */}
      <header className="max-w-5xl mx-auto mb-8 pt-4 flex flex-col items-center">
        <h1 className="text-2xl font-black italic text-white tracking-tighter uppercase mb-6 drop-shadow-lg">
          Hidden Scrolls
        </h1>
        
        <div className="w-full flex justify-between items-center gap-3">
          {/* LIBRARY DROPDOWN (LEFT) */}
          <div className="relative flex-1 max-w-[150px]">
            <select 
              value={activeLib}
              onChange={(e) => setActiveLib(e.target.value)}
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-cyan-400 outline-none appearance-none cursor-pointer"
            >
              <option value={LIBRARIES.EVA}>EVA'S SCROLLS</option>
              <option value={LIBRARIES.ANDREW}>ANDREW'S BOOKS</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-cyan-400 opacity-60">▼</div>
          </div>

          {/* SORT DROPDOWN (RIGHT) */}
          <div className="relative flex-1 max-w-[150px]">
            <select 
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 outline-none appearance-none cursor-pointer"
            >
              <option value="title">SORT: TITLE</option>
              <option value="author">SORT: AUTHOR</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] opacity-60">▼</div>
          </div>
        </div>
      </header>

      {/* BOOK GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
        {books.map((book) => (
          <div 
            key={book.id} 
            onClick={() => navigate(`/player/${book.id}`)}
            className="group bg-slate-800/20 rounded-[24px] overflow-hidden border border-white/5 active:scale-95 transition-all shadow-md"
          >
            <div className="aspect-[2/3] overflow-hidden">
              <img 
                src={getProxyUrl(`/api/items/${book.id}/cover`)} 
                className="w-full h-full object-cover" 
                alt={book.media?.metadata?.title}
              />
            </div>
            <div className="p-3 bg-slate-900/60 backdrop-blur-sm text-center">
              <h3 className="text-[10px] font-bold truncate uppercase tracking-tight text-white mb-0.5">
                {book.media?.metadata?.title}
              </h3>
              <p className="text-[8px] text-slate-500 truncate uppercase italic">
                {book.media?.metadata?.authorName}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}