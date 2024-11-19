import React, { useState } from 'react';
import { Dices, MessageSquare, Coins } from 'lucide-react';
import CoinFlip from '../components/games/CoinFlip';
import DiceRoll from '../components/games/DiceRoll';

const Games = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const games = [
    {
      id: 'coin-flip',
      title: "Coin Flip",
      description: "50/50 chance to double your tokens",
      icon: <Coins className="w-12 h-12" />,
      platforms: ['dApp', 'Telegram'],
      component: <CoinFlip />
    },
    {
      id: 'dice-roll',
      title: "Dice Roll",
      description: "Roll under or over a target number",
      icon: <Dices className="w-12 h-12" />,
      platforms: ['dApp', 'Telegram'],
      component: <DiceRoll />
    },
    {
      id: 'chat-roulette',
      title: "Chat Roulette",
      description: "Community-based roulette in Telegram groups",
      icon: <MessageSquare className="w-12 h-12" />,
      platforms: ['Telegram'],
      component: <div>Chat Roulette Coming Soon</div>
    }
  ];

  if (selectedGame) {
    const game = games.find(g => g.id === selectedGame);
    if (!game) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{game.title}</h1>
          <button
            onClick={() => setSelectedGame(null)}
            className="px-4 py-2 rounded-lg bg-[var(--card)] hover:bg-[var(--card-hover)] transition-colors"
          >
            Back to Games
          </button>
        </div>
        {game.component}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Casino Games</h1>
        <p className="text-[var(--text-secondary)]">
          Choose from our selection of provably fair games. Play directly in the dApp or through our Telegram bot.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => setSelectedGame(game.id)}
            className="text-left bg-black/20 backdrop-blur rounded-xl p-6 border border-white/10 hover:border-[var(--accent)]/50 transition-colors group"
          >
            <div className="text-[var(--accent)] mb-4 group-hover:scale-110 transition-transform">
              {game.icon}
            </div>
            <h3 className="text-xl font-bold mb-2">{game.title}</h3>
            <p className="text-[var(--text-secondary)] mb-4">{game.description}</p>
            <div className="flex flex-wrap gap-2">
              {game.platforms.map((platform) => (
                <span
                  key={platform}
                  className="px-3 py-1 rounded-full text-sm bg-[var(--accent)]/20 text-[var(--accent)]"
                >
                  {platform}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Games;