import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBookDetails, getProxyUrl } from '../lib/api';

// Silent MP3 to keep Bluetooth alive
const SILENT_AUDIO_SRC = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////wAAAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////wAAAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [bluetoothMode, setBluetoothMode] = useState(false); // Functional only
  const audioRef = useRef(null);
  const silentRef = useRef(null); 
  
  useEffect(() => {
    fetchBookDetails(id).then(setBook);
  }, [id]);

  // Bluetooth Logic: Toggle silent noise, but don't change UI
  useEffect(() => {
    if (silentRef.current) {
      if (bluetoothMode) {
        silentRef.current.play().catch(e => console.log("Silent play blocked:", e));
      } else {
        silentRef.current.pause();
      }
    }
  }, [bluetoothMode]);

  // Restore Progress
  const handleLoadedMetadata = () => {
    const savedTime = localStorage.getItem(`progress_${id}`);
    if (savedTime && audioRef.current) {
      audioRef.current.currentTime = parseFloat(savedTime);
    }
  };

  // Save Progress
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      localStorage.setItem(`progress_${id}`, audioRef.current.currentTime);
    }
  };

  if (!book) return <div className="p-10 text-center text-white">Loading Book...</div>;

  const metadata = book.media?.metadata || {};
  const chapters = book.media?.chapters || [];
  const coverUrl = getProxyUrl(`/api/items/${id}/cover`);
  
  // DIRECT FILE STREAM
  // We add "supportedMimeTypes" to force the server to send raw audio instead of an HLS playlist
  const audioUrl = getProxyUrl(`/api/items/${id}/file?token=${localStorage.getItem('abs_token')}`);

  const skip = (seconds) => {
    if (audioRef.current) audioRef.current.currentTime += seconds;
  };

  const playChapter = (startTime) => {
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
      audioRef.current.play();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-6">
      
      {/* HEADER */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-6 z-10">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white text-lg px-4 py-2">
          ← Library
        </button>
        <button 
          onClick={() => setBluetoothMode(!bluetoothMode)}
          className={`px-4 py-2 rounded-full font-bold text-sm transition ${bluetoothMode ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-700 text-gray-300'}`}
        >
          {bluetoothMode ? 'Bluetooth Active' : 'Enable Bluetooth Mode'}
        </button>
      </div>

      {/* INVISIBLE SILENT PLAYER */}
      <audio ref={silentRef} src={SILENT_AUDIO_SRC} loop />

      {/* PLAYER CONTENT */}
      <div className="w-full max-w-3xl flex flex-col items-center relative">
        
        {/* Cover Art */}
        <div className="aspect-[2/3] w-48 md:w-64 bg-slate-800 rounded-lg shadow-2xl overflow-hidden mb-6">
          <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
        </div>

        {/* Title Info */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">{metadata.title}</h1>
          <p className="text-gray-400 text-lg">{metadata.authorName}</p>
        </div>

        {/* CONTROLS */}
        <div className="w-full bg-slate-800 p-6 rounded-xl shadow-lg mb-8">
            <div className="flex justify-center gap-8 mb-6">
              <button onClick={() => skip(-15)} className="rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center w-16 h-16 text-lg transition">
                ↺ 15
              </button>
              <button onClick={() => skip(30)} className="rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center w-16 h-16 text-lg transition">
                30 ↻
              </button>
            </div>

            <audio 
              ref={audioRef} 
              controls 
              className="w-full h-10 invert-[.9]"
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              preload="auto" 
            >
              <source src={audioUrl} />
            </audio>
        </div>

        {/* CHAPTERS */}
        <div className="w-full">
          <h3 className="text-xl font-bold mb-4 text-emerald-400">Chapters</h3>
          <div className="bg-slate-800 rounded-xl overflow-hidden shadow-lg divide-y divide-slate-700 max-h-64 overflow-y-auto">
            {chapters.map((chapter, index) => (
              <button 
                key={index}
                onClick={() => playChapter(chapter.start)}
                className="w-full text-left p-4 hover:bg-slate-700 transition flex justify-between"
              >
                <span className="font-medium text-gray-300">
                  {chapter.title || `Chapter ${index + 1}`}
                </span>
                <span className="text-gray-500 text-sm">
                  {new Date(chapter.start * 1000).toISOString().substr(11, 8)}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}