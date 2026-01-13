import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Player from './pages/Player';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. When the URL is just "/", show the Library Grid */}
        <Route path="/" element={<Home />} />
        
        {/* 2. When the URL is "/book/123", show the Player Page */}
        <Route path="/book/:id" element={<Player />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;