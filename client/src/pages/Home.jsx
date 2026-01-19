import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLibrary, getProxyUrl } from '../lib/api';

export default function Home() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  
  // REPLACE THESE WITH YOUR ACTUAL IDS FROM ABS DASHBOARD
  const LIBRARIES = {
    EVA: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNWUzYTE4ZC0wMjkxLTQ5NzMtOTc0ZS0zYzczNTNiNjY0MjYiLCJ1c2VybmFtZSI6IkV2YUJvb2tzIiwiaWF0IjoxNzU0NjM5MDM0fQ.91Y5e0Smif-9sDwHMveWCUrnUKbd98eBAD7K8y7Uc4Q", 
    ANDREW: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhNDQ0YTA3ZC05NjQ2LTQ1NjAtOGM2Ny0zZDYzMjRkZWYzOTIiLCJ1c2VybmFtZSI6IkFuZHJld0Jvb2tzIiwiaWF0IjoxNzY4NzU5NDAyfQ.KcMuyDuNrUKM4qArkDgJpy2ci3SYmUVD83tDcsrNdzc"
  };

  const [activeLib, setActiveLib] = useState(localStorage.getItem('active_lib') || LIBRARIES.EVA);

  useEffect(() => {
    localStorage.setItem('active_lib', activeLib);
    fetchLibrary(activeLib).then(setBooks);
  }, [activeLib]);

  return (
    <div className="min-h-screen bg-[#0f172a] p-6 font-sans">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-black italic text-cyan-400 tracking-tighter mb-6 uppercase">
          Hidden Scrolls
        </h1>
        
        {/* THE TOGGLE BUTTONS */}
        <div className="flex gap-3 justify-center">
          <button 
            onClick={() => setActiveLib(LIBRARIES.EVA)}
            className={`px-5 py-2 rounded-2xl text-[10px] font-bold transition-all border ${
              activeLib === LIBRARIES.EVA 
              ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
              : 'bg-slate-800/50 border-white/5 text-slate-500'
            }`}
          >
            EVA'S SCROLLS
          </button>
          <button 
            onClick={() => setActiveLib(LIBRARIES.ANDREW)}
            className={`px-5 py-2 rounded-2xl text-[10px] font-bold transition-all border ${
              activeLib === LIBRARIES.ANDREW 
              ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
              : 'bg-slate-800/50 border-white/5 text-slate-500'
            }`}
          >
            ANDREW'S BOOKS
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
        {books.map((book) => (
          <div 
            key={book.id} 
            onClick={() => navigate(`/player/${book.id}`)}
            className="group relative bg-slate-800/40 rounded-[32px] overflow-hidden border border-white/5 active:scale-95 transition-all shadow-xl"
          >
            <div className="aspect-[2/3] overflow-hidden">
              <img 
                src={getProxyUrl(`/api/items/${book.id}/cover`)} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                alt={book.media?.metadata?.title}
              />
            </div>
            <div className="p-4 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent">
              <h3 className="text-[11px] font-bold truncate uppercase tracking-tight text-white">
                {book.media?.metadata?.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}