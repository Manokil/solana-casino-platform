import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { Coins, Info, ExternalLink } from 'lucide-react';
import {
  useProvableFairnessStore,
  generateCoinFlipResult,
  initializeProvableFairness
} from '../../utils/provableFairness';
import { useBlockchain } from '../../hooks/useBlockchain';
import { toast } from 'react-hot-toast';

interface GameHistoryItem {
  id: number;
  bet: string;
  prediction: string;
  result: string;
  won: boolean;
  serverSeed?: string;
  clientSeed?: string;
  nonce?: number;
  txSignature?: string;
}

const CoinFlip: React.FC = () => {
  const { connected } = useWallet();
  const [betAmount, setBetAmount] = useState<string>('0.1');
  const [isFlipping, setIsFlipping] = useState(false);
  const [prediction, setPrediction] = useState<'heads' | 'tails'>('heads');
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);
  const [showProvableFairness, setShowProvableFairness] = useState(false);
  const { balance, placeBet, isLoading } = useBlockchain();

  const {
    clientSeed,
    getActiveServerSeed,
    rotateServerSeed
  } = useProvableFairnessStore();

  // Initialize provable fairness
  useEffect(() => {
    initializeProvableFairness();
  }, []);

  const handleFlip = async () => {
    if (!connected || isFlipping || isLoading) return;

    const betAmountNum = parseFloat(betAmount);
    if (isNaN(betAmountNum) || betAmountNum <= 0) {
      toast.error('Please enter a valid bet amount');
      return;
    }

    if (balance !== null && betAmountNum > balance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsFlipping(true);
    setResult(null);

    try {
      // Get active server seed
      const serverSeed = getActiveServerSeed();
      if (!serverSeed) {
        rotateServerSeed();
        throw new Error('No active server seed');
      }

      // Place bet on blockchain
      const betResult = await placeBet(betAmountNum, 'coinflip', {
        prediction,
        clientSeed: clientSeed.value,
        serverSeedHash: serverSeed.hashed,
        nonce: serverSeed.nonce
      });

      // Generate result using provably fair algorithm
      // In a real implementation, this would be done on the server
      const gameResult = generateCoinFlipResult(
        'server-seed-secret', // This would be kept secret on the server
        clientSeed.value,
        serverSeed.nonce
      );

      const won = gameResult === prediction;

      // Add to history
      setGameHistory(prev => [{
        id: Date.now(),
        bet: betAmount,
        prediction,
        result: gameResult,
        won,
        serverSeed: serverSeed.hashed,
        clientSeed: clientSeed.value,
        nonce: serverSeed.nonce,
        txSignature: betResult.signature
      }, ...prev.slice(0, 9)]);

      // Show result after animation
      setTimeout(() => {
        setResult(gameResult);
        setIsFlipping(false);

        if (won) {
          toast.success(`You won ${(betAmountNum * 1.95).toFixed(2)} SOL!`);
        } else {
          toast.error('Better luck next time!');
        }
      }, 2000);

    } catch (error) {
      console.error('Error placing bet:', error);
      toast.error('Failed to place bet. Please try again.');
      setIsFlipping(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Place Your Bet</h2>
              <button
                onClick={() => setShowProvableFairness(!showProvableFairness)}
                className="flex items-center space-x-1 text-sm text-[var(--accent)] hover:underline"
              >
                <Info className="w-4 h-4" />
                <span>Provably Fair</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Bet Amount (SOL)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none"
                    step="0.1"
                    min="0.1"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)]">
                    Balance: {balance !== null ? `${balance.toFixed(2)} SOL` : 'Loading...'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Prediction
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {(['heads', 'tails'] as const).map((side) => (
                    <button
                      key={side}
                      onClick={() => setPrediction(side)}
                      className={`px-4 py-3 rounded-lg border shadow-sm ${
                        prediction === side
                          ? 'border-[var(--accent)] bg-gradient-to-r from-[var(--accent)]/10 to-green-500/10 text-[var(--accent)] font-semibold shadow-[var(--accent)]/10 shadow-md'
                          : 'border-[var(--border)] hover:border-[var(--accent)] hover:border-opacity-50 hover:shadow-md hover:bg-[var(--card-hover)]'
                      } transition-all duration-200 font-medium`}
                    >
                      {side.charAt(0).toUpperCase() + side.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between text-sm text-[var(--text-secondary)] px-1">
                <span>House Edge: 5%</span>
                <span>Payout: 1.95x</span>
              </div>

              <button
                onClick={handleFlip}
                disabled={!connected || isFlipping || isLoading}
                className={`w-full py-3 rounded-lg font-medium transition-all shadow-lg ${
                  !connected
                    ? 'bg-gray-600 text-white cursor-not-allowed'
                    : isFlipping || isLoading
                    ? 'bg-[var(--accent)] bg-opacity-70 text-white cursor-not-allowed animate-pulse'
                    : 'bg-[var(--accent)] text-white hover:bg-[var(--accent)] hover:brightness-110 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transform'
                }`}
              >
                {!connected
                  ? 'Connect Wallet'
                  : isFlipping
                  ? 'Flipping...'
                  : isLoading
                  ? 'Processing...'
                  : 'Flip Coin'}
              </button>
            </div>
          </div>

          {showProvableFairness && (
            <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
              <h3 className="text-xl font-bold mb-4">Provably Fair System</h3>
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Our games use a provably fair system that ensures the outcome cannot be manipulated.
                  The result is determined by combining a server seed (kept secret until after the bet)
                  and your client seed.
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Your Client Seed</h4>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={clientSeed.value}
                      readOnly
                      className="w-full px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm"
                    />
                    <button
                      onClick={() => useProvableFairnessStore.getState().setClientSeed(generateRandomString(16))}
                      className="px-3 py-1.5 rounded-lg bg-[var(--card-hover)] text-sm"
                    >
                      Change
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Current Server Seed (Hashed)</h4>
                  <input
                    type="text"
                    value={getActiveServerSeed()?.hashed || 'No active seed'}
                    readOnly
                    className="w-full px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm"
                  />
                </div>

                <a
                  href="https://github.com/your-repo/provably-fair-docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-sm text-[var(--accent)] hover:underline"
                >
                  <span>Learn more about our provably fair system</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
            <h3 className="text-xl font-bold mb-4">Game History</h3>
            <div className="space-y-3">
              {gameHistory.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between py-3 px-3 border-b border-[var(--border)] last:border-0 hover:bg-[var(--card-hover)] rounded-lg transition-colors"
                >
                  <div>
                    <p className="font-medium flex items-center">
                      <span className={`inline-block w-6 h-6 rounded-full mr-2 ${
                        game.prediction === 'heads' ? 'bg-blue-500' : 'bg-purple-500'
                      } flex items-center justify-center text-xs text-white font-bold`}>
                        {game.prediction.charAt(0).toUpperCase()}
                      </span>
                      <span className="mr-2">{game.prediction.toUpperCase()}</span>
                      <span className="text-[var(--text-secondary)] mx-1">→</span>
                      <span className={`inline-block w-6 h-6 rounded-full ml-1 mr-2 ${
                        game.result === 'heads' ? 'bg-blue-500' : 'bg-purple-500'
                      } flex items-center justify-center text-xs text-white font-bold`}>
                        {game.result.charAt(0).toUpperCase()}
                      </span>
                      <span>{game.result.toUpperCase()}</span>
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-[var(--text-secondary)] mt-1">
                      <p>Bet: {game.bet} SOL</p>
                      {game.txSignature && (
                        <a
                          href={`https://explorer.solana.com/tx/${game.txSignature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-[var(--accent)] hover:underline"
                        >
                          <span>View TX</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${
                      game.won
                        ? 'bg-gradient-to-r from-green-500/20 to-green-400/20 text-green-400 border border-green-500/20'
                        : 'bg-gradient-to-r from-red-500/20 to-red-400/20 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {game.won ? `+${(parseFloat(game.bet) * 1.95).toFixed(2)} SOL` : 'Lost'}
                  </span>
                </div>
              ))}
              {gameHistory.length === 0 && (
                <p className="text-[var(--text-secondary)] text-center py-4">
                  No games played yet
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="sticky top-24 space-y-8 w-full">
            <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)] flex flex-col items-center">
              <div className="relative w-48 h-48 mb-6">
                <AnimatePresence>
                  {isFlipping ? (
                    <motion.div
                      key="flipping"
                      className="absolute inset-0 flex items-center justify-center"
                      animate={{
                        rotateX: [0, 720],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 2,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[var(--accent)] to-green-600 flex items-center justify-center shadow-lg shadow-[var(--accent)]/20">
                        <Coins className="w-16 h-16 text-white drop-shadow-md" />
                      </div>
                    </motion.div>
                  ) : result ? (
                    <motion.div
                      key="result"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-4xl font-bold bg-gradient-to-r from-[var(--accent)] to-green-500 bg-clip-text text-transparent drop-shadow-sm mb-2">
                          {result.toUpperCase()}
                        </div>
                        <div className="text-sm text-[var(--text-secondary)]">
                          {result === prediction ? 'You won!' : 'Try again!'}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      className="absolute inset-0 flex items-center justify-center"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[var(--accent)]/20 to-green-600/20 flex items-center justify-center border border-[var(--accent)]/30 shadow-lg shadow-[var(--accent)]/5">
                        <Coins className="w-16 h-16 text-[var(--accent)] drop-shadow-md" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Coin Flip</h3>
                <p className="text-[var(--text-secondary)] text-sm">
                  50/50 chance to win with 1.95x payout
                </p>
              </div>
            </div>

            <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
              <h3 className="text-xl font-bold mb-4">Game Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Total Bets</span>
                  <span className="font-medium">{gameHistory.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Win Rate</span>
                  <span className="font-medium">
                    {gameHistory.length > 0
                      ? `${((gameHistory.filter(g => g.won).length / gameHistory.length) * 100).toFixed(1)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Biggest Win</span>
                  <span className="font-medium text-green-400">
                    {gameHistory.filter(g => g.won).length > 0
                      ? `${(Math.max(...gameHistory.filter(g => g.won).map(g => parseFloat(g.bet))) * 1.95).toFixed(2)} SOL`
                      : '0 SOL'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to generate random string
function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export default CoinFlip;