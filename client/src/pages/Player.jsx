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
    
    // Handshake initialization
    const initSession = async () => {
      try {
        const res = await fetch(getProxyUrl(`/api/items/${id}/play`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Tells browser to save session cookies
          body: JSON.stringify({ 
            deviceId: 'hidden-scrolls-pi-fixed', 
            supportedMimeTypes: ['audio/mpeg'],
            forceDirectPlay: true 
          })
        });
        const data = await res.json();
        if (data.id) setSessionId(data.id); 
      } catch (err) { console.error("❌ Handshake failed:", err); }
    };
    initSession();
  }, [id]);

  if (!book) return <div className="p-10 text-center text-white">Loading...</div>;

  const metadata = book.media?.metadata || {};
  const chapters = book.media?.chapters || [];
  const coverUrl = getProxyUrl(`/api/items/${id}/cover`);
  const audioUrl = sessionId ? getProxyUrl(`/api/items/${id}/stream/${sessionId}`) : null;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-6">
      <div className="w-full max-w-3xl flex justify-between items-center mb-6 z-10">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white px-4 py-2">← Library</button>
      </div>

      <div className="w-full max-w-3xl flex flex-col items-center">
        <div className="aspect-[2/3] w-48 md:w-64 bg-slate-800 rounded-lg shadow-2xl overflow-hidden mb-6">
          <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">{metadata.title}</h1>
          <p className="text-gray-400 text-lg">{metadata.authorName}</p>
        </div>

        <div className="w-full bg-slate-800 p-6 rounded-xl shadow-lg mb-8">
            <audio 
              ref={audioRef} 
              controls 
              key={sessionId} // Remount element only once session is authorized
              className="w-full h-10 invert-[.9]"
              preload="auto" 
            >
              {audioUrl && <source src={audioUrl} type="audio/mpeg" />}
            </audio>
            {!sessionId && <p className="text-center text-xs text-yellow-500 mt-2 animate-pulse italic">Initializing Handshake...</p>}
        </div>

        <div className="w-full">
          <h3 className="text-xl font-bold mb-4 text-emerald-400">Chapters</h3>
          <div className="bg-slate-800 rounded-xl divide-y divide-slate-700 max-h-64 overflow-y-auto">
            {chapters.map((c, i) => (
              <button key={i} onClick={() => {if(audioRef.current){audioRef.current.currentTime = c.start; audioRef.current.play();}}} className="w-full text-left p-4 hover:bg-slate-700 flex justify-between">
                <span className="text-gray-300 font-medium">{c.title || `Chapter ${i + 1}`}</span>
                <span className="text-gray-500 text-sm">{new Date(c.start * 1000).toISOString().substr(11, 8)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}