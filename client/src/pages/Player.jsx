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
  const seekApplied = useRef(false);

  useEffect(() => {
    fetchBookDetails(id).then(setBook);
    const initSession = async () => {
      try {
        const res = await fetch(getProxyUrl(`/api/items/${id}/play`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'omit', 
          body: JSON.stringify({ 
            deviceId: 'car-player-pi-final-v10', 
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

  useEffect(() => {
    if (silentRef.current) {
      bluetoothMode ? silentRef.current.play().catch(() => {}) : silentRef.current.pause();
    }
  }, [bluetoothMode]);

  // THE HARD-LOCK SEEK FUNCTION
  const forceResume = () => {
    if (seekApplied.current || !audioRef.current) return;
    
    const savedTime = localStorage.getItem(`progress_${id}`);
    if (savedTime && audioRef.current.duration > 0) {
      const target = parseFloat(savedTime);
      console.log(`🎯 Hard-locking seek to: ${target}s`);
      audioRef.current.currentTime = target;
      
      // Check if it actually stuck
      if (Math.abs(audioRef.current.currentTime - target) < 1) {
        seekApplied.current = true;
      }
    }
  };

  if (!book) return <div className="p-10 text-white text-center">Syncing...</div>;

  const audioUrl = sessionId ? getProxyUrl(`/public/session/${sessionId}/track/1`) : null;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-6">
      <div className="w-full max-w-3xl flex justify-between items-center mb-8">
        <button onClick={() => navigate('/')} className="font-bold px-4 py-2 bg-slate-800 rounded-lg">← Library</button>
        <button 
          onClick={() => setBluetoothMode(!bluetoothMode)}
          className={`px-6 py-2 rounded-full font-bold text-sm ${bluetoothMode ? 'bg-emerald-600' : 'bg-slate-700'}`}
        >
          {bluetoothMode ? 'Bluetooth Active' : 'Enable Bluetooth'}
        </button>
      </div>

      <audio ref={silentRef} src={SILENT_AUDIO_SRC} loop />

      <div className="w-full max-w-3xl flex flex-col items-center">
        <div className="aspect-[2/3] w-52 bg-slate-800 rounded-2xl shadow-2xl mb-8 overflow-hidden border border-slate-700">
          <img src={getProxyUrl(`/api/items/${id}/cover`)} className="w-full h-full object-cover" />
        </div>

        <div className="w-full bg-slate-800 p-8 rounded-3xl shadow-xl mb-8 border border-slate-700">
            <audio 
              ref={audioRef} 
              controls 
              key={sessionId || 'loading'} 
              className="w-full h-12 invert-[.9]"
              onLoadedMetadata={forceResume}
              onPlay={forceResume} // Force seek again when user hits play
              onTimeUpdate={() => {
                if (!audioRef.current) return;
                
                // If we haven't successfully sought yet, keep trying while playing
                if (!seekApplied.current) {
                  forceResume();
                } else if (audioRef.current.currentTime > 1) {
                  // Only save progress once we are past the initial seek lock
                  localStorage.setItem(`progress_${id}`, audioRef.current.currentTime);
                }
              }}
              preload="auto" 
              playsInline 
            >
              {audioUrl && <source src={audioUrl} type="audio/mp4" />}
            </audio>
        </div>

        <div className="w-full">
          <div className="bg-slate-800 rounded-2xl divide-y divide-slate-700 max-h-80 overflow-y-auto border border-slate-700">
            {book.media?.chapters?.map((c, i) => (
              <button 
                key={i} 
                onClick={() => { if(audioRef.current) { audioRef.current.currentTime = c.start; audioRef.current.play(); seekApplied.current = true; } }} 
                className="w-full p-5 hover:bg-slate-700 flex justify-between text-left"
              >
                <span>{c.title || `Chapter ${i + 1}`}</span>
                <span className="text-gray-500 font-mono text-sm">{new Date(c.start * 1000).toISOString().substr(11, 8)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}