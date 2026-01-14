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
  const [sleepTimer, setSleepTimer] = useState(null); // ENHANCEMENT 1: Sleep Timer
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
            deviceId: 'car-player-pi-pro', 
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

  // ENHANCEMENT 1: Sleep Timer Logic
  useEffect(() => {
    if (sleepTimer) {
      const timer = setTimeout(() => {
        if (audioRef.current) audioRef.current.pause();
        setSleepTimer(null);
        alert("Sleep timer finished.");
      }, sleepTimer * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [sleepTimer]);

  useEffect(() => {
    if (silentRef.current) {
      bluetoothMode ? silentRef.current.play().catch(() => {}) : silentRef.current.pause();
    }
  }, [bluetoothMode]);

  // ENHANCEMENT 2: Contextual Rewind on Resume
  const handlePlayUnlock = () => {
    if (seekApplied.current || !audioRef.current) return;
    
    const savedTime = localStorage.getItem(`progress_${id}`);
    if (savedTime) {
      const target = parseFloat(savedTime);
      // Automatically rewind 10 seconds to provide context
      const rewindTime = Math.max(0, target - 10); 
      console.log(`🎯 Contextual Resume: Snapping to ${rewindTime}s (10s rewind applied)`);
      audioRef.current.currentTime = rewindTime;
      seekApplied.current = true;
    }
  };

  if (!book) return <div className="p-10 text-white text-center">Finalizing Pro Build...</div>;

  const audioUrl = sessionId ? getProxyUrl(`/public/session/${sessionId}/track/1`) : null;
  const coverUrl = getProxyUrl(`/api/items/${id}/cover`);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-6">
      
      <div className="w-full max-w-3xl flex justify-between items-center mb-8">
        <button onClick={() => navigate('/')} className="font-bold px-4 py-2 bg-slate-800 rounded-lg">← Library</button>
        <div className="flex gap-2">
            {/* Sleep Timer Button */}
            <button 
                onClick={() => setSleepTimer(sleepTimer ? null : 30)}
                className={`px-4 py-2 rounded-lg font-bold text-xs ${sleepTimer ? 'bg-orange-600' : 'bg-slate-800'}`}
            >
                {sleepTimer ? `${sleepTimer}m Left` : '⏲ Sleep Timer'}
            </button>
            <button 
                onClick={() => setBluetoothMode(!bluetoothMode)}
                className={`px-4 py-2 rounded-full font-bold text-xs ${bluetoothMode ? 'bg-emerald-600' : 'bg-slate-700'}`}
            >
                {bluetoothMode ? 'Bluetooth ON' : 'Bluetooth OFF'}
            </button>
        </div>
      </div>

      <audio ref={silentRef} src={SILENT_AUDIO_SRC} loop />

      <div className="w-full max-w-3xl flex flex-col items-center">
        <div className="aspect-[2/3] w-52 bg-slate-800 rounded-2xl shadow-2xl mb-8 overflow-hidden border border-slate-700">
          <img src={coverUrl} className="w-full h-full object-cover" />
        </div>

        {/* ENHANCEMENT 3: Large Progress Controls */}
        <div className="w-full bg-slate-800 p-8 rounded-3xl shadow-xl mb-8 border border-slate-700">
            <div className="flex justify-between mb-4 px-2">
                <button onClick={() => {if(audioRef.current) audioRef.current.currentTime -= 15}} className="text-2xl p-4 bg-slate-700 rounded-full w-16 h-16">↺</button>
                <button onClick={() => {if(audioRef.current) audioRef.current.currentTime += 30}} className="text-2xl p-4 bg-slate-700 rounded-full w-16 h-16">↻</button>
            </div>
            
            <audio 
              ref={audioRef} 
              controls 
              key={sessionId || 'loading'} 
              className="w-full h-14 invert-[.9]" // Slightly larger for car use
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

        <div className="w-full">
          <div className="bg-slate-800 rounded-2xl divide-y divide-slate-700 max-h-80 overflow-y-auto border border-slate-700">
            {book.media?.chapters?.map((c, i) => (
              <button 
                key={i} 
                onClick={() => { if(audioRef.current) { audioRef.current.currentTime = c.start; audioRef.current.play(); seekApplied.current = true; } }} 
                className="w-full p-5 hover:bg-slate-700 flex justify-between text-left"
              >
                <span className="font-medium">{c.title || `Chapter ${i + 1}`}</span>
                <span className="text-gray-500 font-mono text-xs">{new Date(c.start * 1000).toISOString().substr(11, 8)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}