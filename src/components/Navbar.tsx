import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Coins, Dices, PlusCircle, Settings } from 'lucide-react';

const Navbar = () => {
  const { connected } = useWallet();

  return (
    <nav className="glass sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <Coins className="w-8 h-8 text-[var(--accent)]" />
              <span className="text-xl font-bold">
                SolanaCasino
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-4">
              <Link 
                to="/games" 
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-[var(--card)] transition-colors"
              >
                <Dices className="w-4 h-4" />
                <span>Games</span>
              </Link>
              <Link 
                to="/create" 
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-[var(--card)] transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Casino</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-lg hover:bg-[var(--card)] transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <WalletMultiButton className="!bg-[var(--accent)] !text-black hover:!bg-[var(--accent)]/90" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;