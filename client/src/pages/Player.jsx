import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBookDetails, getProxyUrl } from '../lib/api';

const SILENT_AUDIO_SRC = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////wAAAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////wAAAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [bluetoothMode, setBluetoothMode] = useState(false);
  const [sessionId, setSessionId] = useState(null); 
  const audioRef = useRef(null);
  const silentRef = useRef(null); 
  
  useEffect(() => {
    fetchBookDetails(id).then(setBook);
    
    const initSession = async () => {
      try {
        const res = await fetch(getProxyUrl(`/api/items/${id}/play`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Tells the browser to save and send the session cookie
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

  useEffect(() => {
    if (silentRef.current) {
      bluetoothMode ? silentRef.current.play().catch(() => {}) : silentRef.current.pause();
    }
  }, [bluetoothMode]);

  const handleLoadedMetadata = () => {
    const savedTime = localStorage.getItem(`progress_${id}`);
    if (savedTime && audioRef.current) audioRef.current.currentTime = parseFloat(savedTime);
  };

  if (!book) return <div className="p-10 text-center text-white">Loading...</div>;

  const metadata = book.media?.metadata || {};
  const chapters = book.media?.chapters || [];
  const coverUrl = getProxyUrl(`/api/items/${id}/cover`);
  const audioUrl = sessionId ? getProxyUrl(`/api/items/${id}/stream/${sessionId}`) : null;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-6">
      <div className="w-full max-w-3xl flex justify-between items-center mb-6 z-10">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white px-4 py-2">← Library</button>
        <button 
          onClick={() => setBluetoothMode(!bluetoothMode)}
          className={`px-4 py-2 rounded-full font-bold text-sm ${bluetoothMode ? 'bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}
        >
          {bluetoothMode ? 'Bluetooth Active' : 'Enable Bluetooth Mode'}
        </button>
      </div>

      <audio ref={silentRef} src={SILENT_AUDIO_SRC} loop />

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
              // Remount the audio element only once the session is authorized
              key={sessionId || 'waiting'} 
              className="w-full h-10 invert-[.9]"
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={() => localStorage.setItem(`progress_${id}`, audioRef.current.currentTime)}
              preload="auto" 
            >
              {audioUrl && <source src={audioUrl} type="audio/mpeg" />}
            </audio>
            {!sessionId && <p className="text-center text-xs text-yellow-500 mt-2 animate-pulse italic">Initializing Handshake...</p>}
        </div>

        <div className="w-full">
          <h3 className="text-xl font-bold mb-4 text-emerald-400">Chapters</h3>
          <div className="bg-slate-800 rounded-xl divide-y divide-slate-700 max-h-64 overflow-y-auto shadow-lg">
            {chapters.map((c, i) => (
              <button key={i} onClick={() => {if(audioRef.current){audioRef.current.currentTime = c.start; audioRef.current.play();}}} className="w-full text-left p-4 hover:bg-slate-700 flex justify-between transition">
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