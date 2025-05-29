import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Info, Settings, History, TrendingUp, Volume2, VolumeX } from 'lucide-react';
import { useEnhancedGame } from '../../hooks/useEnhancedGame';
import { toast } from 'react-hot-toast';

interface CoinFlipState {
  prediction: 'heads' | 'tails';
  betAmount: string;
  autoPlay: boolean;
  autoPlayGames: number;
  stopOnWin: boolean;
  stopOnLoss: boolean;
  showStats: boolean;
  showHistory: boolean;
  showProvableFair: boolean;
}

const EnhancedCoinFlip: React.FC = () => {
  const [state, setState] = useState<CoinFlipState>({
    prediction: 'heads',
    betAmount: '0.1',
    autoPlay: false,
    autoPlayGames: 10,
    stopOnWin: false,
    stopOnLoss: false,
    showStats: false,
    showHistory: false,
    showProvableFair: false,
  });

  const {
    gameState,
    gameHistory,
    gameStats,
    balance,
    isLoading,
    isConnected,
    soundEnabled,
    placeBet,
    setSoundEnabled,
  } = useEnhancedGame('coinflip');

  // Memoized calculations
  const betAmountNum = useMemo(() => parseFloat(state.betAmount) || 0, [state.betAmount]);
  const canPlay = useMemo(() => 
    isConnected && 
    !gameState.isPlaying && 
    betAmountNum > 0 && 
    (balance === null || betAmountNum <= balance),
    [isConnected, gameState.isPlaying, betAmountNum, balance]
  );

  const potentialWin = useMemo(() => betAmountNum * 1.95, [betAmountNum]);

  // Handle coin flip
  const handleFlip = useCallback(async () => {
    if (!canPlay) return;

    try {
      await placeBet(betAmountNum, { choice: state.prediction });
    } catch (error) {
      console.error('Failed to place bet:', error);
    }
  }, [canPlay, betAmountNum, state.prediction, placeBet]);

  // Handle auto-play
  const handleAutoPlay = useCallback(async () => {
    if (!canPlay) return;

    setState(prev => ({ ...prev, autoPlay: true }));
    
    try {
      // Implementation for auto-play would go here
      // This would involve multiple consecutive bets
    } catch (error) {
      console.error('Auto-play failed:', error);
    } finally {
      setState(prev => ({ ...prev, autoPlay: false }));
    }
  }, [canPlay]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      
      switch (event.key.toLowerCase()) {
        case ' ':
        case 'enter':
          event.preventDefault();
          if (canPlay) handleFlip();
          break;
        case 'h':
          setState(prev => ({ ...prev, prediction: 'heads' }));
          break;
        case 't':
          setState(prev => ({ ...prev, prediction: 'tails' }));
          break;
        case 'm':
          setSoundEnabled(!soundEnabled);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [canPlay, handleFlip, soundEnabled, setSoundEnabled]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Coins className="w-8 h-8 text-[var(--accent)]" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-[var(--accent)] bg-clip-text text-transparent">
            Enhanced Coin Flip
          </h1>
        </div>
        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
          Experience the ultimate coin flip game with provably fair results, real-time animations, 
          and comprehensive statistics. Choose heads or tails and win 1.95x your bet!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Game Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Game Interface */}
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-8">
            {/* Coin Animation */}
            <div className="flex justify-center mb-8">
              <motion.div
                className="relative w-40 h-40 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 flex items-center justify-center text-6xl font-bold shadow-2xl"
                animate={gameState.isAnimating ? {
                  rotateY: [0, 180, 360, 540, 720, 900, 1080],
                  scale: [1, 1.1, 1, 1.1, 1, 1.1, 1],
                  boxShadow: [
                    '0 10px 30px rgba(255, 215, 0, 0.3)',
                    '0 20px 60px rgba(255, 215, 0, 0.6)',
                    '0 10px 30px rgba(255, 215, 0, 0.3)',
                  ],
                } : {}}
                transition={{
                  duration: 3,
                  ease: "easeInOut",
                }}
                style={{
                  background: gameState.isAnimating 
                    ? 'linear-gradient(45deg, #ffd700, #ffed4e, #ffd700, #ffed4e)'
                    : undefined,
                  backgroundSize: gameState.isAnimating ? '400% 400%' : undefined,
                  animation: gameState.isAnimating ? 'gradient 0.5s ease infinite' : undefined,
                }}
              >
                <AnimatePresence mode="wait">
                  {gameState.result ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="text-center"
                    >
                      <div className="text-4xl mb-2">
                        {gameState.result.outcome === 'heads' ? '👑' : '🦅'}
                      </div>
                      <div className="text-sm font-medium text-white">
                        {gameState.result.outcome}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="coin"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      🪙
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Game Controls */}
            <div className="space-y-6">
              {/* Bet Amount */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Bet Amount (SOL)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={state.betAmount}
                    onChange={(e) => setState(prev => ({ ...prev, betAmount: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none transition-colors text-lg"
                    min="0.01"
                    step="0.01"
                    disabled={gameState.isPlaying}
                    placeholder="0.00"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]">
                    SOL
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-sm text-[var(--text-secondary)]">
                  <span>Balance: {balance?.toFixed(4) || '0.0000'} SOL</span>
                  <span>Potential Win: {potentialWin.toFixed(4)} SOL</span>
                </div>
              </div>

              {/* Quick Bet Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[0.01, 0.1, 1, 10].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setState(prev => ({ ...prev, betAmount: amount.toString() }))}
                    className="py-2 px-3 rounded-lg bg-[var(--card-hover)] hover:bg-[var(--accent)]/20 transition-colors text-sm font-medium"
                    disabled={gameState.isPlaying}
                  >
                    {amount} SOL
                  </button>
                ))}
              </div>

              {/* Prediction Selection */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
                  Your Prediction
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setState(prev => ({ ...prev, prediction: 'heads' }))}
                    className={`py-4 px-6 rounded-xl font-medium transition-all transform hover:scale-105 ${
                      state.prediction === 'heads'
                        ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/25'
                        : 'bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                    disabled={gameState.isPlaying}
                  >
                    <div className="text-3xl mb-2">👑</div>
                    <div>Heads</div>
                  </button>
                  <button
                    onClick={() => setState(prev => ({ ...prev, prediction: 'tails' }))}
                    className={`py-4 px-6 rounded-xl font-medium transition-all transform hover:scale-105 ${
                      state.prediction === 'tails'
                        ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/25'
                        : 'bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                    disabled={gameState.isPlaying}
                  >
                    <div className="text-3xl mb-2">🦅</div>
                    <div>Tails</div>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleFlip}
                  disabled={!canPlay || isLoading}
                  className="w-full py-4 px-6 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg transition-all transform hover:scale-105 active:scale-95"
                >
                  {gameState.isPlaying ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Flipping...</span>
                    </div>
                  ) : (
                    'Flip Coin'
                  )}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setState(prev => ({ ...prev, betAmount: (betAmountNum * 2).toString() }))}
                    className="py-2 px-4 rounded-lg bg-[var(--card-hover)] hover:bg-[var(--accent)]/20 transition-colors font-medium"
                    disabled={gameState.isPlaying}
                  >
                    Double
                  </button>
                  <button
                    onClick={() => setState(prev => ({ ...prev, betAmount: (betAmountNum / 2).toString() }))}
                    className="py-2 px-4 rounded-lg bg-[var(--card-hover)] hover:bg-[var(--accent)]/20 transition-colors font-medium"
                    disabled={gameState.isPlaying}
                  >
                    Half
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Game Result */}
          <AnimatePresence>
            {gameState.result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-6 rounded-xl border-2 ${
                  gameState.result.won 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="text-center space-y-3">
                  <div className="text-4xl">
                    {gameState.result.won ? '🎉' : '😔'}
                  </div>
                  <div className="text-xl font-bold">
                    {gameState.result.won ? 'You Won!' : 'You Lost!'}
                  </div>
                  <div className="text-lg">
                    Result: <span className="font-bold capitalize">{gameState.result.outcome}</span>
                  </div>
                  {gameState.result.won && (
                    <div className="text-lg text-green-400">
                      Payout: <span className="font-bold">{gameState.result.payout} SOL</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-[var(--accent)]" />
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Games Played</span>
                <span className="font-medium">{gameStats.totalGames}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Win Rate</span>
                <span className="font-medium">{gameStats.winRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Total Wagered</span>
                <span className="font-medium">{gameStats.totalWagered.toFixed(4)} SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Profit/Loss</span>
                <span className={`font-medium ${gameStats.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {gameStats.profitLoss >= 0 ? '+' : ''}{gameStats.profitLoss.toFixed(4)} SOL
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Current Streak</span>
                <span className={`font-medium ${gameStats.currentStreak >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {gameStats.currentStreak >= 0 ? '+' : ''}{gameStats.currentStreak}
                </span>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-[var(--accent)]" />
              Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Sound Effects</span>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2 rounded-lg transition-colors ${
                    soundEnabled ? 'bg-[var(--accent)] text-white' : 'bg-[var(--card-hover)]'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-[var(--text-secondary)]">Keyboard Shortcuts</div>
                <div className="text-xs space-y-1 text-[var(--text-secondary)]">
                  <div>Space/Enter: Flip coin</div>
                  <div>H: Select heads</div>
                  <div>T: Select tails</div>
                  <div>M: Toggle sound</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Games */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <History className="w-5 h-5 mr-2 text-[var(--accent)]" />
              Recent Games
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {gameHistory.slice(0, 10).map((game, index) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-[var(--background)]"
                >
                  <div className="flex items-center space-x-2">
                    <div className="text-lg">
                      {game.result.outcome === 'heads' ? '👑' : '🦅'}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">{game.betAmount} SOL</div>
                      <div className="text-[var(--text-secondary)]">
                        {new Date(game.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${game.won ? 'text-green-400' : 'text-red-400'}`}>
                    {game.won ? `+${game.payout.toFixed(4)}` : `-${game.betAmount.toFixed(4)}`}
                  </div>
                </div>
              ))}
              {gameHistory.length === 0 && (
                <div className="text-center text-[var(--text-secondary)] py-4">
                  No games played yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Provably Fair Info */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center">
            <Info className="w-5 h-5 mr-2 text-[var(--accent)]" />
            Provably Fair Gaming
          </h3>
          <button
            onClick={() => setState(prev => ({ ...prev, showProvableFair: !prev.showProvableFair }))}
            className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
          >
            {state.showProvableFair ? 'Hide' : 'Show'} Details
          </button>
        </div>
        
        <p className="text-[var(--text-secondary)] mb-4">
          Every game result is cryptographically verifiable. We use a combination of server seed, 
          client seed, and nonce to generate truly random and fair outcomes.
        </p>
        
        <AnimatePresence>
          {state.showProvableFair && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-2">How it works:</div>
                  <ol className="text-sm text-[var(--text-secondary)] space-y-1 list-decimal list-inside">
                    <li>Server generates a secret seed and shares its hash</li>
                    <li>You provide a client seed (or we generate one)</li>
                    <li>Game result is calculated using both seeds + nonce</li>
                    <li>After the game, server seed is revealed for verification</li>
                  </ol>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Verification:</div>
                  <div className="text-sm text-[var(--text-secondary)] space-y-1">
                    <div>• Results are deterministic and reproducible</div>
                    <div>• Server cannot manipulate outcomes</div>
                    <div>• You can verify every game independently</div>
                    <div>• Full transparency and fairness guaranteed</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EnhancedCoinFlip;
