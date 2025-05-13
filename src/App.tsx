import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { WalletProvider } from './components/WalletProvider';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import AppRoutes from './routes';
import { Toaster, toast } from 'react-hot-toast';
import { useWalletSettings } from './components/WalletProvider';

const App: React.FC = () => {
  // Initialize app
  useEffect(() => {
    // Show welcome toast on first load
    toast.success('Welcome to Solana Casino!', {
      icon: '🎰',
      duration: 3000,
    });
  }, []);

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

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              },
              success: {
                iconTheme: {
                  primary: 'var(--accent)',
                  secondary: 'white',
                },
              },
            }}
          />
        </div>
      </BrowserRouter>
    </WalletProvider>
  );
};

export default App;