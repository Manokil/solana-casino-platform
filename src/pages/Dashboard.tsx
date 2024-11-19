import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Trophy, Users, Wallet, ArrowRight, Shield, Coins, Zap, MessageSquare, BarChart3, Lock } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import RecentGames from '../components/dashboard/RecentGames';
import TopTokens from '../components/dashboard/TopTokens';

const Dashboard = () => {
  const { connected } = useWallet();

  if (!connected) {
    return (
      <div className="space-y-24 pb-20">
        {/* Hero Section */}
        <section className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/20 to-transparent pointer-events-none" />
          <div className="max-w-6xl mx-auto px-4 pt-20 pb-32 relative">
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
                Transform Your Token into a Gaming Ecosystem
              </h1>
              <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
                Launch your own casino for your Solana token in minutes. Engage your community with provably fair games and seamless Telegram integration.
              </p>
              <div className="flex items-center justify-center space-x-4 pt-6">
                <button className="px-8 py-3 rounded-lg bg-[var(--accent)] hover:opacity-90 transition-opacity font-medium flex items-center space-x-2">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button className="px-8 py-3 rounded-lg border border-[var(--border)] hover:bg-[var(--card)] transition-colors">
                  View Demo
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Platform?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Provably Fair"
              description="Transparent and verifiable game outcomes using cryptographic proofs"
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Instant Setup"
              description="Launch your casino in minutes with our intuitive dashboard"
            />
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8" />}
              title="Telegram Integration"
              description="Let users play directly in your community chat groups"
            />
            <FeatureCard
              icon={<Coins className="w-8 h-8" />}
              title="Token Compatible"
              description="Works with any SPL token on the Solana blockchain"
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8" />}
              title="Analytics"
              description="Track performance with detailed metrics and insights"
            />
            <FeatureCard
              icon={<Lock className="w-8 h-8" />}
              title="Enterprise Security"
              description="Bank-grade security for your treasury and users"
            />
          </div>
        </section>

        {/* Stats Section */}
        <section className="max-w-6xl mx-auto px-4">
          <div className="bg-[var(--card)] rounded-2xl p-12 border border-[var(--border)]">
            <h2 className="text-3xl font-bold text-center mb-12">Platform Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StatBox
                value="$10M+"
                label="Total Volume"
              />
              <StatBox
                value="50+"
                label="Active Casinos"
              />
              <StatBox
                value="100K+"
                label="Players"
              />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Connect Wallet"
              description="Link your Solana wallet containing your token"
            />
            <StepCard
              number="2"
              title="Configure Casino"
              description="Set your parameters, limits, and game options"
            />
            <StepCard
              number="3"
              title="Launch & Earn"
              description="Start accepting bets and grow your community"
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-6xl mx-auto px-4">
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Launch Your Casino?</h2>
            <p className="text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
              Join the growing ecosystem of token-powered casinos on Solana. Start engaging your community today.
            </p>
            <button className="px-8 py-3 rounded-lg bg-[var(--accent)] hover:opacity-90 transition-opacity font-medium">
              Connect Wallet to Begin
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<Trophy className="w-8 h-8 text-yellow-400" />}
          title="Total Winnings"
          value="1,234 SOL"
          change="+12.5%"
        />
        <StatCard
          icon={<Users className="w-8 h-8 text-blue-400" />}
          title="Active Players"
          value="567"
          change="+5.2%"
        />
        <StatCard
          icon={<Wallet className="w-8 h-8 text-green-400" />}
          title="Total Volume"
          value="45,678 SOL"
          change="+8.7%"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <RecentGames />
        <TopTokens />
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all">
    <div className="text-[var(--accent)] mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-[var(--text-secondary)]">{description}</p>
  </div>
);

const StatBox: React.FC<{
  value: string;
  label: string;
}> = ({ value, label }) => (
  <div className="text-center">
    <div className="text-4xl font-bold mb-2">{value}</div>
    <div className="text-[var(--text-secondary)]">{label}</div>
  </div>
);

const StepCard: React.FC<{
  number: string;
  title: string;
  description: string;
}> = ({ number, title, description }) => (
  <div className="relative bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
    <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center font-bold">
      {number}
    </div>
    <h3 className="text-xl font-bold mb-2 mt-2">{title}</h3>
    <p className="text-[var(--text-secondary)]">{description}</p>
  </div>
);

export default Dashboard;