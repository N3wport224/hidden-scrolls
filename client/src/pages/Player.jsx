import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBookDetails, getProxyUrl } from '../lib/api';

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const audioRef = useRef(null);
  
  // Load book details
  useEffect(() => {
    fetchBookDetails(id).then(setBook);
  }, [id]);

  if (!book) return <div className="p-10 text-center text-white">Loading Book...</div>;

  const metadata = book.media?.metadata || {};
  const chapters = book.media?.chapters || [];
  const coverUrl = getProxyUrl(`/api/items/${id}/cover`);
  
  // SWITCHED TO '/file' (More reliable for streaming)
  const audioUrl = getProxyUrl(`/api/items/${id}/file`); 

  // --- CONTROLS ---
  const skip = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const playChapter = (startTime) => {
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
      audioRef.current.play();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center">
      
      {/* 1. Header */}
      <div className="w-full max-w-3xl flex items-center mb-8">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white text-lg">
          ← Back
        </button>
      </div>

      {/* 2. Main Player Section */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        
        {/* Cover Art */}
        <div className="aspect-[2/3] bg-slate-800 rounded-lg shadow-2xl overflow-hidden mx-auto md:mx-0 w-64 md:w-full">
          <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
        </div>

        {/* Controls */}
        <div className="flex flex-col justify-center text-center md:text-left">
          <h1 className="text-2xl font-bold mb-2">{metadata.title}</h1>
          <p className="text-gray-400 text-lg mb-6">{metadata.authorName}</p>

          {/* Audio Element (Native Controls + Custom Buttons) */}
          <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
             {/* We keep standard controls for the progress bar, but add buttons above it */}
             <div className="flex justify-center gap-6 mb-4">
                <button onClick={() => skip(-15)} className="p-3 bg-slate-700 rounded-full hover:bg-slate-600">
                  ↺ 15s
                </button>
                <button onClick={() => skip(30)} className="p-3 bg-slate-700 rounded-full hover:bg-slate-600">
                  30s ↻
                </button>
             </div>

             <audio 
                ref={audioRef} 
                controls 
                className="w-full h-10 invert-[.9]" // Invert makes it dark modeish
                autoPlay
              >
                <source src={audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
             </audio>
          </div>
        </div>
      </div>

      {/* 3. Chapters List */}
      <div className="w-full max-w-3xl">
        <h3 className="text-xl font-bold mb-4 text-emerald-400">Chapters</h3>
        <div className="bg-slate-800 rounded-xl overflow-hidden shadow-lg divide-y divide-slate-700 max-h-96 overflow-y-auto">
          {chapters.map((chapter, index) => (
            <button 
              key={index}
              onClick={() => playChapter(chapter.start)}
              className="w-full text-left p-4 hover:bg-slate-700 transition flex justify-between group"
            >
              <span className="font-medium text-gray-300 group-hover:text-white">
                {chapter.title || `Chapter ${index + 1}`}
              </span>
              <span className="text-gray-500 text-sm">
                {new Date(chapter.start * 1000).toISOString().substr(11, 8)}
              </span>
            </button>
          ))}
          {chapters.length === 0 && (
             <div className="p-4 text-gray-500">No chapters found.</div>
          )}
        </div>
      </div>

    </div>
  );
}