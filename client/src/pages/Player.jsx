import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBookDetails, getProxyUrl } from '../lib/api';

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    fetchBookDetails(id)
      .then((data) => {
        if (!data || data.error) throw new Error("Data error");
        setBook(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Player Load Error:", err);
        setLoading(false);
      });
  }, [id]);

  // THIS PREVENTS THE BLANK SCREEN CRASH
  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-cyan-400 font-bold">
      LOADING BOOK...
    </div>
  );

  if (!book || !book.media) return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white">
      <p>Book details not found.</p>
      <button onClick={() => navigate('/')} className="mt-4 bg-slate-800 px-4 py-2 rounded">Back to Library</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center p-6">
      <button onClick={() => navigate('/')} className="self-start mb-10 bg-slate-800 p-3 rounded-xl">←</button>
      
      <div className="aspect-[2/3] w-64 bg-slate-800 rounded-3xl shadow-2xl mb-8 overflow-hidden border border-white/5">
        <img src={getProxyUrl(`/api/items/${id}/cover`)} className="w-full h-full object-cover" alt="Cover" />
      </div>

      <div className="w-full max-w-md bg-slate-800/40 backdrop-blur-md p-8 rounded-[40px] border border-white/5 shadow-xl text-center">
        {/* Safe navigation using ?. prevents crashes */}
        <h2 className="text-lg font-bold truncate mb-1">{book.media?.metadata?.title}</h2>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-8">{book.media?.metadata?.authorName}</p>

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