import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBookDetails, getProxyUrl } from '../lib/api';

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sleepTimer, setSleepTimer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    fetchBookDetails(id)
      .then((data) => {
        if (!data || data.error) throw new Error("No data");
        setBook(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Player Load Error:", err);
        setLoading(false);
      });
  }, [id]);

  const cycleSleep = () => {
    const opts = [null, 15, 30, 60, 120];
    setSleepTimer(opts[(opts.indexOf(sleepTimer) + 1) % opts.length]);
  };

  const formatTime = (s) => isNaN(s) ? "0:00:00" : new Date(s * 1000).toISOString().substr(11, 8);

  // PREVENTS BLANK SCREEN CRASH
  if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-cyan-400 font-bold">LOADING BOOK...</div>;
  if (!book || !book.media) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">Book details unavailable.</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center p-6">
      <div className="w-full max-w-md flex justify-between mb-10">
        <button onClick={() => navigate('/')} className="bg-slate-800/50 p-3 rounded-xl">←</button>
        <div className="text-cyan-400 font-black italic">PLAYING</div>
      </div>
      
      <div className="aspect-[2/3] w-64 bg-slate-800 rounded-3xl shadow-2xl mb-8 overflow-hidden border border-white/5">
        <img src={getProxyUrl(`/api/items/${id}/cover`)} className="w-full h-full object-cover" />
      </div>

      <div className="w-full max-w-md bg-slate-800/40 backdrop-blur-md p-8 rounded-[40px] border border-white/5 shadow-xl text-center">
        <h2 className="text-lg font-bold truncate mb-1">{book.media.metadata.title}</h2>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-8">{book.media.metadata.authorName}</p>

        <div className="flex justify-between items-center mb-8">
          <button onClick={() => audioRef.current.currentTime -= 15} className="w-16 h-16 rounded-full border-2 border-cyan-400/30 text-cyan-400 flex items-center justify-center">↺</button>
          
          <button onClick={cycleSleep} className="flex flex-col items-center">
            <div className={`w-12 h-12 flex items-center justify-center rounded-full ${sleepTimer ? 'bg-orange-500 shadow-lg' : 'bg-slate-700/50'}`}>⏲</div>
            <span className="text-[9px] font-bold mt-2 text-slate-400">{sleepTimer ? `${sleepTimer}m` : 'SLEEP'}</span>
          </button>

          <button onClick={() => audioRef.current.currentTime += 30} className="w-16 h-16 rounded-full border-2 border-cyan-400/30 text-cyan-400 flex items-center justify-center">↻</button>
        </div>

        <div className="flex justify-between px-2 mb-2 text-[12px] font-mono text-slate-500">
          <span>{formatTime(currentTime)}</span>
          <span>-{formatTime((audioRef.current?.duration || 0) - currentTime)}</span>
        </div>
        
        <audio 
          ref={audioRef} controls preload="auto" 
          className="w-full h-10 invert-[.9] opacity-80"
          onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
          src={getProxyUrl(`/api/items/${id}/file`)} 
        />
      </div>
    </div>
  );
}