import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { Dices } from 'lucide-react';
import SHA256 from 'crypto-js/sha256';

const DiceRoll: React.FC = () => {
  const { connected } = useWallet();
  const [betAmount, setBetAmount] = useState<string>('0.1');
  const [isRolling, setIsRolling] = useState(false);
  const [targetNumber, setTargetNumber] = useState<number>(50);
  const [rollType, setRollType] = useState<'under' | 'over'>('under');
  const [result, setResult] = useState<number | null>(null);
  const [gameHistory, setGameHistory] = useState<Array<{
    id: number;
    bet: string;
    target: number;
    type: 'under' | 'over';
    result: number;
    won: boolean;
  }>>([]);

  const multiplier = 98 / (rollType === 'under' ? targetNumber : 100 - targetNumber);
  const winChance = rollType === 'under' ? targetNumber : 100 - targetNumber;

  const generateResult = () => {
    const serverSeed = SHA256(Date.now().toString()).toString();
    const clientSeed = SHA256(Math.random().toString()).toString();
    const combinedHash = SHA256(serverSeed + clientSeed).toString();
    return parseInt(combinedHash.substring(0, 8), 16) % 100 + 1;
  };

  const handleRoll = async () => {
    if (!connected || isRolling) return;

    setIsRolling(true);
    setResult(null);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const gameResult = generateResult();
    const won = rollType === 'under' 
      ? gameResult < targetNumber 
      : gameResult > targetNumber;

    setGameHistory(prev => [{
      id: Date.now(),
      bet: betAmount,
      target: targetNumber,
      type: rollType,
      result: gameResult,
      won
    }, ...prev.slice(0, 9)]);

    setTimeout(() => {
      setResult(gameResult);
      setIsRolling(false);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
            <h2 className="text-2xl font-bold mb-6">Place Your Bet</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Bet Amount (SOL)
                </label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none"
                  step="0.1"
                  min="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Target Number (1-99)
                </label>
                <input
                  type="range"
                  min="2"
                  max="98"
                  value={targetNumber}
                  onChange={(e) => setTargetNumber(parseInt(e.target.value))}
                  className="w-full h-2 bg-[var(--background)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-[var(--text-secondary)]">1</span>
                  <span className="text-sm font-medium">{targetNumber}</span>
                  <span className="text-sm text-[var(--text-secondary)]">100</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Roll Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {(['under', 'over'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setRollType(type)}
                      className={`px-4 py-2 rounded-lg border ${
                        rollType === type
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                          : 'border-[var(--border)] hover:border-[var(--accent)]/50'
                      } transition-colors`}
                    >
                      Roll {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                <span>Win Chance: {winChance}%</span>
                <span>Multiplier: {multiplier.toFixed(2)}x</span>
              </div>

              <button
                onClick={handleRoll}
                disabled={!connected || isRolling}
                className={`w-full py-3 rounded-lg font-medium transition-all ${
                  !connected
                    ? 'bg-gray-600 cursor-not-allowed'
                    : isRolling
                    ? 'bg-[var(--accent)]/50 cursor-not-allowed'
                    : 'bg-[var(--accent)] hover:opacity-90'
                }`}
              >
                {!connected ? 'Connect Wallet' : isRolling ? 'Rolling...' : 'Roll Dice'}
              </button>
            </div>
          </div>

          <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
            <h3 className="text-xl font-bold mb-4">Game History</h3>
            <div className="space-y-3">
              {gameHistory.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      Roll {game.type} {game.target} → {game.result}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Bet: {game.bet} SOL
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      game.won
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {game.won ? 'Won' : 'Lost'}
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

        <div className="flex items-center justify-center">
          <div className="relative w-48 h-48">
            <AnimatePresence>
              {isRolling ? (
                <motion.div
                  key="rolling"
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    ease: "easeInOut",
                    rotate: {
                      repeat: Infinity,
                      duration: 0.5,
                    },
                  }}
                >
                  <div className="w-32 h-32 rounded-xl bg-[var(--accent)] flex items-center justify-center">
                    <Dices className="w-16 h-16 text-white" />
                  </div>
                </motion.div>
              ) : result ? (
                <motion.div
                  key="result"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="text-4xl font-bold text-[var(--accent)]">
                    {result}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-32 h-32 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center">
                    <Dices className="w-16 h-16 text-[var(--accent)]" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiceRoll;