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
    fetchBookDetails(id).then(data => {
      setBook(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  // PREVENTS BLANK SCREEN
  if (loading) return <div className="min-h-screen bg-[#0f172a] text-cyan-400 flex items-center justify-center">LOADING...</div>;
  if (!book || !book.media) return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Book details not found.</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 flex flex-col items-center">
      <button onClick={() => navigate('/')} className="self-start mb-10 bg-slate-800 p-3 rounded-xl">←</button>
      
      <img src={getProxyUrl(`/api/items/${id}/cover`)} className="w-64 rounded-3xl shadow-2xl mb-10 border border-white/10" />

      <div className="w-full max-w-md bg-slate-800/50 p-8 rounded-[40px] border border-white/5 text-center">
        <h2 className="text-xl font-bold mb-1">{book.media.metadata.title}</h2>
        <p className="text-xs text-slate-400 mb-8">{book.media.metadata.authorName}</p>

        <audio ref={audioRef} controls className="w-full invert opacity-80">
          <source src={getProxyUrl(`/api/items/${id}/file`)} type="audio/mpeg" />
        </audio>
      </div>
    </div>
  );
}