import { useState, useCallback, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  Transaction,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionInstruction,
  sendAndConfirmTransaction,
  Connection
} from '@solana/web3.js';
import { create } from 'zustand';

// Store for transaction history
interface TransactionState {
  transactions: Array<{
    signature: string;
    status: 'pending' | 'confirmed' | 'failed';
    timestamp: number;
    amount: number;
    type: 'bet' | 'win' | 'loss' | 'deposit' | 'withdraw';
    game?: string;
  }>;
  addTransaction: (tx: {
    signature: string;
    status: 'pending' | 'confirmed' | 'failed';
    amount: number;
    type: 'bet' | 'win' | 'loss' | 'deposit' | 'withdraw';
    game?: string;
  }) => void;
  updateTransactionStatus: (signature: string, status: 'pending' | 'confirmed' | 'failed') => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  addTransaction: (tx) => set((state) => ({
    transactions: [
      {
        ...tx,
        timestamp: Date.now(),
      },
      ...state.transactions
    ]
  })),
  updateTransactionStatus: (signature, status) => set((state) => ({
    transactions: state.transactions.map(tx => 
      tx.signature === signature ? { ...tx, status } : tx
    )
  }))
}));

export const useBlockchain = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addTransaction, updateTransactionStatus } = useTransactionStore();

  // Fetch balance
  const fetchBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      return null;
    }

    try {
      const lamports = await connection.getBalance(publicKey);
      const solBalance = lamports / LAMPORTS_PER_SOL;
      setBalance(solBalance);
      return solBalance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return null;
    }
  }, [connection, publicKey]);

  // Place a bet
  const placeBet = useCallback(async (
    amount: number,
    gameId: string,
    metadata: Record<string, any> = {}
  ) => {
    if (!publicKey || !amount || amount <= 0) {
      throw new Error('Invalid bet parameters');
    }

    setIsLoading(true);

    try {
      // For now, we'll simulate a bet by sending SOL to the same wallet
      // In a real implementation, this would send to a game contract
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey, // This would be the game contract in production
          lamports: Math.floor(amount * LAMPORTS_PER_SOL),
        })
      );

      // Add metadata to transaction (in a real implementation)
      transaction.feePayer = publicKey;
      
      const signature = await sendTransaction(transaction, connection);
      
      // Add to transaction history
      addTransaction({
        signature,
        status: 'pending',
        amount,
        type: 'bet',
        game: gameId
      });

      // Confirm transaction
      const confirmation = await connection.confirmTransaction(signature);
      
      if (confirmation.value.err) {
        updateTransactionStatus(signature, 'failed');
        throw new Error('Transaction failed');
      }
      
      updateTransactionStatus(signature, 'confirmed');
      await fetchBalance();
      
      return {
        success: true,
        signature,
        metadata
      };
    } catch (error) {
      console.error('Error placing bet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTransaction, addTransaction, updateTransactionStatus, fetchBalance]);

  // Initialize and refresh balance
  useEffect(() => {
    fetchBalance();
    
    // Refresh balance every 15 seconds
    const intervalId = setInterval(fetchBalance, 15000);
    
    return () => clearInterval(intervalId);
  }, [fetchBalance]);

  return {
    balance,
    isLoading,
    placeBet,
    fetchBalance
  };
};
