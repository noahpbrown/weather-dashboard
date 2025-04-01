import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LocalWeather from './pages/LocalWeather';
import SevereWeather from './pages/SevereWeather';

export default function App() {
  return (
    <Router>
      <div className="p-4">
        <nav className="mb-4 space-x-4 text-lg">
          <Link to="/" className="text-blue-600 hover:underline">Local Weather</Link>
          <Link to="/severe" className="text-red-600 hover:underline">Severe Weather</Link>
        </nav>
        <Routes>
          <Route path="/" element={<LocalWeather />} />
          <Route path="/severe" element={<SevereWeather />} />
        </Routes>
      </div>
    </Router>
  );
}

