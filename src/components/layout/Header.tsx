import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Bell } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="h-16 border-b border-[var(--border)] bg-[var(--background)]">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Dashboard</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-lg hover:bg-[var(--card)] transition-colors">
            <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
          <WalletMultiButton className="!bg-[var(--accent)] !text-white hover:!opacity-90" />
        </div>
      </div>
    </header>
  );
};

export default Header;