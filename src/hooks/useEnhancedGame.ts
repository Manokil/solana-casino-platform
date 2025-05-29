import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { toast } from 'react-hot-toast';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
interface GameState {
  isPlaying: boolean;
  result: any | null;
  isAnimating: boolean;
  gameId: string | null;
  transactionSignature: string | null;
  error: string | null;
  startTime: number | null;
  endTime: number | null;
}

interface GameHistory {
  id: string;
  gameType: string;
  betAmount: number;
  prediction: any;
  result: any;
  won: boolean;
  payout: number;
  timestamp: number;
  transactionSignature: string;
  provableFairData: {
    clientSeed: string;
    serverSeedHash: string;
    nonce: number;
  };
}

interface GameStats {
  totalGames: number;
  totalWagered: number;
  totalWon: number;
  biggestWin: number;
  currentStreak: number;
  bestStreak: number;
  winRate: number;
  profitLoss: number;
}

// Store for game state management
interface GameStore {
  gameState: GameState;
  gameHistory: GameHistory[];
  gameStats: GameStats;
  setGameState: (state: Partial<GameState>) => void;
  addGameToHistory: (game: GameHistory) => void;
  updateGameStats: (game: GameHistory) => void;
  clearHistory: () => void;
  resetStats: () => void;
}

const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      gameState: {
        isPlaying: false,
        result: null,
        isAnimating: false,
        gameId: null,
        transactionSignature: null,
        error: null,
        startTime: null,
        endTime: null,
      },
      gameHistory: [],
      gameStats: {
        totalGames: 0,
        totalWagered: 0,
        totalWon: 0,
        biggestWin: 0,
        currentStreak: 0,
        bestStreak: 0,
        winRate: 0,
        profitLoss: 0,
      },
      setGameState: (state) => set((prev) => ({
        gameState: { ...prev.gameState, ...state }
      })),
      addGameToHistory: (game) => set((prev) => ({
        gameHistory: [game, ...prev.gameHistory.slice(0, 99)] // Keep last 100 games
      })),
      updateGameStats: (game) => set((prev) => {
        const stats = { ...prev.gameStats };
        stats.totalGames += 1;
        stats.totalWagered += game.betAmount;

        if (game.won) {
          stats.totalWon += game.payout;
          stats.currentStreak = stats.currentStreak >= 0 ? stats.currentStreak + 1 : 1;
          stats.biggestWin = Math.max(stats.biggestWin, game.payout);
        } else {
          stats.currentStreak = stats.currentStreak <= 0 ? stats.currentStreak - 1 : -1;
        }

        stats.bestStreak = Math.max(stats.bestStreak, Math.abs(stats.currentStreak));
        stats.winRate = (prev.gameHistory.filter(g => g.won).length + (game.won ? 1 : 0)) / stats.totalGames * 100;
        stats.profitLoss = stats.totalWon - stats.totalWagered;

        return { gameStats: stats };
      }),
      clearHistory: () => set({ gameHistory: [] }),
      resetStats: () => set({
        gameStats: {
          totalGames: 0,
          totalWagered: 0,
          totalWon: 0,
          biggestWin: 0,
          currentStreak: 0,
          bestStreak: 0,
          winRate: 0,
          profitLoss: 0,
        }
      }),
    }),
    {
      name: 'game-store',
      partialize: (state) => ({
        gameHistory: state.gameHistory,
        gameStats: state.gameStats,
      }),
    }
  )
);

