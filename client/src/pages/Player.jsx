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
          credentials: 'omit',
          body: JSON.stringify({ 
            deviceId: 'car-player-final-v3', 
            supportedMimeTypes: ['audio/mpeg', 'audio/mp4'],
            forceDirectPlay: true 
          })
        });
        const data = await res.json();
        if (data.id) setSessionId(data.id); 
      } catch (err) { console.error("❌ Session failed:", err); }
    };
    initSession();
  }, [id]);

  const forceLoad = () => {
    if (audioRef.current) {
      audioRef.current.load(); // Forces the browser to re-request the source
      const savedTime = localStorage.getItem(`progress_${id}`);
      if (savedTime) audioRef.current.currentTime = parseFloat(savedTime);
      audioRef.current.play().catch(e => console.log("Unlock playback..."));
    }
  };

  if (!book) return <div className="p-10 text-center text-white">Connecting...</div>;

  const audioUrl = sessionId ? getProxyUrl(`/public/session/${sessionId}/track/1`) : null;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-6">
      <div className="w-full max-w-3xl flex justify-between mb-8">
        <button onClick={() => navigate('/')} className="text-gray-400 font-bold">← Library</button>
      </div>

      <div className="w-full max-w-3xl flex flex-col items-center">
        <div className="aspect-[2/3] w-48 bg-slate-800 rounded-xl shadow-2xl mb-8 overflow-hidden">
          <img src={getProxyUrl(`/api/items/${id}/cover`)} className="w-full h-full object-cover" />
        </div>

        <div className="w-full bg-slate-800 p-8 rounded-2xl shadow-lg mb-8 border border-slate-700 text-center">
            <button 
                onClick={forceLoad}
                className="mb-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-full shadow-lg"
            >
                Initialize Audio Engine
            </button>
            
            <audio 
              ref={audioRef} 
              controls 
              key={sessionId || 'loading'} 
              className="w-full h-12 invert-[.9]"
              onTimeUpdate={() => {
                if (audioRef.current) localStorage.setItem(`progress_${id}`, audioRef.current.currentTime);
              }}
              preload="auto" 
              playsInline 
            >
              {audioUrl && <source src={audioUrl} type="audio/mpeg" />}
            </audio>
        </div>

        {/* Chapters */}
        <div className="w-full">
          <div className="bg-slate-800 rounded-xl divide-y divide-slate-700 max-h-64 overflow-y-auto">
            {book.media?.chapters?.map((c, i) => (
              <button 
                key={i} 
                onClick={() => { if(audioRef.current) { audioRef.current.currentTime = c.start; audioRef.current.play(); } }} 
                className="w-full p-4 hover:bg-slate-700 flex justify-between text-left"
              >
                <span>{c.title || `Chapter ${i + 1}`}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}