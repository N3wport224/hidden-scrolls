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
  const seekProcessed = useRef(false);

  useEffect(() => {
    fetchBookDetails(id).then(setBook);
    const initSession = async () => {
      try {
        const res = await fetch(getProxyUrl(`/api/items/${id}/play`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'omit',
          body: JSON.stringify({ 
            deviceId: 'car-player-pi-final-v7', 
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

  // Bluetooth Keep-Alive
  useEffect(() => {
    if (silentRef.current) {
      bluetoothMode ? silentRef.current.play().catch(() => {}) : silentRef.current.pause();
    }
  }, [bluetoothMode]);

  // THE AGGRESSIVE RESUME LOOP
  useEffect(() => {
    if (!sessionId) return;

    const forceSeekInterval = setInterval(() => {
      const audio = audioRef.current;
      const savedTime = localStorage.getItem(`progress_${id}`);
      
      if (audio && savedTime && !seekProcessed.current) {
        const target = parseFloat(savedTime);
        
        // Wait until browser has enough data to know the duration
        if (audio.duration > 0 && audio.readyState >= 1) {
          console.log(`🚀 Force-seeking to ${target}s...`);
          audio.currentTime = target;
          
          // If the jump worked, stop the loop
          if (Math.abs(audio.currentTime - target) < 1) {
            seekProcessed.current = true;
            clearInterval(forceSeekInterval);
          }
        }
      } else if (seekProcessed.current) {
        clearInterval(forceSeekInterval);
      }
    }, 500); // Check every half-second

    return () => clearInterval(forceSeekInterval);
  }, [sessionId, id]);

  if (!book) return <div className="p-10 text-white text-center font-bold">Locking Session...</div>;

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
              onTimeUpdate={() => {
                // Only save progress AFTER the initial seek has finished
                if (audioRef.current && seekProcessed.current && audioRef.current.currentTime > 1) {
                  localStorage.setItem(`progress_${id}`, audioRef.current.currentTime);
                }
              }}
              preload="auto" 
              playsInline 
            >
              {audioUrl && <source src={audioUrl} type="audio/mp4" />}
            </audio>
        </div>

        <div className="w-full max-w-3xl">
          <h3 className="text-lg font-bold mb-4 text-emerald-400 px-2">Chapters</h3>
          <div className="bg-slate-800 rounded-2xl divide-y divide-slate-700 max-h-80 overflow-y-auto border border-slate-700">
            {book.media?.chapters?.map((c, i) => (
              <button 
                key={i} 
                onClick={() => { if(audioRef.current) { audioRef.current.currentTime = c.start; audioRef.current.play(); } }} 
                className="w-full p-5 hover:bg-slate-700 flex justify-between text-left transition"
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