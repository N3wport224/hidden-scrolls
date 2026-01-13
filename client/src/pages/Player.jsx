import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBookDetails, getProxyUrl } from '../lib/api'; // Import Helper

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);

  useEffect(() => {
    fetchBookDetails(id).then(setBook);
  }, [id]);

  if (!book) return <div className="p-10 text-center text-white">Loading Book...</div>;

  const metadata = book.media?.metadata || {};
  const coverUrl = getProxyUrl(`/api/items/${id}/cover`); // Use Helper
  const audioUrl = getProxyUrl(`/api/items/${id}/play`);  // Use Helper for Audio

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
      
      {/* Back Button */}
      <button onClick={() => navigate('/')} className="absolute top-6 left-6 text-gray-400 hover:text-white">
        ← Library
      </button>

      {/* Cover Art */}
      <div className="w-64 h-96 bg-slate-800 rounded-lg shadow-2xl mb-8 overflow-hidden">
        <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
      </div>

      {/* Title Info */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">{metadata.title}</h1>
        <p className="text-gray-400 text-lg">{metadata.authorName}</p>
      </div>

      {/* Audio Player */}
      <div className="w-full max-w-md bg-slate-800 p-4 rounded-xl shadow-lg">
        <audio controls className="w-full h-12" autoPlay>
            <source src={audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
        </audio>
      </div>

    </div>
  );
}