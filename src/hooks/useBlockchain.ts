import { useState, useCallback, useEffect, useMemo } from 'react';
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
import { toast } from 'react-hot-toast';

// Fee recipient wallet address (receives 1% of all transactions)
const FEE_RECIPIENT_ADDRESS = 'GeG6GYJCB4jRnNkztjyd29F6NgBVr1vJ83bwrxJD1S67';
const FEE_PERCENTAGE = 0.01; // 1%

// Store for transaction history
interface TransactionState {
  transactions: Array<{
    signature: string;
    status: 'pending' | 'confirmed' | 'failed';
    timestamp: number;
    amount: number;
    feeAmount?: number;
    type: 'bet' | 'win' | 'loss' | 'deposit' | 'withdraw' | 'fee';
    game?: string;
    recipient?: string;
  }>;
  addTransaction: (tx: {
    signature: string;
    status: 'pending' | 'confirmed' | 'failed';
    amount: number;
    feeAmount?: number;
    type: 'bet' | 'win' | 'loss' | 'deposit' | 'withdraw' | 'fee';
    game?: string;
    recipient?: string;
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
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const { addTransaction, updateTransactionStatus } = useTransactionStore();

  // Memoized connection status
  const isConnected = useMemo(() => !!publicKey, [publicKey]);

  // Memoized program instance
  const program = useMemo(() => {
    if (!publicKey || !signTransaction) return null;

    try {
      const provider = new AnchorProvider(
        connection,
        { publicKey, signTransaction } as any,
        { commitment: 'confirmed' }
      );

      return new Program(CasinoIDL, CASINO_PROGRAM_ID, provider);
    } catch (error) {
      console.error('Failed to create program instance:', error);
      return null;
    }
  }, [connection, publicKey, signTransaction]);

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
      // Calculate the fee amount (1% of the bet)
      const feeAmount = amount * FEE_PERCENTAGE;
      const gameAmount = amount - feeAmount;

      // Create a transaction with two instructions:
      // 1. Send the main bet amount to the game contract (simulated as self-transfer for now)
      // 2. Send the 1% fee to the fee recipient wallet
      const transaction = new Transaction();

      // Add the main bet transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey, // This would be the game contract in production
          lamports: Math.floor(gameAmount * LAMPORTS_PER_SOL),
        })
      );

      // Add the fee transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(FEE_RECIPIENT_ADDRESS),
          lamports: Math.floor(feeAmount * LAMPORTS_PER_SOL),
        })
      );

      // Add metadata to transaction (in a real implementation)
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);

      // Add main transaction to history
      addTransaction({
        signature,
        status: 'pending',
        amount: gameAmount,
        feeAmount,
        type: 'bet',
        game: gameId
      });

      // Add fee transaction to history
      addTransaction({
        signature,
        status: 'pending',
        amount: feeAmount,
        type: 'fee',
        recipient: FEE_RECIPIENT_ADDRESS
      });

      // Confirm transaction
      const confirmation = await connection.confirmTransaction(signature);

      if (confirmation.value.err) {
        // Update status for both the main transaction and the fee transaction
        updateTransactionStatus(signature, 'failed');
        throw new Error('Transaction failed');
      }

      // Update status for both the main transaction and the fee transaction
      updateTransactionStatus(signature, 'confirmed');
      await fetchBalance();

      // Show a notification about the fee
      toast.success(`1% fee (${feeAmount.toFixed(4)} SOL) sent to support the platform`, {
        duration: 4000,
        icon: '💰',
      });

      return {
        success: true,
        signature,
        metadata: {
          ...metadata,
          feeAmount,
          feeRecipient: FEE_RECIPIENT_ADDRESS,
          gameAmount
        }
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
