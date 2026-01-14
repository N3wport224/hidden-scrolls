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
          // MANDATORY: Tells the browser to save/send session cookies
          credentials: 'include', 
          body: JSON.stringify({ 
            deviceId: 'hidden-scrolls-pi-v1', // Static ID for session stability
            supportedMimeTypes: ['audio/mpeg'],
            forceDirectPlay: true 
          })
        });
        const data = await res.json();
        if (data.id) {
          console.log("✅ Session ID Captured:", data.id);
          setSessionId(data.id); 
        }
      } catch (err) {
        console.error("❌ Handshake failed:", err);
      }
    };
    initSession();
  }, [id]);

  if (!book) return <div className="p-10 text-center text-white">Loading...</div>;

  const metadata = book.media?.metadata || {};
  const coverUrl = getProxyUrl(`/api/items/${id}/cover`);
  const audioUrl = sessionId ? getProxyUrl(`/api/items/${id}/stream/${sessionId}`) : null;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-6">
      <div className="w-full max-w-3xl flex justify-between items-center mb-6">
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

        <div className="w-full bg-slate-800 p-6 rounded-xl shadow-lg mb-8 text-center">
            <audio 
              ref={audioRef} 
              controls 
              // Re-mount the audio tag only once session is authorized
              key={sessionId || 'loading'} 
              className="w-full h-10 invert-[.9]"
              preload="auto" 
            >
              {audioUrl && <source src={audioUrl} type="audio/mpeg" />}
            </audio>
            {!sessionId && <p className="text-center text-xs text-yellow-500 mt-2 animate-pulse italic">Initializing Handshake...</p>}
        </div>
      </div>
    </div>
  );
}