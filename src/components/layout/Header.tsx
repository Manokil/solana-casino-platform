import React, { useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { Bell, Moon, Sun, Settings } from 'lucide-react';
import NetworkSelector from '../wallet/NetworkSelector';
import WalletStatus from '../wallet/WalletStatus';

const Header: React.FC = () => {
  const { connected } = useWallet();
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // Theme implementation will be added later
  };

  return (
    <header className="h-16 border-b border-[var(--border)] bg-[var(--background)]">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Dashboard</h1>
        </div>

        <div className="flex items-center space-x-4">
          <NetworkSelector />

          {connected && <WalletStatus />}

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-[var(--card)] transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-[var(--text-secondary)]" />
            ) : (
              <Moon className="w-5 h-5 text-[var(--text-secondary)]" />
            )}
          </button>

          <button className="p-2 rounded-lg hover:bg-[var(--card)] transition-colors">
            <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>

          <button className="p-2 rounded-lg hover:bg-[var(--card)] transition-colors">
            <Settings className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>

          {!connected && (
            <WalletMultiButton className="!bg-[var(--accent)] !text-white hover:!opacity-90" />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;