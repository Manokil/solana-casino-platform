import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  change: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, change }) => {
  const isPositive = !change.startsWith('-');
  
  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 hover:border-[#45b26b80] transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 rounded-lg bg-[var(--card-hover)]">
            {icon}
          </div>
          <div>
            <h3 className="text-[var(--text-secondary)] text-sm">{title}</h3>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
        </div>
        <div className={`flex items-center ${isPositive ? 'text-[var(--accent)]' : 'text-red-400'}`}>
          {isPositive ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          <span className="text-sm ml-1">{change}</span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;