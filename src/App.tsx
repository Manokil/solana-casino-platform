import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { WalletProvider } from './components/WalletProvider';
import EnhancedNavigation from './components/layout/EnhancedNavigation';
import AppRoutes from './routes';
import { Toaster, toast } from 'react-hot-toast';

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
        <div className="min-h-screen bg-[var(--background)]">
          <EnhancedNavigation />
          <main>
            <AppRoutes />
          </main>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                backdropFilter: 'blur(20px)',
              },
              success: {
                iconTheme: {
                  primary: 'var(--accent)',
                  secondary: 'white',
                },
              },
              error: {
                iconTheme: {
                  primary: 'var(--error)',
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