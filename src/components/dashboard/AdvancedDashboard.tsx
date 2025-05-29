import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Users, Coins, Trophy, Activity,
  BarChart3, PieChart, Calendar, Clock, Zap, Shield,
  Globe, Smartphone, Monitor, Gamepad2, Star, Award
} from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Line, Bar, Doughnut, Area } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardStats {
  totalVolume: number;
  totalGames: number;
  activeUsers: number;
  totalPayout: number;
  houseEdge: number;
  avgBetSize: number;
  winRate: number;
  popularGame: string;
  peakHour: string;
  conversionRate: number;
}

interface TimeSeriesData {
  timestamp: number;
  volume: number;
  games: number;
  users: number;
  profit: number;
}

interface GameStats {
  name: string;
  volume: number;
  games: number;
  players: number;
  avgBet: number;
  winRate: number;
  revenue: number;
}

const AdvancedDashboard: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('24h');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [gameStats, setGameStats] = useState<GameStats[]>([]);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);

  // Mock data - replace with real API calls
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock stats
      setStats({
        totalVolume: 1234567.89,
        totalGames: 45678,
        activeUsers: 2345,
        totalPayout: 1156789.12,
        houseEdge: 2.5,
        avgBetSize: 27.45,
        winRate: 47.8,
        popularGame: 'Coin Flip',
        peakHour: '20:00 UTC',
        conversionRate: 12.5,
      });

      // Mock time series data
      const now = Date.now();
      const mockTimeSeriesData = Array.from({ length: 24 }, (_, i) => ({
        timestamp: now - (23 - i) * 60 * 60 * 1000,
        volume: Math.random() * 50000 + 10000,
        games: Math.floor(Math.random() * 500 + 100),
        users: Math.floor(Math.random() * 200 + 50),
        profit: Math.random() * 5000 + 1000,
      }));
      setTimeSeriesData(mockTimeSeriesData);

      // Mock game stats
      setGameStats([
        { name: 'Coin Flip', volume: 456789, games: 12345, players: 1234, avgBet: 37.5, winRate: 48.2, revenue: 11234 },
        { name: 'Dice Roll', volume: 234567, games: 8901, players: 890, avgBet: 26.3, winRate: 46.8, revenue: 5678 },
        { name: 'Slots', volume: 345678, games: 6789, players: 678, avgBet: 50.9, winRate: 45.1, revenue: 15678 },
        { name: 'Blackjack', volume: 123456, games: 3456, players: 345, avgBet: 35.7, winRate: 49.2, revenue: 1852 },
        { name: 'Roulette', volume: 87654, games: 2345, players: 234, avgBet: 37.4, winRate: 47.3, revenue: 2468 },
      ]);

      setIsLoading(false);
    };

    fetchDashboardData();
  }, [timeRange]);

  // Real-time updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Add new live event
      const events = [
        { type: 'big_win', user: 'Player***123', amount: Math.random() * 1000 + 100, game: 'Slots' },
        { type: 'new_user', user: 'Player***456', action: 'joined' },
        { type: 'jackpot', user: 'Player***789', amount: Math.random() * 5000 + 1000, game: 'Coin Flip' },
      ];
      
      const newEvent = {
        ...events[Math.floor(Math.random() * events.length)],
        timestamp: Date.now(),
        id: Math.random().toString(36).substr(2, 9),
      };

      setLiveEvents(prev => [newEvent, ...prev.slice(0, 9)]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Chart configurations
  const volumeChartData = useMemo(() => ({
    labels: timeSeriesData.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Volume (SOL)',
        data: timeSeriesData.map(d => d.volume),
        borderColor: 'rgb(69, 178, 107)',
        backgroundColor: 'rgba(69, 178, 107, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }), [timeSeriesData]);

  const gamesChartData = useMemo(() => ({
    labels: gameStats.map(g => g.name),
    datasets: [
      {
        label: 'Games Played',
        data: gameStats.map(g => g.games),
        backgroundColor: [
          'rgba(69, 178, 107, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
      },
    ],
  }), [gameStats]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'rgb(255, 255, 255)',
        },
      },
    },
    scales: {
      x: {
        ticks: { color: 'rgb(156, 163, 175)' },
        grid: { color: 'rgba(156, 163, 175, 0.1)' },
      },
      y: {
        ticks: { color: 'rgb(156, 163, 175)' },
        grid: { color: 'rgba(156, 163, 175, 0.1)' },
      },
    },
  };

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-[var(--accent)]/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-[var(--accent)]" />
          </div>
          <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
          <p className="text-[var(--text-secondary)] max-w-md">
            Connect your Solana wallet to access the advanced dashboard and start playing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-[var(--accent)] bg-clip-text text-transparent">
            Casino Dashboard
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Real-time analytics and performance metrics
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          <div className="flex items-center space-x-2 text-sm text-[var(--text-secondary)]">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span>Live</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: Coins, label: 'Total Volume', value: stats?.totalVolume, format: 'currency', change: '+12.5%', positive: true },
          { icon: Gamepad2, label: 'Games Played', value: stats?.totalGames, format: 'number', change: '+8.2%', positive: true },
          { icon: Users, label: 'Active Users', value: stats?.activeUsers, format: 'number', change: '+15.7%', positive: true },
          { icon: Trophy, label: 'Total Payout', value: stats?.totalPayout, format: 'currency', change: '+9.8%', positive: true },
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 hover:border-[var(--accent)]/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-[var(--accent)]/20">
                <metric.icon className="w-6 h-6 text-[var(--accent)]" />
              </div>
              <div className={`flex items-center text-sm ${metric.positive ? 'text-green-400' : 'text-red-400'}`}>
                {metric.positive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {metric.change}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="w-20 h-8 bg-[var(--card-hover)] rounded animate-pulse"></div>
                ) : (
                  metric.format === 'currency' 
                    ? `${(metric.value! / 1000000).toFixed(2)}M SOL`
                    : metric.value!.toLocaleString()
                )}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">{metric.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Chart */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-[var(--accent)]" />
              Volume Over Time
            </h3>
            <div className="text-sm text-[var(--text-secondary)]">
              {timeRange.toUpperCase()}
            </div>
          </div>
          <div className="h-64">
            {isLoading ? (
              <div className="w-full h-full bg-[var(--card-hover)] rounded animate-pulse"></div>
            ) : (
              <Line data={volumeChartData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Games Distribution */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-[var(--accent)]" />
              Games Distribution
            </h3>
          </div>
          <div className="h-64">
            {isLoading ? (
              <div className="w-full h-full bg-[var(--card-hover)] rounded animate-pulse"></div>
            ) : (
              <Bar data={gamesChartData} options={chartOptions} />
            )}
          </div>
        </div>
      </div>

      {/* Game Performance Table */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
        <h3 className="text-lg font-bold mb-6 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-[var(--accent)]" />
          Game Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-3 px-4 font-medium text-[var(--text-secondary)]">Game</th>
                <th className="text-right py-3 px-4 font-medium text-[var(--text-secondary)]">Volume</th>
                <th className="text-right py-3 px-4 font-medium text-[var(--text-secondary)]">Games</th>
                <th className="text-right py-3 px-4 font-medium text-[var(--text-secondary)]">Players</th>
                <th className="text-right py-3 px-4 font-medium text-[var(--text-secondary)]">Avg Bet</th>
                <th className="text-right py-3 px-4 font-medium text-[var(--text-secondary)]">Win Rate</th>
                <th className="text-right py-3 px-4 font-medium text-[var(--text-secondary)]">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {gameStats.map((game, index) => (
                <motion.tr
                  key={game.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-b border-[var(--border)]/50 hover:bg-[var(--card-hover)] transition-colors"
                >
                  <td className="py-3 px-4 font-medium">{game.name}</td>
                  <td className="py-3 px-4 text-right">{(game.volume / 1000).toFixed(1)}K SOL</td>
                  <td className="py-3 px-4 text-right">{game.games.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">{game.players.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">{game.avgBet.toFixed(2)} SOL</td>
                  <td className="py-3 px-4 text-right">{game.winRate.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right text-green-400">{(game.revenue / 1000).toFixed(1)}K SOL</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
        <h3 className="text-lg font-bold mb-6 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-[var(--accent)]" />
          Live Activity
        </h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          <AnimatePresence>
            {liveEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]/50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse"></div>
                  <div>
                    <div className="font-medium">
                      {event.type === 'big_win' && `🎉 ${event.user} won ${event.amount.toFixed(2)} SOL on ${event.game}!`}
                      {event.type === 'new_user' && `👋 ${event.user} joined the casino!`}
                      {event.type === 'jackpot' && `💰 JACKPOT! ${event.user} won ${event.amount.toFixed(2)} SOL on ${event.game}!`}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {liveEvents.length === 0 && (
            <div className="text-center text-[var(--text-secondary)] py-8">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedDashboard;
