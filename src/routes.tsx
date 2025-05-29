import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Games from './pages/Games';
import CasinoCreator from './pages/CasinoCreator';
import About from './pages/About';
import StyleTest from './components/test/StyleTest';
import UltraCoinFlip from './components/games/UltraCoinFlip';
import UltraDiceRoll from './components/games/UltraDiceRoll';
import UltraSlots from './components/games/UltraSlots';
import GameSelector3D from './components/games/GameSelector3D';
import AdvancedLeaderboard from './components/leaderboard/AdvancedLeaderboard';
import EnhancedGameStats from './components/analytics/EnhancedGameStats';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/games" element={<GameSelector3D />} />
      <Route path="/create" element={<CasinoCreator />} />
      <Route path="/bot" element={<div>Telegram Bot</div>} />
      <Route path="/wallets" element={<div>Wallets</div>} />
      <Route path="/settings" element={<div>Settings</div>} />
      <Route path="/about" element={<About />} />

      {/* Ultra Games */}
      <Route path="/coinflip" element={<UltraCoinFlip />} />
      <Route path="/dice" element={<UltraDiceRoll />} />
      <Route path="/slots" element={<UltraSlots />} />

      {/* Analytics & Leaderboard */}
      <Route path="/analytics" element={<EnhancedGameStats />} />
      <Route path="/leaderboard" element={<AdvancedLeaderboard />} />

      {/* Style Test (for development) */}
      <Route path="/style-test" element={<StyleTest />} />
    </Routes>
  );
};

export default AppRoutes;