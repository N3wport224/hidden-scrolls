import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLibrary, getProxyUrl } from '../lib/api';

export default function Home() {
  const [books, setBooks] = useState([]);
  const [sortBy, setSortBy] = useState('title');

  useEffect(() => {
    fetchLibrary().then(setBooks);
  }, []);

  const sorted = [...books].sort((a, b) => {
    const field = sortBy === 'title' ? 'title' : 'authorName';
    const valA = (a.media?.metadata?.[field] || '').toLowerCase();
    const valB = (b.media?.metadata?.[field] || '').toLowerCase();
    return valA.localeCompare(valB);
  });

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-cyan-400 italic">HIDDEN SCROLLS</h1>
        <div className="flex bg-slate-800 p-1 rounded-lg">
          <button onClick={() => setSortBy('title')} className={`px-3 py-1 rounded text-[10px] ${sortBy === 'title' ? 'bg-cyan-500' : ''}`}>TITLE</button>
          <button onClick={() => setSortBy('author')} className={`px-3 py-1 rounded text-[10px] ${sortBy === 'author' ? 'bg-cyan-500' : ''}`}>AUTHOR</button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {sorted.map(b => (
          <Link to={`/player/${b.id}`} key={b.id} className="text-center">
            <img src={getProxyUrl(`/api/items/${b.id}/cover`)} className="rounded-xl aspect-[2/3] object-cover mb-2 border border-white/10" />
            <p className="text-xs font-bold truncate">{b.media?.metadata?.title}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}