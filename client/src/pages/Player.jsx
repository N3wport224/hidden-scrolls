import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBookDetails, getProxyUrl, testABSConnection } from '../lib/api';

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [debug, setDebug] = useState({ status: 'Checking...', log: [] });
  const audioRef = useRef(null);

  useEffect(() => {
    fetchBookDetails(id).then(setBook);
    // Run connectivity test on load
    testABSConnection().then(res => setDebug(prev => ({ ...prev, status: res.msg })));
  }, [id]);

  const formatTime = (s) => isNaN(s) ? "0:00:00" : new Date(s * 1000).toISOString().substr(11, 8);

  if (!book) return <div className="min-h-screen bg-[#0f172a] text-cyan-400 flex items-center justify-center font-bold">BOOTING DEBUGGER...</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center p-6">
      <button onClick={() => navigate('/')} className="self-start bg-slate-800/50 p-3 rounded-xl mb-10">←</button>

      <div className="aspect-[2/3] w-64 bg-slate-800 rounded-3xl shadow-2xl mb-8 overflow-hidden border border-white/5">
        <img src={getProxyUrl(`/api/items/${id}/cover`)} className="w-full h-full object-cover" />
      </div>

      <div className="w-full max-w-md bg-slate-800/40 backdrop-blur-md p-8 rounded-[40px] border border-white/5 shadow-xl mb-10">
        <h2 className="text-lg font-bold truncate text-center mb-8 uppercase tracking-tight">{book.media?.metadata?.title}</h2>
        
        <audio 
          ref={audioRef} controls className="w-full h-10 invert-[.9] opacity-80 mb-6"
          onLoadedMetadata={(e) => setDuration(e.target.duration)}
          onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
          src={getProxyUrl(`/api/items/${id}/file`)} 
          onError={(e) => setDebug(prev => ({ ...prev, status: 'STREAM FAILED', log: [...prev.log, 'Audio element reported error'] }))}
        />

        {book.media?.chapters?.length > 0 && (
          <select 
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-xs text-cyan-400 text-center"
            onChange={(e) => audioRef.current.currentTime = parseFloat(e.target.value)}
          >
            <option>CHAPTERS ({book.media.chapters.length})</option>
            {book.media.chapters.map((chap, i) => (
              <option key={i} value={chap.start}>{chap.title} ({formatTime(chap.start)})</option>
            ))}
          </select>
        )}
      </div>

      {/* VISUAL DEBUGGER PANEL */}
      <div className="w-full max-w-md bg-black/80 rounded-2xl p-4 border border-cyan-500/30 font-mono text-[10px]">
        <h3 className="text-cyan-400 font-bold mb-2 uppercase flex justify-between">
          <span>Diagnostic Engine</span>
          <span className={debug.status === 'Connected' ? 'text-emerald-400' : 'text-rose-500'}>{debug.status}</span>
        </h3>
        <div className="text-slate-400 space-y-1">
          <p>Stream URL: <span className="text-slate-500 break-all">{getProxyUrl(`/api/items/${id}/file`)}</span></p>
          <p>Book ID: {id}</p>
          <p>Progress: {Math.round(currentTime)}s / {Math.round(duration)}s</p>
          {debug.log.map((entry, i) => (
            <p key={i} className="text-rose-400 italic">!! {entry}</p>
          ))}
        </div>
      </div>
    </div>
  );
}