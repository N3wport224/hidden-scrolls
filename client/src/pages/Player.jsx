import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBookDetails, getProxyUrl } from '../lib/api';

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchBookDetails(id).then(data => {
      setBook(data);
      // Restore last saved position
      const savedTime = localStorage.getItem(`progress_${id}`);
      if (savedTime && audioRef.current) {
        audioRef.current.currentTime = parseFloat(savedTime);
      }
    });
  }, [id]);

  const formatTime = (s) => isNaN(s) ? "0:00:00" : new Date(s * 1000).toISOString().substr(11, 8);

  if (!book) return <div className="min-h-screen bg-[#0f172a] text-cyan-400 flex items-center justify-center font-bold italic">LOADING HIDDEN SCROLL...</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center p-6 text-center">
      <button onClick={() => navigate('/')} className="self-start bg-slate-800/50 p-3 rounded-xl mb-10">←</button>

      <div className="aspect-[2/3] w-64 bg-slate-800 rounded-3xl shadow-2xl mb-8 overflow-hidden border border-white/5 mx-auto">
        <img src={getProxyUrl(`/api/items/${id}/cover`)} className="w-full h-full object-cover" alt="Cover" />
      </div>

      <div className="w-full max-w-md bg-slate-800/40 backdrop-blur-md p-8 rounded-[40px] border border-white/5 shadow-xl">
        <h2 className="text-lg font-bold truncate mb-1 uppercase tracking-tight">{book.media?.metadata?.title}</h2>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-8 italic">{book.media?.metadata?.authorName}</p>

        {/* CAR-MODE CONTROLS: Large targets for driving */}
        <div className="flex justify-between items-center mb-8 px-4">
          <button onClick={() => audioRef.current.currentTime -= 15} className="w-16 h-16 rounded-full border-2 border-cyan-400/30 text-cyan-400 flex items-center justify-center text-xl active:bg-cyan-400/20">↺</button>
          <div className="flex flex-col items-center">
             <div className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-700/50 text-xl">⏲</div>
             <span className="text-[9px] font-bold mt-2 text-slate-400 uppercase">Sleep</span>
          </div>
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
          onLoadedMetadata={(e) => setDuration(e.target.duration)}
          onTimeUpdate={(e) => {
            setCurrentTime(e.target.currentTime);
            // Save current progress locally
            localStorage.setItem(`progress_${id}`, e.target.currentTime);
          }}
          src={getProxyUrl(`/api/items/${id}/file`)} 
        />

        {book.media?.chapters?.length > 0 && (
          <select 
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-xs text-cyan-400 text-center appearance-none"
            onChange={(e) => audioRef.current.currentTime = parseFloat(e.target.value)}
          >
            <option>SELECT CHAPTER ({book.media.chapters.length})</option>
            {book.media.chapters.map((chap, i) => (
              <option key={i} value={chap.start}>{chap.title} ({formatTime(chap.start)})</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}