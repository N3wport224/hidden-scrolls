import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBookDetails, getProxyUrl } from '../lib/api';

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [sleepTimer, setSleepTimer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchBookDetails(id).then(setBook).catch(() => navigate('/'));
  }, [id]);

  const cycleSleep = () => {
    const opts = [null, 15, 30, 60, 120];
    setSleepTimer(opts[(opts.indexOf(sleepTimer) + 1) % opts.length]);
  };

  if (!book) return <div className="p-20 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 flex flex-col items-center">
      <button onClick={() => navigate('/')} className="self-start mb-10 bg-slate-800 p-3 rounded-xl">←</button>
      
      <img src={getProxyUrl(`/api/items/${id}/cover`)} className="w-64 rounded-3xl shadow-2xl mb-10" />

      <div className="w-full max-w-md bg-slate-800/50 p-8 rounded-[40px] border border-white/5">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => audioRef.current.currentTime -= 15} className="w-16 h-16 rounded-full border-2 border-cyan-400 text-cyan-400">↺</button>
          <button onClick={cycleSleep} className="flex flex-col items-center">
            <div className={`w-12 h-12 flex items-center justify-center rounded-full ${sleepTimer ? 'bg-orange-500' : 'bg-slate-700'}`}>⏲</div>
            <span className="text-[10px] mt-1">{sleepTimer ? `${sleepTimer}m` : 'SLEEP'}</span>
          </button>
          <button onClick={() => audioRef.current.currentTime += 30} className="w-16 h-16 rounded-full border-2 border-cyan-400 text-cyan-400">↻</button>
        </div>

        <audio 
          ref={audioRef} controls preload="auto" className="w-full invert opacity-80"
          onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
        >
          <source src={getProxyUrl(`/api/items/${id}/file`)} type="audio/mpeg" />
        </audio>
      </div>
    </div>
  );
}