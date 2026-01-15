import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBookDetails, getProxyUrl } from '../lib/api';

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [debugLog, setDebugLog] = useState([]); // Keeps track of errors
  const audioRef = useRef(null);

  useEffect(() => {
    fetchBookDetails(id).then(setBook).catch(err => setDebugLog(p => [...p, "Metadata Load Error"]));
  }, [id]);

  const formatTime = (s) => isNaN(s) ? "0:00:00" : new Date(s * 1000).toISOString().substr(11, 8);

  if (!book) return <div className="min-h-screen bg-[#0f172a] text-cyan-400 flex items-center justify-center font-bold">LOADING...</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center p-6 text-center">
      <button onClick={() => navigate('/')} className="self-start bg-slate-800/50 p-3 rounded-xl mb-10">←</button>

      {/* COVER ART */}
      <div className="aspect-[2/3] w-64 bg-slate-800 rounded-3xl shadow-2xl mb-8 overflow-hidden border border-white/5 mx-auto">
        <img src={getProxyUrl(`/api/items/${id}/cover`)} className="w-full h-full object-cover" />
      </div>

      {/* PLAYER CONTROLS */}
      <div className="w-full max-w-md bg-slate-800/40 backdrop-blur-md p-8 rounded-[40px] border border-white/5 shadow-xl">
        <h2 className="text-lg font-bold truncate mb-1 uppercase tracking-tight">{book.media?.metadata?.title}</h2>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-8 italic">{book.media?.metadata?.authorName}</p>

        <div className="flex justify-between px-2 mb-2 text-[12px] font-mono text-slate-500">
          <span>{formatTime(currentTime)}</span>
          <span>-{formatTime(duration - currentTime)}</span>
        </div>
        
        <audio 
          ref={audioRef} 
          controls 
          className="w-full h-10 invert-[.9] opacity-80 mb-6"
          onLoadedMetadata={(e) => setDuration(e.target.duration)}
          onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
          src={getProxyUrl(`/api/items/${id}/file`)} 
          onError={(e) => setDebugLog(p => [...p, `Audio Error: ${e.target.error?.code || 'Unknown'}`])}
        />

        {/* CHAPTERS DROPDOWN */}
        {book.media?.chapters?.length > 0 && (
          <select 
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-xs text-cyan-400 text-center"
            onChange={(e) => audioRef.current.currentTime = parseFloat(e.target.value)}
          >
            <option>SELECT CHAPTER ({book.media.chapters.length})</option>
            {book.media.chapters.map((chap, i) => (
              <option key={i} value={chap.start}>{chap.title} ({formatTime(chap.start)})</option>
            ))}
          </select>
        )}
      </div>

      {/* DEBUG PANEL - Remove this after it's working */}
      <div className="w-full max-w-md mt-6 bg-black/80 p-4 rounded-xl border border-cyan-500/20 text-[10px] font-mono text-left">
        <p className="text-cyan-400 mb-1 font-bold">ENGINE LOG:</p>
        {debugLog.length === 0 ? <p className="text-emerald-500">System Nominal</p> : null}
        {debugLog.map((log, i) => <p key={i} className="text-rose-400">!! {log}</p>)}
      </div>
    </div>
  );
}