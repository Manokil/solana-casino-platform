import React, { useState } from 'react';
import { Dices, MessageSquare, Coins, Sparkles, Club } from 'lucide-react';
import CoinFlip from '../components/games/CoinFlip';
import DiceRoll from '../components/games/DiceRoll';
import Slots from '../components/games/Slots';

const Games = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const games = [
    {
      id: 'coin-flip',
      title: "Coin Flip",
      description: "50/50 chance to win with 1.95x payout",
      icon: <Coins className="w-12 h-12" />,
      platforms: ['dApp', 'Telegram'],
      status: 'live',
      component: <CoinFlip />
    },
    {
      id: 'dice-roll',
      title: "Dice Roll",
      description: "Roll under or over a target number",
      icon: <Dices className="w-12 h-12" />,
      platforms: ['dApp', 'Telegram'],
      status: 'live',
      component: <DiceRoll />
    },
    {
      id: 'slots',
      title: "Slots",
      description: "Match symbols to win up to 25x your bet",
      icon: <Sparkles className="w-12 h-12" />,
      platforms: ['dApp'],
      status: 'live',
      component: <Slots />
    },
    {
      id: 'blackjack',
      title: "Blackjack",
      description: "Beat the dealer to win 1.5x your bet",
      icon: <Club className="w-12 h-12" />,
      platforms: ['dApp'],
      status: 'coming-soon',
      component: <div className="p-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Blackjack Coming Soon</h2>
        <p className="text-[var(--text-secondary)]">We're working hard to bring you the best Blackjack experience on Solana.</p>
      </div>
    },
    {
      id: 'chat-roulette',
      title: "Chat Roulette",
      description: "Community-based roulette in Telegram groups",
      icon: <MessageSquare className="w-12 h-12" />,
      platforms: ['Telegram'],
      status: 'coming-soon',
      component: <div className="p-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Chat Roulette Coming Soon</h2>
        <p className="text-[var(--text-secondary)]">Play roulette directly in your Telegram groups.</p>
      </div>
    }
  ];

  if (selectedGame) {
    const game = games.find(g => g.id === selectedGame);
    if (!game) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-[var(--card)] rounded-xl p-4 border border-[var(--border)]">
          <div className="flex items-center space-x-4">
            <div className="text-[var(--accent)]">
              {game.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{game.title}</h1>
              <p className="text-[var(--text-secondary)]">{game.description}</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedGame(null)}
            className="px-4 py-2 rounded-lg bg-[var(--background)] hover:bg-[var(--card-hover)] transition-colors"
          >
            Back to Games
          </button>
        </div>

        {game.status === 'coming-soon' ? (
          <div className="bg-[var(--card)] rounded-xl p-8 border border-[var(--border)] text-center">
            <div className="max-w-md mx-auto">
              <div className="text-[var(--accent)] mb-6 mx-auto w-24 h-24 flex items-center justify-center bg-[var(--accent)] bg-opacity-10 rounded-full">
                {game.icon}
              </div>
              <h2 className="text-3xl font-bold mb-4">{game.title} Coming Soon</h2>
              <p className="text-[var(--text-secondary)] mb-6">
                We're working hard to bring you this exciting new game. Stay tuned for updates!
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {game.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="px-4 py-2 rounded-full text-sm bg-[var(--accent)] bg-opacity-20 text-[var(--accent)]"
                  >
                    {platform}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setSelectedGame(null)}
                className="px-6 py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity"
              >
                Explore Other Games
              </button>
            </div>
          </div>
        ) : (
          game.component
        )}
      </div>
    );
  }

  const filteredGames = filter
    ? games.filter(game =>
        filter === 'live'
          ? game.status === 'live'
          : filter === 'coming-soon'
          ? game.status === 'coming-soon'
          : filter === 'dApp'
          ? game.platforms.includes('dApp')
          : filter === 'telegram'
          ? game.platforms.includes('Telegram')
          : true
      )
    : games;

  return (
    <div className="space-y-8">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Casino Games</h1>
        <p className="text-[var(--text-secondary)] mb-8">
          Choose from our selection of provably fair games. Play directly in the dApp or through our Telegram bot.
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setFilter(null)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === null
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--card)] hover:bg-[var(--card-hover)]'
            }`}
          >
            All Games
          </button>
          <button
            onClick={() => setFilter('live')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'live'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--card)] hover:bg-[var(--card-hover)]'
            }`}
          >
            Live Games
          </button>
          <button
            onClick={() => setFilter('coming-soon')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'coming-soon'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--card)] hover:bg-[var(--card-hover)]'
            }`}
          >
            Coming Soon
          </button>
          <button
            onClick={() => setFilter('dApp')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'dApp'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--card)] hover:bg-[var(--card-hover)]'
            }`}
          >
            dApp Games
          </button>
          <button
            onClick={() => setFilter('telegram')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'telegram'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--card)] hover:bg-[var(--card-hover)]'
            }`}
          >
            Telegram Games
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map((game) => (
          <button
            key={game.id}
            onClick={() => setSelectedGame(game.id)}
            className="text-left bg-[var(--card)] rounded-xl p-6 border border-[var(--border)] hover:border-[var(--accent)] hover:border-opacity-50 transition-colors group relative overflow-hidden"
          >
            {game.status === 'coming-soon' && (
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs bg-yellow-500 bg-opacity-20 text-yellow-400 font-medium">
                Coming Soon
              </div>
            )}

            <div className="text-[var(--accent)] mb-4 group-hover:scale-110 transition-transform">
              {game.icon}
            </div>
            <h3 className="text-xl font-bold mb-2">{game.title}</h3>
            <p className="text-[var(--text-secondary)] mb-4">{game.description}</p>
            <div className="flex flex-wrap gap-2">
              {game.platforms.map((platform) => (
                <span
                  key={platform}
                  className="px-3 py-1 rounded-full text-xs bg-[var(--accent)] bg-opacity-20 text-[var(--accent)]"
                >
                  {platform}
                </span>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <span className="flex items-center justify-center py-1.5 rounded-lg bg-[var(--accent)] text-white font-medium group-hover:opacity-90 transition-colors">
                {game.status === 'coming-soon' ? 'View Details' : 'Play Now'}
              </span>
            </div>
          </button>
        ))}
      </div>

      {filteredGames.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[var(--text-secondary)] text-lg">
            No games match your filter. Try a different filter.
          </p>
          <button
            onClick={() => setFilter(null)}
            className="mt-4 px-6 py-2 rounded-lg bg-[var(--accent)] text-white"
          >
            Show All Games
          </button>
        </div>
      )}
    </div>
  );
};

export default Games;