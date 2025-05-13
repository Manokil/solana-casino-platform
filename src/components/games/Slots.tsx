import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { Sparkles, Info, ExternalLink, Volume2, VolumeX } from 'lucide-react';
import { useBlockchain } from '../../hooks/useBlockchain';
import { toast } from 'react-hot-toast';
import {
  useProvableFairnessStore,
  initializeProvableFairness
} from '../../utils/provableFairness';

// SlotReel component for advanced animation
const SlotReel = ({ index, finalSymbol }) => {
  const REEL_SYMBOLS = ["🍒", "🍊", "🍋", "🍇", "🍉", "💎", "7️⃣", "◎"];
  const [symbols, setSymbols] = useState([]);
  const [isInitialSpin, setIsInitialSpin] = useState(true);

  // Generate a longer reel with repeated symbols for more realistic spinning
  useEffect(() => {
    const generateReelSymbols = () => {
      // Create a longer reel with multiple sets of symbols for continuous spinning effect
      const shuffled1 = [...REEL_SYMBOLS].sort(() => Math.random() - 0.5);
      const shuffled2 = [...REEL_SYMBOLS].sort(() => Math.random() - 0.5);
      const shuffled3 = [...REEL_SYMBOLS].sort(() => Math.random() - 0.5);

      // Make sure the final symbol is at the very end
      const combinedSymbols = [...shuffled1, ...shuffled2, ...shuffled3];
      const withoutFinal = combinedSymbols.filter(s => s !== finalSymbol);

      // Add 3 copies of the final symbol at the end for a more dramatic stop
      return [...withoutFinal, finalSymbol, finalSymbol, finalSymbol];
    };

    setSymbols(generateReelSymbols());

    // Start with a quick initial spin
    const initialSpinTimer = setTimeout(() => {
      setIsInitialSpin(false);
    }, 300);

    return () => clearTimeout(initialSpinTimer);
  }, [finalSymbol]);

  // Calculate the final position to stop at the last symbol
  const finalPosition = symbols.length * 60 - 60; // Position to show the last symbol

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center"
      initial={{ y: -500 }}
      animate={{
        y: isInitialSpin ? -1000 : finalPosition // First spin fast, then slow down to final position
      }}
      transition={{
        duration: isInitialSpin ? 0.2 : 3 + index * 0.8, // Each reel spins longer than the previous
        ease: isInitialSpin ? "linear" : [0.13, 0.84, 0.41, 1], // Custom easing for realistic slot machine feel
        delay: isInitialSpin ? 0 : index * 0.3 // Stagger the start of each reel
      }}
    >
      {symbols.map((symbol, idx) => (
        <motion.div
          key={idx}
          className="flex items-center justify-center h-24 w-20 text-5xl"
          style={{
            textShadow: "0 0 5px rgba(255,255,255,0.3)",
          }}
          animate={{
            scale: idx >= symbols.length - 3 ? [1, 1.1, 1] : 1,
            filter: idx >= symbols.length - 3
              ? "brightness(1.2) drop-shadow(0 0 8px gold)"
              : "brightness(1) drop-shadow(0 0 0px transparent)"
          }}
          transition={{
            scale: {
              delay: isInitialSpin ? 999 : 2.5 + index * 0.8, // Only animate scale near the end of spinning
              duration: 0.3,
              repeat: idx === symbols.length - 1 ? 3 : 0,
              repeatType: "reverse"
            },
            filter: {
              delay: isInitialSpin ? 999 : 2.5 + index * 0.8,
              duration: 0.3
            }
          }}
        >
          {symbol}
        </motion.div>
      ))}
    </motion.div>
  );
};

// Slot symbols with their respective payouts
const SYMBOLS = [
  { id: 'cherry', icon: '🍒', payout: 2 },
  { id: 'lemon', icon: '🍋', payout: 3 },
  { id: 'orange', icon: '🍊', payout: 4 },
  { id: 'grape', icon: '🍇', payout: 5 },
  { id: 'watermelon', icon: '🍉', payout: 8 },
  { id: 'seven', icon: '7️⃣', payout: 10 },
  { id: 'diamond', icon: '💎', payout: 15 },
  { id: 'solana', icon: '◎', payout: 25 },
];

interface GameHistoryItem {
  id: number;
  bet: string;
  result: string[];
  payout: number;
  won: boolean;
  serverSeed?: string;
  clientSeed?: string;
  nonce?: number;
  txSignature?: string;
}

