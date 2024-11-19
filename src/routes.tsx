import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Games from './pages/Games';
import CasinoCreator from './pages/CasinoCreator';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/games" element={<Games />} />
      <Route path="/create" element={<CasinoCreator />} />
      <Route path="/bot" element={<div>Telegram Bot</div>} />
      <Route path="/wallets" element={<div>Wallets</div>} />
      <Route path="/settings" element={<div>Settings</div>} />
    </Routes>
  );
};

export default AppRoutes;