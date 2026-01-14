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
            deviceId: 'car-player-final-fix', 
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

  const handleMetadata = () => {
    const savedTime = localStorage.getItem(`progress_${id}`);
    if (savedTime && audioRef.current) {
      audioRef.current.currentTime = parseFloat(savedTime);
      // Attempt to play immediately once metadata is ready
      audioRef.current.play().catch(() => console.log("Waiting for user tap..."));
    }
  };

  if (!book) return <div className="p-10 text-center text-white font-bold">Connecting...</div>;

  const metadata = book.media?.metadata || {};
  const chapters = book.media?.chapters || [];
  const audioUrl = sessionId ? getProxyUrl(`/public/session/${sessionId}/track/1`) : null;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-6">
      <div className="w-full max-w-3xl flex justify-between mb-8">
        <button onClick={() => navigate('/')} className="text-gray-400 font-bold">← Library</button>
      </div>

      <div className="w-full max-w-3xl flex flex-col items-center">
        <div className="aspect-[2/3] w-56 bg-slate-800 rounded-xl shadow-2xl mb-8 overflow-hidden border border-slate-700">
          <img src={getProxyUrl(`/api/items/${id}/cover`)} className="w-full h-full object-cover" alt="Cover" />
        </div>

        <h1 className="text-2xl font-bold text-center mb-1">{metadata.title}</h1>
        <p className="text-gray-400 mb-8">{metadata.authorName}</p>

        <div className="w-full bg-slate-800 p-8 rounded-2xl shadow-lg mb-8 border border-slate-700">
            <audio 
              ref={audioRef} 
              controls 
              key={sessionId || 'loading'} 
              className="w-full h-12 invert-[.9]"
              onLoadedMetadata={handleMetadata}
              onTimeUpdate={() => {
                if (audioRef.current) localStorage.setItem(`progress_${id}`, audioRef.current.currentTime);
              }}
              preload="auto" 
              playsInline 
            >
              {audioUrl && <source src={audioUrl} type="audio/mpeg" />}
            </audio>
            {!sessionId && <p className="text-center text-yellow-500 text-sm mt-4 animate-pulse">Handshaking with Server...</p>}
        </div>

        <div className="w-full">
          <h3 className="text-xl font-bold mb-4 text-emerald-400">Chapters</h3>
          <div className="bg-slate-800 rounded-xl divide-y divide-slate-700 max-h-64 overflow-y-auto border border-slate-700">
            {chapters.map((c, i) => (
              <button 
                key={i} 
                onClick={() => { if(audioRef.current) { audioRef.current.currentTime = c.start; audioRef.current.play(); } }} 
                className="w-full p-4 hover:bg-slate-700 flex justify-between text-left"
              >
                <span className="font-medium">{c.title || `Chapter ${i + 1}`}</span>
                <span className="text-gray-500 text-sm">{new Date(c.start * 1000).toISOString().substr(11, 8)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}