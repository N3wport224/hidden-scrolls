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
    
    // STEP 1: INITIALIZE CLEAN PLAYBACK SESSION
    const initSession = async () => {
      try {
        console.log("🛠 Requesting isolated car-player session...");
        const res = await fetch(getProxyUrl(`/api/items/${id}/play`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // CRITICAL: Ignore existing browser cookies to prevent 404 conflicts
          credentials: 'omit', 
          body: JSON.stringify({ 
            deviceId: 'hidden-scrolls-car-pi-v1', 
            supportedMimeTypes: ['audio/mpeg'],
            forceDirectPlay: true 
          })
        });
        const data = await res.json();
        if (data.id) {
          console.log("✅ Car session authorized:", data.id);
          setSessionId(data.id); 
        }
      } catch (err) {
        console.error("❌ Session initialization failed:", err);
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
  const coverUrl = getProxyUrl(`/api/items/${id}/cover`);
  
  // STEP 2: BUILD AUTHORIZED STREAM URL
  const audioUrl = sessionId ? getProxyUrl(`/api/items/${id}/stream/${sessionId}`) : null;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-6">
      <div className="w-full max-w-3xl flex justify-between items-center mb-6">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white px-4 py-2">← Library</button>
        <button 
          onClick={() => setBluetoothMode(!bluetoothMode)}
          className={`px-4 py-2 rounded-full font-bold text-sm ${bluetoothMode ? 'bg-emerald-600' : 'bg-slate-700'}`}
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
              // Key ensures the element reloads only whenauthorized
              key={sessionId || 'loading'} 
              className="w-full h-10 invert-[.9]"
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={() => localStorage.setItem(`progress_${id}`, audioRef.current.currentTime)}
              preload="auto" 
            >
              {audioUrl && <source src={audioUrl} type="audio/mpeg" />}
            </audio>
            {!sessionId && <p className="text-center text-xs text-yellow-500 mt-2 italic animate-pulse">Initializing Secure Session...</p>}
        </div>
      </div>
    </div>
  );
}