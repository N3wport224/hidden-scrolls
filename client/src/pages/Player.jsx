import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBookDetails, getProxyUrl } from '../lib/api';

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [sessionId, setSessionId] = useState(null); 
  const audioRef = useRef(null);
  
  useEffect(() => {
    fetchBookDetails(id).then(setBook);
    
    const initSession = async () => {
      try {
        const res = await fetch(getProxyUrl(`/api/items/${id}/play`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Ignore admin cookies to avoid path/session conflicts
          credentials: 'omit', 
          body: JSON.stringify({ 
            deviceId: 'car-player-path-fix-v1', 
            supportedMimeTypes: ['audio/mpeg'],
            forceDirectPlay: true 
          })
        });
        const data = await res.json();
        if (data.id) setSessionId(data.id); 
      } catch (err) { console.error("❌ Session failed:", err); }
    };
    initSession();
  }, [id]);

  if (!book) return <div className="p-10 text-center text-white">Loading...</div>;

  const metadata = book.media?.metadata || {};
  const chapters = book.media?.chapters || [];
  const coverUrl = getProxyUrl(`/api/items/${id}/cover`);
  const audioUrl = sessionId ? getProxyUrl(`/api/items/${id}/stream/${sessionId}`) : null;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-6 text-center">
      <div className="aspect-[2/3] w-48 md:w-64 bg-slate-800 rounded-lg shadow-2xl mb-6 overflow-hidden">
        <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
      </div>

      <div className="w-full max-w-3xl bg-slate-800 p-6 rounded-xl shadow-lg mb-8">
          <audio 
            ref={audioRef} 
            controls 
            key={sessionId || 'loading'} 
            className="w-full h-10 invert-[.9]"
            preload="auto" 
          >
            {audioUrl && <source src={audioUrl} type="audio/mpeg" />}
          </audio>
      </div>

      <div className="w-full max-w-3xl">
        <h3 className="text-xl font-bold mb-4 text-emerald-400">Chapters</h3>
        <div className="bg-slate-800 rounded-xl divide-y divide-slate-700 max-h-64 overflow-y-auto text-left">
          {chapters.map((c, i) => (
            <button key={i} onClick={() => {if(audioRef.current){audioRef.current.currentTime = c.start; audioRef.current.play();}}} className="w-full p-4 hover:bg-slate-700 flex justify-between">
              <span className="text-gray-200">{c.title || `Chapter ${i + 1}`}</span>
              <span className="text-gray-500 text-sm">{new Date(c.start * 1000).toISOString().substr(11, 8)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}