import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Settings, Coins, MessageSquare } from 'lucide-react';

const CasinoCreator = () => {
  const { connected } = useWallet();
  const [step, setStep] = useState(1);

  if (!connected) {
    return (
      <div className="text-center py-20">
        <h1 className="text-4xl font-bold mb-6">Connect Your Wallet</h1>
        <p className="text-gray-400">You need to connect your wallet to create a casino</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Create Your Casino</h1>
        <p className="text-gray-400">
          Launch your own casino for your Solana or SPL tokens in minutes
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="flex items-center">
          {[1, 2, 3].map((i) => (
            <React.Fragment key={i}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= i ? 'bg-purple-500' : 'bg-gray-700'
                }`}
              >
                {i}
              </div>
              {i < 3 && (
                <div
                  className={`w-20 h-1 ${
                    step > i ? 'bg-purple-500' : 'bg-gray-700'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {step === 1 && <TokenSetup />}
      {step === 2 && <GameSettings />}
      {step === 3 && <BotConfiguration />}

      <div className="flex justify-between">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          className={`px-6 py-2 rounded-lg ${
            step === 1
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-purple-500 hover:bg-purple-600'
          }`}
          disabled={step === 1}
        >
          Previous
        </button>
        <button
          onClick={() => setStep(Math.min(3, step + 1))}
          className="px-6 py-2 rounded-lg bg-purple-500 hover:bg-purple-600"
        >
          {step === 3 ? 'Launch Casino' : 'Next'}
        </button>
      </div>
    </div>
  );
};

const TokenSetup = () => (
  <div className="bg-black/20 backdrop-blur rounded-xl p-6 border border-white/10">
    <div className="flex items-center space-x-4 mb-6">
      <Coins className="w-8 h-8 text-purple-400" />
      <h2 className="text-2xl font-bold">Token Setup</h2>
    </div>
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Token Address
        </label>
        <input
          type="text"
          className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 focus:border-purple-500 focus:outline-none"
          placeholder="Enter your token's address"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          House Wallet
        </label>
        <input
          type="text"
          className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 focus:border-purple-500 focus:outline-none"
          placeholder="Enter house wallet address"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Initial Liquidity (tokens)
        </label>
        <input
          type="number"
          className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 focus:border-purple-500 focus:outline-none"
          placeholder="Enter amount"
        />
      </div>
    </div>
  </div>
);

const GameSettings = () => (
  <div className="bg-black/20 backdrop-blur rounded-xl p-6 border border-white/10">
    <div className="flex items-center space-x-4 mb-6">
      <Settings className="w-8 h-8 text-purple-400" />
      <h2 className="text-2xl font-bold">Game Settings</h2>
    </div>
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Maximum Bet (tokens)
        </label>
        <input
          type="number"
          className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 focus:border-purple-500 focus:outline-none"
          placeholder="Enter maximum bet amount"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          House Edge (%)
        </label>
        <input
          type="number"
          className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 focus:border-purple-500 focus:outline-none"
          placeholder="Enter house edge percentage"
        />
      </div>
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-400">
          Enabled Games
        </label>
        <div className="space-y-2">
          {['Coin Flip', 'Dice Roll', 'Chat Roulette'].map((game) => (
            <label key={game} className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
              />
              <span>{game}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const BotConfiguration = () => (
  <div className="bg-black/20 backdrop-blur rounded-xl p-6 border border-white/10">
    <div className="flex items-center space-x-4 mb-6">
      <MessageSquare className="w-8 h-8 text-purple-400" />
      <h2 className="text-2xl font-bold">Telegram Bot Setup</h2>
    </div>
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Bot Token
        </label>
        <input
          type="text"
          className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 focus:border-purple-500 focus:outline-none"
          placeholder="Enter your Telegram bot token"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Welcome Message
        </label>
        <textarea
          className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 focus:border-purple-500 focus:outline-none"
          rows={4}
          placeholder="Enter welcome message for your bot"
        />
      </div>
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-400">
          Bot Features
        </label>
        <div className="space-y-2">
          {[
            'Group Chat Games',
            'Private Games',
            'Token Balance Checking',
            'Leaderboard',
          ].map((feature) => (
            <label key={feature} className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
              />
              <span>{feature}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default CasinoCreator;