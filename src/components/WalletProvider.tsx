import { FC, ReactNode, useMemo, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter
} from '@solana/wallet-adapter-wallets';
import '@solana/wallet-adapter-react-ui/styles.css';
import { create } from 'zustand';

// Network options
const NETWORKS = {
  mainnet: {
    name: 'Mainnet Beta',
    endpoint: 'https://api.mainnet-beta.solana.com',
    active: true
  },
  devnet: {
    name: 'Devnet',
    endpoint: 'https://api.devnet.solana.com',
    active: true
  },
  testnet: {
    name: 'Testnet',
    endpoint: 'https://api.testnet.solana.com',
    active: true
  },
  localnet: {
    name: 'Localnet',
    endpoint: 'http://localhost:8899',
    active: false
  }
};

// Create a store for wallet settings
interface WalletSettingsState {
  network: string;
  setNetwork: (network: string) => void;
  autoConnect: boolean;
  setAutoConnect: (autoConnect: boolean) => void;
}

export const useWalletSettings = create<WalletSettingsState>((set) => ({
  network: 'mainnet',
  setNetwork: (network) => set({ network }),
  autoConnect: true,
  setAutoConnect: (autoConnect) => set({ autoConnect })
}));

const WalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { network, autoConnect } = useWalletSettings();
  const endpoint = NETWORKS[network as keyof typeof NETWORKS]?.endpoint || NETWORKS.mainnet.endpoint;

  // Initialize Phantom wallet
  const wallets = useMemo(() => [
    new PhantomWalletAdapter()
  ], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={autoConnect}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

export { WalletProvider, NETWORKS };