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
                      className={`px-4 py-2 rounded-lg border shadow-sm ${
                        rollType === type
                          ? 'border-[var(--accent)] bg-gradient-to-r from-[var(--accent)]/10 to-green-500/10 text-[var(--accent)] font-semibold shadow-[var(--accent)]/10 shadow-md'
                          : 'border-[var(--border)] hover:border-[var(--accent)] hover:border-opacity-50 hover:shadow-md hover:bg-[var(--card-hover)]'
                      } transition-all duration-200`}
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
                className={`w-full py-3 rounded-lg font-medium transition-all shadow-lg ${
                  !connected
                    ? 'bg-gray-600 text-white cursor-not-allowed'
                    : isRolling
                    ? 'bg-[var(--accent)] bg-opacity-70 text-white cursor-not-allowed animate-pulse'
                    : 'bg-gradient-to-r from-[var(--accent)] to-green-600 text-white hover:brightness-110 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transform'
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
                  className="flex items-center justify-between py-3 px-3 border-b border-[var(--border)] last:border-0 hover:bg-[var(--card-hover)] rounded-lg transition-colors"
                >
                  <div>
                    <p className="font-medium flex items-center">
                      <span className="mr-1">Roll</span>
                      <span className={`inline-block px-2 py-0.5 rounded mr-1 text-xs font-bold ${
                        game.type === 'under' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 'bg-purple-500/20 text-purple-400 border border-purple-500/20'
                      }`}>
                        {game.type.toUpperCase()}
                      </span>
                      <span className="font-bold mx-1">{game.target}</span>
                      <span className="text-[var(--text-secondary)] mx-1">→</span>
                      <span className={`font-bold mx-1 ${
                        game.won ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {game.result}
                      </span>
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Bet: {game.bet} SOL
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${
                      game.won
                        ? 'bg-gradient-to-r from-green-500/20 to-green-400/20 text-green-400 border border-green-500/20'
                        : 'bg-gradient-to-r from-red-500/20 to-red-400/20 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {game.won
                      ? `+${(parseFloat(game.bet) * multiplier).toFixed(2)} SOL`
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
                  <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-[var(--accent)] to-green-600 flex items-center justify-center shadow-lg shadow-[var(--accent)]/20 border border-white/10">
                    <Dices className="w-16 h-16 text-white drop-shadow-md" />
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
                    <div className="text-5xl font-bold bg-gradient-to-r from-[var(--accent)] to-green-500 bg-clip-text text-transparent drop-shadow-sm mb-2">
                      {result}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      {(rollType === 'under' && result < targetNumber) || (rollType === 'over' && result > targetNumber)
                        ? 'You won!'
                        : 'Try again!'}
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
                  <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-green-600/20 flex items-center justify-center border border-[var(--accent)]/30 shadow-lg shadow-[var(--accent)]/5">
                    <Dices className="w-16 h-16 text-[var(--accent)] drop-shadow-md" />
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