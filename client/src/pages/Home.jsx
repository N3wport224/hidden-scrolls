import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLibrary, getProxyUrl } from '../lib/api';

export default function Home() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [sortBy, setSortBy] = useState('title'); // State for sorting
  
  // PASTE YOUR REAL IDS HERE
  const LIBRARIES = {
    EVA: "575767a4-d45d-466c-8295-8766aa060b44", 
    ANDREW: "0ba1af4e-3bc0-4192-9d2d-dc9811e5f6e5"
  };

  const [activeLib, setActiveLib] = useState(localStorage.getItem('active_lib') || LIBRARIES.EVA);

  useEffect(() => {
    localStorage.setItem('active_lib', activeLib);
    fetchLibrary(activeLib)
      .then(data => {
        // Apply initial sort on fetch
        const sorted = sortBooks(data, sortBy);
        setBooks(sorted);
      })
      .catch(err => console.error("Library Switch Error:", err));
  }, [activeLib]);

  // Sorting Logic
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
      <header className="flex justify-between items-center mb-10 max-w-5xl mx-auto px-2">
        {/* LEFT: Tucked away Library Dropdown */}
        <div className="relative group">
          <select 
            value={activeLib}
            onChange={(e) => setActiveLib(e.target.value)}
            className="bg-slate-800/60 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-cyan-400 outline-none appearance-none cursor-pointer active:scale-95 transition-all"
          >
            <option value={LIBRARIES.EVA}>EVA'S SCROLLS</option>
            <option value={LIBRARIES.ANDREW}>ANDREW'S BOOKS</option>
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] opacity-50">▼</div>
        </div>

        <h1 className="text-xl font-black italic text-white tracking-tighter uppercase absolute left-1/2 -translate-x-1/2">
          Hidden Scrolls
        </h1>

        {/* RIGHT: Sorting Dropdown */}
        <div className="relative">
          <select 
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="bg-slate-800/60 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 outline-none appearance-none cursor-pointer"
          >
            <option value="title">SORT: TITLE</option>
            <option value="author">SORT: AUTHOR</option>
          </select>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {books.length > 0 ? books.map((book) => (
          <div 
            key={book.id} 
            onClick={() => navigate(`/player/${book.id}`)}
            className="group relative bg-slate-800/30 rounded-[28px] overflow-hidden border border-white/5 active:scale-95 transition-all"
          >
            <div className="aspect-[2/3] overflow-hidden">
              <img 
                src={getProxyUrl(`/api/items/${book.id}/cover`)} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                alt={book.media?.metadata?.title}
              />
            </div>
            <div className="p-3 bg-slate-900/90 text-center">
              <h3 className="text-[10px] font-bold truncate uppercase tracking-tight text-white mb-0.5">
                {book.media?.metadata?.title}
              </h3>
              <p className="text-[8px] text-slate-500 truncate uppercase italic font-medium">
                {book.media?.metadata?.authorName}
              </p>
            </div>
          </div>
        )) : (
          <div className="col-span-full text-slate-600 text-[10px] uppercase font-bold italic text-center mt-20 tracking-widest">
            Scanning archives...
          </div>
        )}
      </div>
    </div>
  );
}