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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
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
          body: JSON.stringify({ deviceId: 'car-player-vfinal', supportedMimeTypes: ['audio/mpeg', 'audio/mp4'], forceDirectPlay: true })
        });
        const data = await res.json();
        if (data.id) setSessionId(data.id); 
      } catch (err) { console.error("❌ Session Error:", err); }
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

  const cycleSleep = () => {
    const opts = [null, 15, 30, 60, 120];
    setSleepTimer(opts[(opts.indexOf(sleepTimer) + 1) % opts.length]);
  };

  const formatTime = (s) => isNaN(s) ? "0:00:00" : new Date(s * 1000).toISOString().substr(11, 8);

  const handlePlay = () => {
    if (seekApplied.current || !audioRef.current) return;
    const saved = localStorage.getItem(`progress_${id}`);
    if (saved) {
      audioRef.current.currentTime = Math.max(0, parseFloat(saved) - 10);
      seekApplied.current = true;
    }
  };

  if (!book) return <div className="p-10 text-white text-center">Loading Hidden Scrolls...</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center p-6">
      <div className="w-full max-w-md flex justify-between mb-10">
        <button onClick={() => navigate('/')} className="bg-slate-800/50 p-3 rounded-xl">←</button>
        <button onClick={() => setBluetoothMode(!bluetoothMode)} className={`p-3 rounded-xl ${bluetoothMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800/50'}`}>BT {bluetoothMode ? 'ON' : 'OFF'}</button>
      </div>

      <audio ref={silentRef} src={SILENT_AUDIO_SRC} loop />

      <div className="aspect-[2/3] w-64 bg-slate-800 rounded-3xl shadow-2xl mb-8 overflow-hidden border border-slate-700/50">
        <img src={getProxyUrl(`/api/items/${id}/cover`)} className="w-full h-full object-cover" />
      </div>

      <div className="w-full max-w-md bg-slate-800/40 backdrop-blur-md p-8 rounded-[40px] border border-white/5">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => audioRef.current.currentTime -= 15} className="w-16 h-16 rounded-full border-2 border-cyan-400/30 text-cyan-400">↺</button>
          <button onClick={cycleSleep} className="flex flex-col items-center">
            <div className={`w-12 h-12 flex items-center justify-center rounded-full ${sleepTimer ? 'bg-orange-500' : 'bg-slate-700/50'}`}>⏲</div>
            <span className="text-[10px] font-bold mt-1">{sleepTimer ? (sleepTimer >= 60 ? `${sleepTimer/60}h` : `${sleepTimer}m`) : 'SLEEP'}</span>
          </button>
          <button onClick={() => audioRef.current.currentTime += 30} className="w-16 h-16 rounded-full border-2 border-cyan-400/30 text-cyan-400">↻</button>
        </div>

        <div className="flex justify-between px-2 mb-2 text-[12px] font-mono text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <span>-{formatTime(duration - currentTime)}</span>
        </div>
        
        <audio 
          ref={audioRef} controls key={sessionId || 'loading'} 
          className="w-full h-10 invert-[.9]" 
          onPlaying={handlePlay}
          onLoadedMetadata={(e) => setDuration(e.target.duration)}
          onTimeUpdate={(e) => {
            setCurrentTime(e.target.currentTime);
            if (seekApplied.current && e.target.currentTime > 1) {
              localStorage.setItem(`progress_${id}`, e.target.currentTime);
            }
          }}
        >
          {sessionId && <source src={getProxyUrl(`/public/session/${sessionId}/track/1`)} type="audio/mp4" />}
        </audio>
      </div>
    </div>
  );
}