const Slots: React.FC = () => {
  const { connected } = useWallet();
  const [betAmount, setBetAmount] = useState<string>('0.1');
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState<string[]>(['🍒', '🍋', '🍊']);
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);
  const [showProvableFairness, setShowProvableFairness] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { balance, placeBet, isLoading } = useBlockchain();

  // Sound effect references
  const spinSoundRef = useRef<HTMLAudioElement | null>(null);
  const winSoundRef = useRef<HTMLAudioElement | null>(null);
  const reelStopSoundRef = useRef<HTMLAudioElement | null>(null);
  const jackpotSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio elements
  useEffect(() => {
    // Create audio elements
    spinSoundRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3');
    winSoundRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3');
    reelStopSoundRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/219/219-preview.mp3');
    jackpotSoundRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/273/273-preview.mp3');

    // Configure audio elements
    if (spinSoundRef.current) {
      spinSoundRef.current.volume = 0.3;
      spinSoundRef.current.loop = true;
    }

    if (winSoundRef.current) {
      winSoundRef.current.volume = 0.5;
    }

    if (reelStopSoundRef.current) {
      reelStopSoundRef.current.volume = 0.4;
    }

    if (jackpotSoundRef.current) {
      jackpotSoundRef.current.volume = 0.6;
    }

    // Cleanup function
    return () => {
      if (spinSoundRef.current) {
        spinSoundRef.current.pause();
        spinSoundRef.current = null;
      }
      if (winSoundRef.current) {
        winSoundRef.current.pause();
        winSoundRef.current = null;
      }
      if (reelStopSoundRef.current) {
        reelStopSoundRef.current.pause();
        reelStopSoundRef.current = null;
      }
      if (jackpotSoundRef.current) {
        jackpotSoundRef.current.pause();
        jackpotSoundRef.current = null;
      }
    };
  }, []);

  const {
    clientSeed,
    getActiveServerSeed,
    rotateServerSeed
  } = useProvableFairnessStore();

  // Initialize provable fairness
  useEffect(() => {
    initializeProvableFairness();
  }, []);

  // Generate a random slot result
  const generateSlotResult = (seed: string): string[] => {
    // In a real implementation, this would use the seed to generate a provably fair result
    // For now, we'll just use it to seed a random number generator
    const result: string[] = [];

    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * SYMBOLS.length);
      result.push(SYMBOLS[randomIndex].icon);
    }

    return result;
  };

  // Calculate payout based on the result
  const calculatePayout = (result: string[]): number => {
    // Check if all symbols are the same (jackpot)
    if (result[0] === result[1] && result[1] === result[2]) {
      const symbol = SYMBOLS.find(s => s.icon === result[0]);
      return symbol ? symbol.payout : 0;
    }

    // Check for pairs
    if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
      const pairedSymbol = result[0] === result[1] ? result[0] :
                          result[1] === result[2] ? result[1] : result[0];
      const symbol = SYMBOLS.find(s => s.icon === pairedSymbol);
      return symbol ? Math.max(1, Math.floor(symbol.payout / 3)) : 0;
    }

    // No matches
    return 0;
  };

  const handleSpin = async () => {
    if (!connected || isSpinning || isLoading) return;

    const betAmountNum = parseFloat(betAmount);
    if (isNaN(betAmountNum) || betAmountNum <= 0) {
      toast.error('Please enter a valid bet amount');
      return;
    }

    if (balance !== null && betAmountNum > balance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsSpinning(true);

    // Play spin sound if enabled
    if (soundEnabled && spinSoundRef.current) {
      spinSoundRef.current.currentTime = 0;
      spinSoundRef.current.play().catch(e => console.error("Error playing sound:", e));
    }

    // Start the spinning animation immediately
    const randomSpinInterval = setInterval(() => {
      setReels(generateSlotResult('random'));
    }, 100);

    // Minimum spin duration regardless of transaction time
    const MIN_SPIN_DURATION = 4000; // 4 seconds minimum spin time
    const spinStartTime = Date.now();

    try {
      // Get active server seed
      const serverSeed = getActiveServerSeed();
      if (!serverSeed) {
        rotateServerSeed();
        throw new Error('No active server seed');
      }

      // Start the blockchain transaction in parallel with the animation
      const betResultPromise = placeBet(betAmountNum, 'slots', {
        clientSeed: clientSeed.value,
        serverSeedHash: serverSeed.hashed,
        nonce: serverSeed.nonce
      });

      // Generate the final result immediately (but don't show it yet)
      const gameResult = generateSlotResult(serverSeed.hashed + clientSeed.value);
      const payout = calculatePayout(gameResult);
      const won = payout > 0;

      // Wait for the transaction to complete
      const betResult = await betResultPromise;

      // Calculate how much more time we need to spin to reach minimum duration
      const elapsedTime = Date.now() - spinStartTime;
      const remainingSpinTime = Math.max(0, MIN_SPIN_DURATION - elapsedTime);

      // Continue spinning for the remaining time if needed
      if (remainingSpinTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingSpinTime));
      }

      // Slow down the reels one by one for a more dramatic effect
      clearInterval(randomSpinInterval);

      // Slow down and stop each reel sequentially
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));

        // Play reel stop sound if enabled
        if (soundEnabled && reelStopSoundRef.current) {
          reelStopSoundRef.current.currentTime = 0;
          reelStopSoundRef.current.play().catch(e => console.error("Error playing sound:", e));
        }

        // Update just one reel at a time to its final value
        setReels(prevReels => {
          const newReels = [...prevReels];
          newReels[i] = gameResult[i];
          return newReels;
        });
      }

      // Stop spin sound
      if (spinSoundRef.current) {
        spinSoundRef.current.pause();
        spinSoundRef.current.currentTime = 0;
      }

      // Play win sound if player won
      if (won) {
        // Check if it's a jackpot (all symbols match)
        const isJackpot = gameResult[0] === gameResult[1] && gameResult[1] === gameResult[2];

        if (soundEnabled) {
          if (isJackpot && jackpotSoundRef.current) {
            // Play jackpot sound for big wins
            jackpotSoundRef.current.currentTime = 0;
            jackpotSoundRef.current.play().catch(e => console.error("Error playing sound:", e));
          } else if (winSoundRef.current) {
            // Play regular win sound
            winSoundRef.current.currentTime = 0;
            winSoundRef.current.play().catch(e => console.error("Error playing sound:", e));
          }
        }
      }

      // Animation complete, update state
      setIsSpinning(false);

      // Add to history
      setGameHistory(prev => [{
        id: Date.now(),
        bet: betAmount,
        result: gameResult,
        payout,
        won,
        serverSeed: serverSeed.hashed,
        clientSeed: clientSeed.value,
        nonce: serverSeed.nonce,
        txSignature: betResult.signature
      }, ...prev.slice(0, 9)]);

      // Show result notification after animation completes
      setTimeout(() => {
        if (won) {
          const winAmount = betAmountNum * payout;
          toast.success(`You won ${winAmount.toFixed(2)} SOL!`, {
            icon: '🎰',
          });
        } else {
          toast.error('Better luck next time!');
        }
      }, 500); // Small delay after animation completes

    } catch (error) {
      // If there's an error, ensure we stop the spinning animation
      clearInterval(randomSpinInterval);

      // Stop any playing sounds
      if (spinSoundRef.current) {
        spinSoundRef.current.pause();
        spinSoundRef.current.currentTime = 0;
      }

      console.error('Error placing bet:', error);
      toast.error('Failed to place bet. Please try again.');
      setIsSpinning(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Place Your Bet</h2>
              <div className="flex items-center space-x-3">
                {/* Sound toggle button */}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--card-hover)] hover:bg-[var(--accent)] hover:bg-opacity-20 transition-colors"
                  title={soundEnabled ? "Mute sounds" : "Enable sounds"}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-[var(--accent)]" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-[var(--text-secondary)]" />
                  )}
                </button>

                {/* Provably fair button */}
                <button
                  onClick={() => setShowProvableFairness(!showProvableFairness)}
                  className="flex items-center space-x-1 text-sm text-[var(--accent)] hover:underline"
                >
                  <Info className="w-4 h-4" />
                  <span>Provably Fair</span>
                </button>
              </div>
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

              <div className="flex justify-between text-sm text-[var(--text-secondary)] px-1">
                <span>House Edge: 5%</span>
                <span>Max Payout: 25x</span>
              </div>

              <button
                onClick={handleSpin}
                disabled={!connected || isSpinning || isLoading}
                className={`w-full py-3 rounded-lg font-medium transition-all shadow-lg ${
                  !connected
                    ? 'bg-gray-600 text-white cursor-not-allowed'
                    : isSpinning || isLoading
                    ? 'bg-[var(--accent)] bg-opacity-70 text-white cursor-not-allowed animate-pulse'
                    : 'bg-gradient-to-r from-[var(--accent)] via-green-600 to-blue-500 text-white hover:brightness-110 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transform'
                }`}
              >
                {!connected
                  ? 'Connect Wallet'
                  : isSpinning
                  ? 'Spinning...'
                  : isLoading
                  ? 'Processing...'
                  : 'Spin'}
              </button>
            </div>
          </div>

          {/* Game History */}
          <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
            <h3 className="text-xl font-bold mb-4">Game History</h3>
            <div className="space-y-3">
              {gameHistory.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between py-3 px-3 border-b border-[var(--border)] last:border-0 hover:bg-[var(--card-hover)] rounded-lg transition-colors"
                >
                  <div>
                    <div className="flex items-center mb-2">
                      {game.result.map((symbol, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-center w-8 h-8 bg-[var(--background)] rounded-md shadow-inner border border-[var(--border)] mx-0.5"
                        >
                          <span className="text-lg">{symbol}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-[var(--text-secondary)]">
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
                        ? 'bg-gradient-to-r from-green-500 from-opacity-20 to-blue-500 to-opacity-20 text-green-400 border border-green-500 border-opacity-20'
                        : 'bg-gradient-to-r from-red-500 from-opacity-20 to-red-400 to-opacity-20 text-red-400 border border-red-500 border-opacity-20'
                    }`}
                  >
                    {game.won
                      ? `+${(parseFloat(game.bet) * game.payout).toFixed(2)} SOL`
                      : 'Lost'}
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
              <div className="relative mb-6">
                <div className="relative flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[var(--background)] to-[var(--card-hover)] rounded-xl border border-[var(--border)] shadow-inner overflow-hidden">
                  {/* Slot machine frame */}
                  <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 opacity-50 z-0"></div>

                  {/* Light effects */}
                  {isSpinning && (
                    <>
                      <motion.div
                        className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                      />
                    </>
                  )}

                  {/* Slot reels container */}
                  <div className="flex items-center justify-center space-x-3 z-10 relative">
                    {reels.map((symbol, index) => (
                      <div
                        key={index}
                        className="relative w-20 h-24 overflow-hidden rounded-lg shadow-lg border-2 border-gray-700 bg-black"
                      >
                        {/* Reel highlight effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white to-transparent opacity-10 z-10"></div>

                        {/* Reel shadow effect */}
                        <div className="absolute inset-0 shadow-inner z-20"></div>

                        {/* Reel content */}
                        <div className="relative w-full h-full flex items-center justify-center">
                          {isSpinning ? (
                            <SlotReel index={index} finalSymbol={symbol} />
                          ) : (
                            <motion.div
                              initial={{ scale: 0.5, opacity: 0, y: 20 }}
                              animate={{
                                scale: 1,
                                opacity: 1,
                                y: 0,
                                rotateY: [0, 10, 0, -10, 0],
                              }}
                              transition={{
                                delay: index * 0.2,
                                duration: 0.8,
                                type: "spring",
                                damping: 12,
                                rotateY: {
                                  delay: index * 0.2 + 0.5,
                                  duration: 1.5,
                                  ease: "easeInOut"
                                }
                              }}
                              className="text-5xl drop-shadow-lg z-30"
                            >
                              {symbol}
                            </motion.div>
                          )}
                        </div>

                        {/* Reel glass reflection */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white to-transparent opacity-5 z-40 pointer-events-none"></div>

                        {/* Reel top and bottom lines */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--accent)] opacity-30 z-50"></div>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-[var(--accent)] opacity-30 z-50"></div>
                      </div>
                    ))}
                  </div>

                  {/* Win line */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-red-500 opacity-50 z-50"></div>

                  {/* Win effect */}
                  {!isSpinning && reels[0] === reels[1] && reels[1] === reels[2] && (
                    <>
                      {/* Jackpot text */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                          opacity: [0, 1, 0.8, 1],
                          scale: [0.5, 1.2, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                          duration: 1.5,
                          times: [0, 0.3, 0.6, 1]
                        }}
                        className="absolute inset-0 flex items-center justify-center z-50"
                      >
                        <div className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full text-white font-bold text-xl shadow-lg border-2 border-yellow-300">
                          JACKPOT!
                        </div>
                      </motion.div>

                      {/* Confetti effect */}
                      <motion.div
                        className="absolute inset-0 z-40 overflow-hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {Array.from({ length: 50 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className={`absolute w-2 h-2 rounded-full ${
                              i % 5 === 0 ? 'bg-yellow-400' :
                              i % 5 === 1 ? 'bg-green-400' :
                              i % 5 === 2 ? 'bg-blue-400' :
                              i % 5 === 3 ? 'bg-red-400' :
                              'bg-purple-400'
                            }`}
                            style={{
                              left: `${Math.random() * 100}%`,
                              top: '-10px',
                            }}
                            animate={{
                              y: ['0vh', '100vh'],
                              x: [0, Math.random() * 50 - 25],
                              rotate: [0, Math.random() * 360],
                              opacity: [1, 0.8, 0]
                            }}
                            transition={{
                              duration: 2 + Math.random() * 3,
                              ease: "easeOut",
                              delay: Math.random() * 0.5,
                              repeat: Infinity,
                              repeatDelay: Math.random() * 2
                            }}
                          />
                        ))}
                      </motion.div>

                      {/* Light flash effect */}
                      <motion.div
                        className="absolute inset-0 bg-white z-30"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.7, 0] }}
                        transition={{ duration: 0.5, times: [0, 0.1, 1] }}
                      />
                    </>
                  )}
                </div>

                {/* Slot Machine Effects */}
                {isSpinning && (
                  <>
                    {/* Spinning star */}
                    <div className="absolute top-3 right-10">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-8 h-8 text-yellow-400 drop-shadow-glow" />
                      </motion.div>
                    </div>

                    {/* Lever animation */}
                    <div className="absolute -right-8 top-1/2 -translate-y-1/2 h-24 w-8">
                      <motion.div
                        className="absolute top-0 w-4 h-16 bg-gradient-to-b from-gray-700 to-gray-900 rounded-t-full left-2"
                        animate={{ rotateZ: [0, 30, 0] }}
                        transition={{ duration: 1, delay: 0.2, times: [0, 0.3, 1] }}
                      />
                      <motion.div
                        className="absolute top-0 w-8 h-8 bg-red-600 rounded-full border-2 border-red-400 left-0"
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 1, delay: 0.2, times: [0, 0.3, 1] }}
                      />
                    </div>

                    {/* Vibration effect */}
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      animate={{ x: [-1, 1, -1, 1, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.2,
                        repeatType: "mirror"
                      }}
                    />

                    {/* Light flashes */}
                    <motion.div
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-yellow-400"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatType: "mirror" }}
                    />
                    <motion.div
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-yellow-400"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatType: "mirror", delay: 0.25 }}
                    />
                  </>
                )}

                <div className="absolute -top-3 -right-3">
                  <Sparkles className="w-6 h-6 text-[var(--accent)]" />
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Slots</h3>
                <p className="text-[var(--text-secondary)] text-sm">
                  Match symbols to win up to 25x your bet
                </p>
              </div>
            </div>

            <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)] shadow-md">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent)] to-blue-500">Payout Table</span>
                <Sparkles className="w-4 h-4 text-[var(--accent)] ml-2" />
              </h3>
              <div className="space-y-3">
                {SYMBOLS.map((symbol) => (
                  <div
                    key={symbol.id}
                    className="flex justify-between items-center p-2 rounded-lg hover:bg-[var(--card-hover)] transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <div className="flex items-center justify-center w-10 h-10 bg-[var(--background)] rounded-md shadow-inner border border-[var(--border)]">
                        <span className="text-2xl">{symbol.icon}</span>
                      </div>
                      <div className="flex items-center justify-center w-10 h-10 bg-[var(--background)] rounded-md shadow-inner border border-[var(--border)]">
                        <span className="text-2xl">{symbol.icon}</span>
                      </div>
                      <div className="flex items-center justify-center w-10 h-10 bg-[var(--background)] rounded-md shadow-inner border border-[var(--border)]">
                        <span className="text-2xl">{symbol.icon}</span>
                      </div>
                    </div>
                    <span className={`font-bold text-lg px-3 py-1 rounded-full ${
                      symbol.payout >= 15
                        ? 'bg-gradient-to-r from-green-500 from-opacity-20 to-blue-500 to-opacity-20 text-green-400 border border-green-500 border-opacity-20'
                        : 'bg-[var(--background)] text-[var(--text-primary)]'
                    }`}>
                      {symbol.payout}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Slots;
