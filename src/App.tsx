import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { WalletProvider } from './components/WalletProvider';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import AppRoutes from './routes';

const App: React.FC = () => {
  return (
    <WalletProvider>
      <BrowserRouter>
        <div className="flex min-h-screen bg-[var(--background)]">
          <Sidebar />
          <div className="flex-1 ml-64">
            <Header />
            <main className="p-6">
              <AppRoutes />
            </main>
          </div>
        </div>
      </BrowserRouter>
    </WalletProvider>
  );
};

export default App;