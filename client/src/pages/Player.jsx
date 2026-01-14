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
  const [isUnlocked, setIsUnlocked] = useState(false); // Mobile unlock state
  const audioRef = useRef(null);
  const silentRef = useRef(null); 
  
  useEffect(() => {
    fetchBookDetails(id).then(setBook);
    
    const initSession = async () => {
      try {
        const res = await fetch(getProxyUrl(`/api/items/${id}/play`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'omit',
          body: JSON.stringify({ 
            deviceId: 'car-player-pi-final', 
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

  // Bluetooth Keep-Alive
  useEffect(() => {
    if (silentRef.current && isUnlocked) {
      bluetoothMode ? silentRef.current.play().catch(() => {}) : silentRef.current.pause();
    }
  }, [bluetoothMode, isUnlocked]);

  // MOBILE UNLOCK: This function MUST be triggered by a click to let the phone load audio
  const unlockAndPlay = () => {
    if (audioRef.current) {
      setIsUnlocked(true);
      const savedTime = localStorage.getItem(`progress_${id}`);
      if (savedTime) audioRef.current.currentTime = parseFloat(savedTime);
      audioRef.current.play().catch(e => console.log("Playback start pending..."));
    }
  };

  const skip = (seconds) => {
    if (audioRef.current) audioRef.current.currentTime += seconds;
  };

  if (!book) return <div className="p-10 text-center text-white">Loading Metadata...</div>;

  const metadata = book.media?.metadata || {};
  const chapters = book.media?.chapters || [];
  const coverUrl = getProxyUrl(`/api/items/${id}/cover`);
  const audioUrl = sessionId ? getProxyUrl(`/public/session/${sessionId}/track/1`) : null;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-6 relative">
      
      {/* MOBILE OVERLAY: Disappears once the user taps to start audio */}
      {!isUnlocked && sessionId && (
        <div className="absolute inset-0 z-50 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center">
          <button 
            onClick={unlockAndPlay}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-6 px-12 rounded-full text-2xl shadow-2xl animate-bounce"
          >
            TAP TO PLAY
          </button>
          <p className="mt-4 text-gray-400">Mobile browsers require a tap to start audio.</p>
        </div>
      )}

      <div className="w-full max-w-3xl flex justify-between items-center mb-6">
        <button onClick={() => navigate('/')} className="text-gray-400 font-bold px-4 py-2">← Library</button>
        <button 
          onClick={() => setBluetoothMode(!bluetoothMode)}
          className={`px-4 py-2 rounded-full font-bold text-sm ${bluetoothMode ? 'bg-emerald-600' : 'bg-slate-700'}`}
        >
          {bluetoothMode ? 'Bluetooth Active' : 'Enable Bluetooth'}
        </button>
      </div>

      <audio ref={silentRef} src={SILENT_AUDIO_SRC} loop />

      <div className="w-full max-w-3xl flex flex-col items-center">
        <div className="aspect-[2/3] w-48 md:w-64 bg-slate-800 rounded-lg shadow-2xl mb-6 overflow-hidden border border-slate-700">
          <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">{metadata.title}</h1>
          <p className="text-gray-400 text-lg italic">{metadata.authorName}</p>
        </div>

        <div className="w-full bg-slate-800 p-6 rounded-xl shadow-lg mb-8 border border-slate-700">
            <div className="flex justify-center gap-8 mb-6">
              <button onClick={() => skip(-15)} className="rounded-full bg-slate-700 w-16 h-16 text-lg">↺ 15</button>
              <button onClick={() => skip(30)} className="rounded-full bg-slate-700 w-16 h-16 text-lg">30 ↻</button>
            </div>

            <audio 
              ref={audioRef} 
              controls 
              key={sessionId || 'loading'} 
              className="w-full h-10 invert-[.9]"
              onTimeUpdate={() => {
                  if (audioRef.current) localStorage.setItem(`progress_${id}`, audioRef.current.currentTime);
              }}
              preload="auto" 
              playsInline 
            >
              {audioUrl && <source src={audioUrl} type="audio/mpeg" />}
            </audio>
        </div>

        <div className="w-full">
          <h3 className="text-xl font-bold mb-4 text-emerald-400">Chapters</h3>
          <div className="bg-slate-800 rounded-xl divide-y divide-slate-700 max-h-80 overflow-y-auto border border-slate-700">
            {chapters.map((c, i) => (
              <button 
                key={i} 
                onClick={() => { if(audioRef.current) { audioRef.current.currentTime = c.start; audioRef.current.play(); setIsUnlocked(true); } }} 
                className="w-full p-4 hover:bg-slate-700 flex justify-between text-left"
              >
                <span className="text-gray-200 font-medium">{c.title || `Chapter ${i + 1}`}</span>
                <span className="text-gray-500 text-sm font-mono">{new Date(c.start * 1000).toISOString().substr(11, 8)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}