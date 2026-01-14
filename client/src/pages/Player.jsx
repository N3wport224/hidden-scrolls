import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBookDetails, getProxyUrl } from '../lib/api';

const SILENT_AUDIO_SRC = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////wAAAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////wAAAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [sessionId, setSessionId] = useState(null); 
  const [carMode, setCarMode] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const audioRef = useRef(null);
  const silentRef = useRef(null); 
  const wakeLockRef = useRef(null);
  const seekApplied = useRef(false);
  const lastSync = useRef(0); // Track last sync time to avoid spamming server

  useEffect(() => {
    fetchBookDetails(id).then(setBook);
    const initSession = async () => {
      try {
        const res = await fetch(getProxyUrl(`/api/items/${id}/play`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'omit', 
          body: JSON.stringify({ deviceId: 'car-player-ultimate', supportedMimeTypes: ['audio/mpeg', 'audio/mp4'], forceDirectPlay: true })
        });
        const data = await res.json();
        if (data.id) setSessionId(data.id); 
      } catch (err) { console.error("Session failed:", err); }
    };
    initSession();
  }, [id]);

  // WAKE LOCK LOGIC
  const toggleWakeLock = async () => {
    if (!wakeLockActive) {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          setWakeLockActive(true);
          console.log("Wake Lock Active");
        } else {
          alert("Wake Lock not supported on this browser.");
        }
      } catch (err) { console.error(err); }
    } else {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
      setWakeLockActive(false);
    }
  };

  // CLEANUP WAKE LOCK ON EXIT
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, []);

  // SYNC & SPEED LOGIC
  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // 1. Local Save (Frequent)
    if (audio.currentTime > 1) {
      localStorage.setItem(`progress_${id}`, audio.currentTime);
    }

    // 2. Server Sync (Every 10 seconds)
    const now = Date.now();
    if (sessionId && now - lastSync.current > 10000) {
      fetch(getProxyUrl('/api/sync'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          currentTime: audio.currentTime,
          duration: audio.duration,
          isFinished: false
        })
      }).catch(e => console.log("Sync skipped"));
      lastSync.current = now;
    }
  };

  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5];
    const nextIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) audioRef.current.playbackRate = newSpeed;
  };

  const handlePlayUnlock = () => {
    if (seekApplied.current || !audioRef.current) return;
    const savedTime = localStorage.getItem(`progress_${id}`);
    if (savedTime) {
      audioRef.current.currentTime = parseFloat(savedTime);
      seekApplied.current = true;
    }
    // Apply speed again on play just in case
    audioRef.current.playbackRate = playbackSpeed;
  };

  if (!book) return <div className="p-10 text-white text-center">Loading Engine...</div>;

  const audioUrl = sessionId ? getProxyUrl(`/public/session/${sessionId}/track/1`) : null;
  const coverUrl = getProxyUrl(`/api/items/${id}/cover`);

  return (
    <div className={`min-h-screen bg-slate-900 text-white flex flex-col ${carMode ? 'justify-center' : 'items-center p-6'}`}>
      <audio ref={silentRef} src={SILENT_AUDIO_SRC} loop />
      
      {/* --- STANDARD MODE HEADER --- */}
      {!carMode && (
        <div className="w-full max-w-3xl flex justify-between items-center mb-6">
          <button onClick={() => navigate('/')} className="font-bold px-4 py-2 bg-slate-800 rounded-lg">← Library</button>
          <button onClick={() => setCarMode(true)} className="px-6 py-2 rounded-full font-bold bg-blue-600 shadow-lg animate-pulse">
             🚗 CAR MODE
          </button>
        </div>
      )}

      {/* --- CAR MODE UI --- */}
      {carMode ? (
        <div className="flex flex-col h-screen p-4 bg-black">
          {/* Top Bar: Exit & Wake Lock */}
          <div className="flex justify-between mb-8">
            <button onClick={() => setCarMode(false)} className="px-6 py-4 bg-slate-800 rounded-xl text-xl font-bold text-gray-400">Exit Car Mode</button>
            <button 
              onClick={toggleWakeLock} 
              className={`px-6 py-4 rounded-xl text-xl font-bold border-2 ${wakeLockActive ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-transparent border-gray-600 text-gray-500'}`}
            >
              {wakeLockActive ? '👁️ Screen ON' : 'Screen Auto'}
            </button>
          </div>

          {/* Big Cover & Title */}
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
             <h1 className="text-3xl font-bold text-center truncate w-full px-4">{book.media?.metadata?.title}</h1>
             <p className="text-xl text-gray-400">{book.media?.metadata?.authorName}</p>
          </div>

          {/* MASSIVE CONTROLS */}
          <div className="flex flex-col gap-6 mb-8">
             <div className="flex justify-between gap-4">
                <button onClick={() => { if(audioRef.current) audioRef.current.currentTime -= 30 }} className="flex-1 bg-slate-800 rounded-2xl py-8 text-4xl font-bold active:bg-slate-700">↺ 30s</button>
                <button onClick={() => { if(audioRef.current) audioRef.current.currentTime += 30 }} className="flex-1 bg-slate-800 rounded-2xl py-8 text-4xl font-bold active:bg-slate-700">30s ↻</button>
             </div>
             
             {/* Speed Toggle in Car Mode */}
             <button onClick={cycleSpeed} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-4 text-xl font-bold text-emerald-400">
               Speed: {playbackSpeed}x
             </button>
          </div>
        </div>
      ) : (
        /* --- STANDARD UI --- */
        <div className="w-full max-w-3xl flex flex-col items-center">
          <div className="aspect-[2/3] w-52 bg-slate-800 rounded-2xl shadow-2xl mb-8 overflow-hidden border border-slate-700">
            <img src={coverUrl} className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-1">{book.media?.metadata?.title}</h1>
          <p className="text-gray-400 mb-8">{book.media?.metadata?.authorName}</p>
        </div>
      )}

      {/* --- HIDDEN AUDIO ENGINE --- */}
      {/* We keep the audio element outside the conditional render so switching modes doesn't stop playback */}
      <div className={carMode ? 'hidden' : 'w-full max-w-3xl bg-slate-800 p-8 rounded-3xl shadow-xl mb-8'}>
          <audio 
            ref={audioRef} 
            controls 
            key={sessionId || 'loading'} 
            className="w-full h-12 invert-[.9]"
            onPlaying={handlePlayUnlock}
            onTimeUpdate={handleTimeUpdate}
            preload="auto" 
            playsInline 
          >
            {audioUrl && <source src={audioUrl} type="audio/mp4" />}
          </audio>
          
          {!carMode && (
             <button onClick={cycleSpeed} className="mt-4 text-emerald-400 text-sm font-bold w-full text-center">
               Playback Speed: {playbackSpeed}x
             </button>
          )}
      </div>

       {/* Chapters (Standard Mode Only) */}
       {!carMode && (
        <div className="w-full max-w-3xl">
          <div className="bg-slate-800 rounded-2xl divide-y divide-slate-700 max-h-64 overflow-y-auto">
            {book.media?.chapters?.map((c, i) => (
              <button key={i} onClick={() => { if(audioRef.current) { audioRef.current.currentTime = c.start; audioRef.current.play(); seekApplied.current = true; } }} className="w-full p-4 hover:bg-slate-700 text-left">
                <span>{c.title || `Chapter ${i + 1}`}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}