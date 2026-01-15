import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Player from './pages/Player';

function App() {
  return (
    <Router>
      <div className="bg-[#0f172a] min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* This line is what is currently missing and causing the error */}
          <Route path="/player/:id" element={<Player />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;