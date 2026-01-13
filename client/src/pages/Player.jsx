import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchBookDetails } from '../lib/api';
import { ArrowLeft, Play, ListMusic, RotateCcw, RotateCw, Clock, Bluetooth, BluetoothConnected, Save } from 'lucide-react';

const PROXY_URL = 'http://localhost:3000/api/proxy';

function Player() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [bluetoothMode, setBluetoothMode] = useState(false);
  const [resumeFound, setResumeFound] = useState(false); // Did we find a save file?
  
  const audioRef = useRef(null);
  const keepAliveCtx = useRef(null);
  const shouldResumeRef = useRef(false); // Technical flag to handle the "Jump" timing

  // 1. LOAD BOOK & CHECK FOR SAVED PROGRESS
  useEffect(() => {
    fetchBookDetails(id).then((data) => {
      setBook(data);
      
      // Check Local Storage for this book's ID
      const savedProgress = localStorage.getItem(`progress-${id}`);
      
      if (savedProgress && data.media.audioFiles) {
        const parsed = JSON.parse(savedProgress);
        console.log("📂 Found saved progress:", parsed);

        // Find the specific file that was saved
        const fileToResume = data.media.audioFiles.find(f => f.ino === parsed.ino);
        
        if (fileToResume) {
            // Found it! Set it as active and tell the player to seek
            setActiveFile(fileToResume);
            shouldResumeRef.current = parsed.time; // Store the timestamp to jump to
            setResumeFound(true);
            return; 
        }
      }

      // If no save found, just play the first file
      if (data && data.media && data.media.audioFiles.length > 0) {
        setActiveFile(data.media.audioFiles[0]);
      }
    });
  }, [id]);

  // 2. SAVE PROGRESS (Runs every second while playing)
  const handleTimeUpdate = () => {
    if (audioRef.current && activeFile) {
        const currentTime = audioRef.current.currentTime;
        // Only save if we are actually playing (time > 0)
        if (currentTime > 0) {
            const payload = JSON.stringify({
                ino: activeFile.ino,
                time: currentTime,
                updatedAt: Date.now()
            });
            localStorage.setItem(`progress-${id}`, payload);
        }
    }
  };

  // 3. EXECUTE THE "JUMP" (Runs when the audio file actually loads)
  const handleMetadataLoaded = () => {
    if (audioRef.current && shouldResumeRef.current !== false) {
        console.log(`⏩ Resuming at ${shouldResumeRef.current}s`);
        audioRef.current.currentTime = shouldResumeRef.current;
        shouldResumeRef.current = false; // Reset so we don't jump again
    }
  };

  // --- BLUETOOTH SYSTEM ---
  useEffect(() => {
    if (bluetoothMode) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!keepAliveCtx.current) keepAliveCtx.current = new AudioContext();
        const ctx = keepAliveCtx.current;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(20, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
        oscillator.start();
        return () => { oscillator.stop(); oscillator.disconnect(); };
    } else {
        if (keepAliveCtx.current) { keepAliveCtx.current.close(); keepAliveCtx.current = null; }
    }
  }, [bluetoothMode]);

  const getProxyLink = (path) => `${PROXY_URL}?path=${encodeURIComponent(path)}`;

  const skip = (seconds) => {
    if (audioRef.current) audioRef.current.currentTime += seconds;
  };

  const playChapter = (startTime) => {
    if (audioRef.current) {
        audioRef.current.currentTime = startTime;
        audioRef.current.play();
    }
  };

  const formatTime = (seconds) => {
    return new Date(seconds * 1000).toISOString().substr(11, 8);
  };

  if (!book) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading Scroll...</div>;

  const hasChapters = book.media.chapters && book.media.chapters.length > 0;
  const listItems = hasChapters ? book.media.chapters : book.media.audioFiles;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* LEFT: Cover */}
      <div className="w-full md:w-1/3 bg-slate-900 p-8 flex flex-col relative border-r border-slate-800">
        <Link to="/" className="absolute top-8 left-8 p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition text-slate-400 hover:text-white z-20">
            <ArrowLeft className="w-6 h-6" />
        </Link>

        <div className="mt-12 w-64 mx-auto shadow-2xl rounded-xl overflow-hidden border border-slate-700/50 relative z-10">
            <img 
                src={getProxyLink(`/api/items/${book.id}/cover`)} 
                alt="Cover" 
                className="w-full h-auto object-cover"
            />
        </div>

        <div className="mt-8 text-center px-4">
            <h1 className="text-2xl font-bold text-white mb-2 leading-tight">{book.media.metadata.title}</h1>
            <p className="text-emerald-400 font-medium text-lg">{book.media.metadata.authorName}</p>
        </div>

        {resumeFound && (
             <div className="mt-4 flex items-center justify-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 py-1 px-3 rounded-full mx-auto w-fit">
                <Save className="w-3 h-3" /> Resumed from where you left off
             </div>
        )}

        <div className="mt-8 text-slate-400 text-sm leading-relaxed overflow-y-auto max-h-64 px-4 pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {book.media.metadata.description || "No description available."}
        </div>
      </div>

      {/* RIGHT: Player */}
      <div className="w-full md:w-2/3 bg-slate-950 p-8 flex flex-col">
        <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-emerald-500 text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                        <Play className="w-3 h-3 fill-current" /> Now Playing
                    </h2>
                    <button 
                        onClick={() => setBluetoothMode(!bluetoothMode)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                            bluetoothMode 
                            ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                            : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'
                        }`}
                    >
                        {bluetoothMode ? <BluetoothConnected className="w-4 h-4" /> : <Bluetooth className="w-4 h-4" />}
                        {bluetoothMode ? "Keep-Alive On" : "Bluetooth Mode"}
                    </button>
                </div>
                
                {activeFile ? (
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-center gap-8 mb-2">
                            <button onClick={() => skip(-15)} className="flex flex-col items-center gap-1 text-slate-400 hover:text-emerald-400 transition group" title="Rewind 15s">
                                <RotateCcw className="w-8 h-8 group-active:-scale-x-100 transition-transform" />
                                <span className="text-xs font-bold">-15s</span>
                            </button>
                            <button onClick={() => skip(30)} className="flex flex-col items-center gap-1 text-slate-400 hover:text-emerald-400 transition group" title="Forward 30s">
                                <RotateCw className="w-8 h-8 group-active:rotate-12 transition-transform" />
                                <span className="text-xs font-bold">+30s</span>
                            </button>
                        </div>

                        <audio 
                            ref={audioRef}
                            controls 
                            autoPlay
                            className="w-full h-12 accent-emerald-500"
                            key={activeFile.ino} 
                            src={getProxyLink(`/api/items/${book.id}/file/${activeFile.ino}`)}
                            
                            // NEW EVENTS FOR PROGRESS TRACKING
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleMetadataLoaded}
                        />
                    </div>
                ) : (
                    <div className="text-slate-500">No audio files found.</div>
                )}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
            <h3 className="flex items-center gap-3 text-xl font-bold mb-6 text-white sticky top-0 bg-slate-950 py-2 z-10">
                <ListMusic className="w-6 h-6 text-emerald-500" />
                {hasChapters ? "Chapters" : "Files"}
            </h3>
            <div className="space-y-2 pb-8">
                {listItems.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => hasChapters ? playChapter(item.start) : setActiveFile(item)}
                        className={`w-full flex items-center p-4 rounded-xl border transition-all duration-200 group ${
                            (hasChapters ? false : activeFile && activeFile.ino === item.ino) 
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700'
                        }`}
                    >
                        <div className={`w-10 h-10 flex items-center justify-center rounded-full mr-4 text-sm font-bold transition-colors ${
                             (hasChapters ? false : activeFile && activeFile.ino === item.ino)
                             ? 'bg-emerald-500 text-slate-950'
                             : 'bg-slate-800 text-slate-500 group-hover:text-slate-300'
                        }`}>
                            {hasChapters ? <Clock className="w-4 h-4" /> : index + 1}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                            <div className="font-medium truncate text-base">
                                {item.title || item.metadata?.filename || `Chapter ${index + 1}`}
                            </div>
                            {hasChapters && (
                                <div className="text-xs text-slate-500 mt-1 font-mono">
                                    Start: {formatTime(item.start)}
                                </div>
                            )}
                        </div>
                    </button>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}

export default Player;