// Enhanced game hook
export const useEnhancedGame = (gameType: string) => {
  const { connection } = useConnection();
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const {
    gameState,
    gameHistory,
    gameStats,
    setGameState,
    addGameToHistory,
    updateGameStats,
  } = useGameStore();

  // Audio refs
  const winSoundRef = useRef<HTMLAudioElement | null>(null);
  const loseSoundRef = useRef<HTMLAudioElement | null>(null);
  const spinSoundRef = useRef<HTMLAudioElement | null>(null);

  // WebSocket connection for real-time updates
  const wsRef = useRef<WebSocket | null>(null);

  // Simplified game simulation (without complex smart contracts for now)
  const gameSimulator = useMemo(() => {
    return {
      simulateGame: (gameType: string, betAmount: number, prediction: any) => {
        // Simple game simulation logic
        let outcome: any;
        let won = false;
        let payout = 0;

        switch (gameType) {
          case 'coinflip':
            outcome = Math.random() < 0.5 ? 'heads' : 'tails';
            won = outcome === prediction.choice;
            payout = won ? betAmount * 1.95 : 0;
            break;
          case 'diceroll':
            outcome = Math.floor(Math.random() * 100) + 1;
            won = prediction.isOver ? outcome > prediction.target : outcome < prediction.target;
            const chance = prediction.isOver ? (100 - prediction.target) : prediction.target;
            const multiplier = chance > 0 ? (98 / chance) : 0;
            payout = won ? betAmount * Math.min(multiplier, 9.9) : 0;
            break;
          case 'slots':
            outcome = [
              Math.floor(Math.random() * 7),
              Math.floor(Math.random() * 7),
              Math.floor(Math.random() * 7)
            ];
            // Check for wins (simplified)
            if (outcome[0] === outcome[1] && outcome[1] === outcome[2]) {
              won = true;
              payout = betAmount * (outcome[0] === 6 ? 100 : (outcome[0] + 1) * 5);
            }
            break;
          default:
            outcome = Math.random() < 0.5;
            won = outcome === prediction;
            payout = won ? betAmount * 2 : 0;
        }

        return { outcome, won, payout };
      }
    };
  }, []);

  // Initialize audio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      winSoundRef.current = new Audio('/sounds/win.mp3');
      loseSoundRef.current = new Audio('/sounds/lose.mp3');
      spinSoundRef.current = new Audio('/sounds/spin.mp3');

      // Preload audio files
      [winSoundRef.current, loseSoundRef.current, spinSoundRef.current].forEach(audio => {
        if (audio) {
          audio.preload = 'auto';
          audio.volume = 0.5;
        }
      });
    }
  }, []);

  // Simplified real-time updates (without WebSocket for now)
  useEffect(() => {
    // For now, we'll handle game updates locally
    // In production, this would connect to a real WebSocket server
    console.log('Game hook initialized for:', gameType);
  }, [gameType]);

  // Handle game result processing
  const processGameResult = useCallback((result: any, betAmount: number, prediction: any, gameId: string) => {
    setGameState({
      result,
      isAnimating: false,
      isPlaying: false,
      endTime: Date.now(),
    });

    // Play sound
    if (soundEnabled) {
      const audio = result.won ? winSoundRef.current : loseSoundRef.current;
      audio?.play().catch(console.error);
    }

    // Show notification
    if (result.won) {
      toast.success(`🎉 You won ${result.payout.toFixed(4)} SOL!`, {
        duration: 5000,
        icon: '🎰',
      });
    } else {
      toast.error('Better luck next time!', {
        duration: 3000,
      });
    }

    // Add to history and update stats
    const gameRecord: GameHistory = {
      id: gameId,
      gameType,
      betAmount,
      prediction,
      result,
      won: result.won,
      payout: result.payout,
      timestamp: Date.now(),
      transactionSignature: 'simulated-tx',
      provableFairData: {
        clientSeed: Math.random().toString(36),
        serverSeedHash: 'simulated-hash',
        nonce: Date.now(),
      },
    };

    addGameToHistory(gameRecord);
    updateGameStats(gameRecord);
  }, [gameType, soundEnabled, setGameState, addGameToHistory, updateGameStats]);

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

  // Simplified bet placement with game simulation
  const placeBet = useCallback(async (
    amount: number,
    prediction: any,
    options: {
      clientSeed?: string;
      autoPlay?: boolean;
      stopOnWin?: boolean;
      stopOnLoss?: boolean;
    } = {}
  ) => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    if (gameState.isPlaying) {
      throw new Error('Game already in progress');
    }

    // Validate bet amount
    if (amount <= 0) {
      throw new Error('Bet amount must be greater than 0');
    }

    if (balance !== null && amount > balance) {
      throw new Error('Insufficient balance');
    }

    setIsLoading(true);
    const gameId = Math.random().toString(36).substring(7);

    setGameState({
      isPlaying: true,
      isAnimating: true,
      result: null,
      error: null,
      startTime: Date.now(),
      gameId,
      transactionSignature: null,
    });

    try {
      // Play spin sound
      if (soundEnabled && spinSoundRef.current) {
        spinSoundRef.current.currentTime = 0;
        spinSoundRef.current.play().catch(console.error);
      }

      // Simulate game delay (1-3 seconds)
      const delay = 1000 + Math.random() * 2000;

      await new Promise(resolve => setTimeout(resolve, delay));

      // Simulate the game
      const result = gameSimulator.simulateGame(gameType, amount, prediction);

      // Process the result
      processGameResult(result, amount, prediction, gameId);

      // Update balance (simulate)
      if (balance !== null) {
        const newBalance = balance - amount + result.payout;
        setBalance(newBalance);
      }

      return {
        signature: 'simulated-tx-' + gameId,
        gameId,
      };

    } catch (error: any) {
      console.error('Error placing bet:', error);

      setGameState({
        isPlaying: false,
        isAnimating: false,
        error: error.message || 'Failed to place bet',
      });

      toast.error(error.message || 'Failed to place bet');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, gameState.isPlaying, balance, gameType, soundEnabled, setGameState, gameSimulator, processGameResult]);

  // Auto-play functionality (simplified)
  const startAutoPlay = useCallback(async (
    baseAmount: number,
    prediction: any,
    options: {
      numberOfGames: number;
      stopOnWin?: number;
      stopOnLoss?: number;
      increaseOnWin?: number;
      increaseOnLoss?: number;
    }
  ) => {
    // Simplified auto-play - would be implemented in production
    console.log('Auto-play feature coming soon!');
    toast.info('Auto-play feature coming soon!');
  }, []);

  // Initialize balance on mount and set default balance for demo
  useEffect(() => {
    if (publicKey) {
      fetchBalance();
      // Set demo balance if no real balance
      if (balance === null) {
        setBalance(10); // Demo balance of 10 SOL
      }
    } else {
      setBalance(null);
    }

    // Refresh balance every 30 seconds
    const intervalId = setInterval(() => {
      if (publicKey) fetchBalance();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchBalance, publicKey, balance]);

  return {
    // State
    gameState,
    gameHistory,
    gameStats,
    balance,
    isLoading,
    isConnected: !!publicKey,
    soundEnabled,

    // Actions
    placeBet,
    startAutoPlay,
    fetchBalance,
    setSoundEnabled,

    // Utilities
    connection,
  };
};
