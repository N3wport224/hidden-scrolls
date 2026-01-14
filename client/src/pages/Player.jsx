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
  const [sleepTimer, setSleepTimer] = useState(null);
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
          body: JSON.stringify({ deviceId: 'car-player-pro-v2', supportedMimeTypes: ['audio/mpeg', 'audio/mp4'], forceDirectPlay: true })
        });
        const data = await res.json();
        if (data.id) setSessionId(data.id); 
      } catch (err) { console.error("❌ Session failed:", err); }
    };
    initSession();
  }, [id]);

  useEffect(() => {
    if (sleepTimer) {
      const timer = setTimeout(() => {
        if (audioRef.current) audioRef.current.pause();
        setSleepTimer(null);
      }, sleepTimer * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [sleepTimer]);

  useEffect(() => {
    if (silentRef.current) {
      bluetoothMode ? silentRef.current.play().catch(() => {}) : silentRef.current.pause();
    }
  }, [bluetoothMode]);

  const handlePlayUnlock = () => {
    if (seekApplied.current || !audioRef.current) return;
    const savedTime = localStorage.getItem(`progress_${id}`);
    if (savedTime) {
      const target = parseFloat(savedTime);
      const rewindTime = Math.max(0, target - 10); 
      audioRef.current.currentTime = rewindTime;
      seekApplied.current = true;
    }
  };

  if (!book) return <div className="p-10 text-white text-center">Loading...</div>;

  const audioUrl = sessionId ? getProxyUrl(`/public/session/${sessionId}/track/1`) : null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center p-6 font-sans">
      
      {/* Top Header - Clean & Minimal */}
      <div className="w-full max-w-md flex justify-between items-center mb-10">
        <button onClick={() => navigate('/')} className="flex flex-col items-center gap-1 group">
          <div className="bg-slate-800/50 p-3 rounded-xl group-active:scale-95 transition-transform">
            <span className="text-xl">←</span>
          </div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Library</span>
        </button>

        <button 
          onClick={() => setBluetoothMode(!bluetoothMode)}
          className={`flex flex-col items-center gap-1 group`}
        >
          <div className={`p-3 rounded-xl transition-all ${bluetoothMode ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-slate-800/50 text-slate-400'}`}>
            <span className="text-sm font-bold">{bluetoothMode ? 'ON' : 'OFF'}</span>
          </div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Bluetooth</span>
        </button>
      </div>

      <audio ref={silentRef} src={SILENT_AUDIO_SRC} loop />

      {/* Main Cover Area */}
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="aspect-[2/3] w-64 bg-slate-800 rounded-3xl shadow-2xl mb-8 overflow-hidden border border-slate-700/50">
          <img src={getProxyUrl(`/api/items/${id}/cover`)} className="w-full h-full object-cover" />
        </div>

        {/* Control Card */}
        <div className="w-full bg-slate-800/40 backdrop-blur-md p-8 rounded-[40px] shadow-xl mb-8 border border-white/5">
            
            {/* Playback Controls with Integrated Sleep Timer */}
            <div className="flex justify-between items-center mb-10">
                {/* Rewind 15s */}
                <button 
                  onClick={() => {if(audioRef.current) audioRef.current.currentTime -= 15}} 
                  className="w-16 h-16 rounded-full border-2 border-cyan-400/30 flex items-center justify-center active:bg-cyan-400/10 transition-colors shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                >
                  <span className="text-2xl text-cyan-400">↺</span>
                </button>

                {/* Sleep Timer (Center Focus) */}
                <button 
                    onClick={() => setSleepTimer(sleepTimer ? null : 30)}
                    className="flex flex-col items-center gap-1"
                >
                    <div className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${sleepTimer ? 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]' : 'bg-slate-700/50'}`}>
                        <span className="text-lg">⏲</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {sleepTimer ? `${sleepTimer}m` : 'Sleep'}
                    </span>
                </button>

                {/* Forward 30s */}
                <button 
                  onClick={() => {if(audioRef.current) audioRef.current.currentTime += 30}} 
                  className="w-16 h-16 rounded-full border-2 border-cyan-400/30 flex items-center justify-center active:bg-cyan-400/10 transition-colors shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                >
                  <span className="text-2xl text-cyan-400">↻</span>
                </button>
            </div>
            
            <audio 
              ref={audioRef} 
              controls 
              key={sessionId || 'loading'} 
              className="w-full h-10 invert-[.9] opacity-80"
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

        {/* Chapters Section */}
        <div className="w-full max-w-md">
          <div className="bg-slate-800/30 rounded-[30px] divide-y divide-white/5 max-h-60 overflow-y-auto border border-white/5">
            {book.media?.chapters?.map((c, i) => (
              <button 
                key={i} 
                onClick={() => { if(audioRef.current) { audioRef.current.currentTime = c.start; audioRef.current.play(); seekApplied.current = true; } }} 
                className="w-full p-5 hover:bg-white/5 flex justify-between items-center text-left"
              >
                <span className="text-sm font-medium text-slate-300 truncate pr-4">{c.title || `Chapter ${i + 1}`}</span>
                <span className="text-slate-500 font-mono text-[10px] shrink-0">{new Date(c.start * 1000).toISOString().substr(11, 8)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}