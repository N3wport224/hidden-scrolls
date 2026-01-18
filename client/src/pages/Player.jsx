import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBookDetails, getProxyUrl } from '../lib/api';

// Silent audio track to keep car Bluetooth active during pauses
const SILENT_AUDIO_SRC = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////wAAAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////wAAAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [bluetoothMode, setBluetoothMode] = useState(false);
  const [sleepTimer, setSleepTimer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const silentRef = useRef(null);
  const isInitialLoad = useRef(true);

  // 1. Fetch Book Details
  useEffect(() => {
    fetchBookDetails(id).then(data => {
      setBook(data);
    });
  }, [id]);

  // 2. Bluetooth Active Mode
  useEffect(() => {
    if (silentRef.current) {
      bluetoothMode ? silentRef.current.play().catch(() => {}) : silentRef.current.pause();
    }
  }, [bluetoothMode]);

  // 3. Resume Seek Logic: Only seeks when the stream is ready
  const handleCanPlay = () => {
    if (isInitialLoad.current) {
      const savedTime = localStorage.getItem(`progress_${id}`);
      if (savedTime && audioRef.current) {
        audioRef.current.currentTime = parseFloat(savedTime);
        console.log(`[RESUME] Jumped to: ${savedTime}s`);
      }
      isInitialLoad.current = false;
    }
  };

  // 4. Sleep Timer Cycle (Included 120m option)
  const cycleSleep = () => {
    const opts = [null, 15, 30, 60, 90, 120]; 
    const next = opts[(opts.indexOf(sleepTimer) + 1) % opts.length];
    setSleepTimer(next);
    if (next) {
      setTimeout(() => {
        if (audioRef.current) audioRef.current.pause();
        setSleepTimer(null);
      }, next * 60000);
    }
  };

  const formatTime = (s) => isNaN(s) ? "0:00:00" : new Date(s * 1000).toISOString().substr(11, 8);

  if (!book) return <div className="min-h-screen bg-[#0f172a] text-cyan-400 flex items-center justify-center font-bold italic">RESTORING SCROLL...</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center p-6 text-center">
      <div className="w-full max-w-md flex justify-between mb-10">
        <button onClick={() => navigate('/')} className="bg-slate-800/50 p-3 rounded-xl active:scale-95 transition-transform">←</button>
        <button 
          onClick={() => setBluetoothMode(!bluetoothMode)} 
          className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${bluetoothMode ? 'bg-emerald-500 text-white' : 'bg-slate-800/50 text-slate-400'}`}
        >
          BT SILENCE: {bluetoothMode ? 'ON' : 'OFF'}
        </button>
      </div>

      <audio ref={silentRef} src={SILENT_AUDIO_SRC} loop />

      <div className="aspect-[2/3] w-64 bg-slate-800 rounded-3xl shadow-2xl mb-8 overflow-hidden border border-white/5 mx-auto">
        <img src={getProxyUrl(`/api/items/${id}/cover`)} className="w-full h-full object-cover" alt="Cover" />
      </div>

      <div className="w-full max-w-md bg-slate-800/40 backdrop-blur-md p-8 rounded-[40px] border border-white/5 shadow-xl">
        <h2 className="text-lg font-bold truncate mb-1 uppercase tracking-tight">{book.media?.metadata?.title}</h2>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-8 italic">{book.media?.metadata?.authorName}</p>

        <div className="flex justify-between items-center mb-8 px-4">
          <button onClick={() => audioRef.current.currentTime -= 15} className="w-16 h-16 rounded-full border-2 border-cyan-400/30 text-cyan-400 flex items-center justify-center text-xl active:bg-cyan-400/20">↺</button>
          <button onClick={cycleSleep} className="flex flex-col items-center">
            <div className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${sleepTimer ? 'bg-orange-500' : 'bg-slate-700/50'}`}>⏲</div>
            <span className="text-[9px] font-bold mt-2 text-slate-400 uppercase tracking-tighter">{sleepTimer ? `${sleepTimer}m` : 'Sleep'}</span>
          </button>
          <button onClick={() => audioRef.current.currentTime += 30} className="w-16 h-16 rounded-full border-2 border-cyan-400/30 text-cyan-400 flex items-center justify-center text-xl active:bg-cyan-400/20">↻</button>
        </div>

        <div className="flex justify-between px-2 mb-2 text-[12px] font-mono text-slate-500">
          <span>{formatTime(currentTime)}</span>
          <span>-{formatTime(duration - currentTime)}</span>
        </div>

        <audio 
          ref={audioRef} 
          controls 
          className="w-full h-10 invert-[.9] opacity-80 mb-6"
          onCanPlay={handleCanPlay} 
          onLoadedMetadata={(e) => setDuration(e.target.duration)}
          onTimeUpdate={(e) => {
            setCurrentTime(e.target.currentTime);
            localStorage.setItem(`progress_${id}`, e.target.currentTime);
          }}
          src={getProxyUrl(`/api/items/${id}/play`)} 
        />

        {/* Dynamic Chapter Dropdown: Shows current chapter name or Chapter 1 */}
        {book.media?.chapters?.length > 0 && (
          <div className="relative">
            <select 
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-xs text-cyan-400 text-center appearance-none"
              value={book.media.chapters.find(c => currentTime >= c.start && currentTime < c.end)?.start || book.media.chapters[0].start}
              onChange={(e) => {
                audioRef.current.currentTime = parseFloat(e.target.value);
              }}
            >
              {book.media.chapters.map((chap, i) => (
                <option key={i} value={chap.start}>
                  {chap.title} ({formatTime(chap.start)})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-cyan-400/50 text-[8px]">
              ▼
            </div>
          </div>
        )}
      </div>
    </div>
  );
}