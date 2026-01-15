import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBookDetails, getProxyUrl } from '../lib/api';

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchBookDetails(id)
      .then((data) => {
        if (!isMounted) return;
        if (!data || data.error) throw new Error("Could not find book details");
        setBook(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("❌ Player Error:", err);
        setError(err.message);
        setLoading(false);
      });

    return () => { isMounted = false; };
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="text-cyan-400 font-bold animate-pulse">RETRIEVING SCROLL...</div>
    </div>
  );

  if (error || !book) return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white p-10 text-center">
      <p className="text-red-400 mb-4 font-bold">ERROR: {error || "Book not found"}</p>
      <button onClick={() => navigate('/')} className="bg-slate-800 px-6 py-2 rounded-xl border border-white/10">Return to Library</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 flex flex-col items-center">
      <div className="w-full max-w-md flex justify-between mb-10">
        <button onClick={() => navigate('/')} className="bg-slate-800/50 p-3 rounded-xl active:scale-95 transition-transform">←</button>
        <div className="text-cyan-400 font-black italic tracking-tighter">PLAYING</div>
      </div>
      
      <div className="aspect-[2/3] w-64 bg-slate-800 rounded-3xl shadow-2xl mb-8 overflow-hidden border border-white/5">
        <img 
          src={getProxyUrl(`/api/items/${id}/cover`)} 
          className="w-full h-full object-cover" 
          alt="Cover"
        />
      </div>

      <div className="w-full max-w-md bg-slate-800/40 backdrop-blur-md p-8 rounded-[40px] border border-white/5 shadow-xl">
        <h2 className="text-lg font-bold truncate text-center mb-1">{book.media?.metadata?.title || 'Unknown Title'}</h2>
        <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest mb-8">{book.media?.metadata?.authorName || 'Unknown Author'}</p>

        <audio 
          ref={audioRef} 
          controls 
          className="w-full h-10 invert-[.9] opacity-80"
          src={getProxyUrl(`/api/items/${id}/file`)} 
        />
      </div>
    </div>
  );
}