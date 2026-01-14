import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBookDetails, getProxyUrl } from '../lib/api';

// Silent MP3 to maintain Bluetooth connection in the car
const SILENT_AUDIO_SRC = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////wAAAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////wAAAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [bluetoothMode, setBluetoothMode] = useState(false);
  const [sessionId, setSessionId] = useState(null); 
  const audioRef = useRef(null);
  const silentRef = useRef(null); 
  const seekApplied = useRef(false); // Flag to ensure we only auto-seek once per session

  useEffect(() => {
    fetchBookDetails(id).then(setBook);
    const initSession = async () => {
      try {
        const res = await fetch(getProxyUrl(`/api/items/${id}/play`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'omit', 
          body: JSON.stringify({ 
            deviceId: 'car-player-pi-clean', 
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

  // BLUETOOTH KEEP-ALIVE LOGIC
  useEffect(() => {
    if (silentRef.current) {
      if (bluetoothMode) {
        // Play silent audio to keep the car head unit engaged
        silentRef.current.play().catch(() => console.log("Silent audio waiting for interaction"));
      } else {
        silentRef.current.pause();
      }
    }
  }, [bluetoothMode]);

  // THE LOCKED RESUME LOGIC (Keeps your spot saved)
  const handlePlayUnlock = () => {
    if (seekApplied.current || !audioRef.current) return;
    
    const savedTime = localStorage.getItem(`progress_${id}`);
    if (savedTime) {
      const target = parseFloat(savedTime);
      console.log(`🎯 Stream active. Snapping playhead to: ${target}s`);
      audioRef.current.currentTime = target;
      seekApplied.current = true;
    }
  };

  if (!book) return <div className="p-10 text-white text-center">Loading Library...</div>;

  const audioUrl = sessionId ? getProxyUrl(`/public/session/${sessionId}/track/1`) : null;
  const coverUrl = getProxyUrl(`/api/items/${id}/cover`);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-6">
      
      {/* Header with Bluetooth Toggle */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-8">
        <button onClick={() => navigate('/')} className="font-bold px-4 py-2 bg-slate-800 rounded-lg text-gray-200 hover:text-white transition">
          ← Library
        </button>
        <button 
          onClick={() => setBluetoothMode(!bluetoothMode)}
          className={`px-5 py-2 rounded-full font-bold text-sm shadow-md transition-all ${
            bluetoothMode 
              ? 'bg-emerald-600 text-white shadow-emerald-900/50' 
              : 'bg-slate-700 text-gray-300'
          }`}
        >
          {bluetoothMode ? 'Bluetooth Active' : 'Enable Bluetooth'}
        </button>
      </div>

      {/* Hidden Silent Audio Player */}
      <audio ref={silentRef} src={SILENT_AUDIO_SRC} loop />

      <div className="w-full max-w-3xl flex flex-col items-center">
        {/* Cover Art */}
        <div className="aspect-[2/3] w-52 bg-slate-800 rounded-2xl shadow-2xl mb-8 overflow-hidden border border-slate-700">
          <img src={coverUrl} className="w-full h-full object-cover" alt="Book Cover" />
        </div>

        {/* Title & Author */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 px-4">{book.media?.metadata?.title}</h1>
          <p className="text-gray-400 text-lg">{book.media?.metadata?.authorName}</p>
        </div>

        {/* MAIN AUDIO PLAYER */}
        <div className="w-full bg-slate-800 p-8 rounded-3xl shadow-xl mb-8 border border-slate-700">
            <audio 
              ref={audioRef} 
              controls 
              key={sessionId || 'loading'} 
              className="w-full h-12 invert-[.9]"
              // Trigger seek ONLY when the audio is actually moving (The Fix)
              onPlaying={handlePlayUnlock}
              onTimeUpdate={() => {
                if (audioRef.current && seekApplied.current && audioRef.current.currentTime > 1) {
                  localStorage.setItem(`progress_${id}`, audioRef.current.currentTime);
                }
              }}
              preload="auto" 
              playsInline 
            >
              {audioUrl && <source src={audioUrl} type="audio/mp4" />}
            </audio>
        </div>

        {/* Chapter List */}
        <div className="w-full">
          <h3 className="text-lg font-bold mb-4 text-emerald-400 px-2">Chapters</h3>
          <div className="bg-slate-800 rounded-2xl divide-y divide-slate-700 max-h-80 overflow-y-auto border border-slate-700 shadow-inner">
            {book.media?.chapters?.map((c, i) => (
              <button 
                key={i} 
                onClick={() => { 
                  if(audioRef.current) { 
                    audioRef.current.currentTime = c.start; 
                    audioRef.current.play(); 
                    seekApplied.current = true; // Manually seeking counts as "applied"
                  } 
                }} 
                className="w-full p-5 hover:bg-slate-700 flex justify-between text-left transition group"
              >
                <span className="font-medium group-hover:text-emerald-300 transition-colors">{c.title || `Chapter ${i + 1}`}</span>
                <span className="text-gray-500 font-mono text-sm">{new Date(c.start * 1000).toISOString().substr(11, 8)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}