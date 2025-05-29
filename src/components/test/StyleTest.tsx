import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Crown, Gem } from 'lucide-react';

const StyleTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background-secondary)] to-[var(--background)] p-6">
      {/* Test our new CSS variables and animations */}
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header with gradient text */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-6xl font-black gradient-text mb-4">
            STYLE TEST
          </h1>
          <p className="text-xl text-[var(--text-secondary)]">
            Testing our enhanced CSS system and animations
          </p>
        </motion.div>

        {/* Glass effect cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="glass-effect rounded-2xl p-6 glow-effect"
          >
            <div className="flex items-center mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="p-3 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--secondary)]"
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold ml-3">Glass Effect</h3>
            </div>
            <p className="text-[var(--text-secondary)]">
              Beautiful glass morphism with backdrop blur
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="glass-effect rounded-2xl p-6 animate-pulse-glow"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-glow)]">
                <Crown className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-xl font-bold ml-3">Glow Animation</h3>
            </div>
            <p className="text-[var(--text-secondary)]">
              Pulsing glow effect with smooth transitions
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="glass-effect rounded-2xl p-6 animate-float"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--success)] to-[var(--success-glow)]">
                <Gem className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold ml-3">Float Animation</h3>
            </div>
            <p className="text-[var(--text-secondary)]">
              Gentle floating motion for dynamic feel
            </p>
          </motion.div>
        </div>

        {/* Gradient borders */}
        <div className="gradient-border p-8">
          <h2 className="text-3xl font-bold gradient-text mb-4">
            Gradient Border Test
          </h2>
          <p className="text-[var(--text-secondary)]">
            This card has an animated gradient border using our new CSS utilities.
          </p>
        </div>

        {/* Button tests */}
        <div className="flex flex-wrap gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)] text-white font-bold shadow-2xl glow-effect"
          >
            Primary Button
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] transition-all"
          >
            Secondary Button
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--gold)] to-[var(--gold-glow)] text-black font-bold shadow-2xl"
          >
            Gold Button
          </motion.button>
        </div>

        {/* Animation showcase */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">Animation Showcase</h2>
          <div className="flex justify-center space-x-8">
            <motion.div
              className="w-16 h-16 bg-gradient-to-br from-[var(--accent)] to-[var(--secondary)] rounded-full animate-bounce-in"
            />
            <motion.div
              className="w-16 h-16 bg-gradient-to-br from-[var(--gold)] to-[var(--gold-glow)] rounded-full animate-rotate-coin"
            />
            <motion.div
              className="w-16 h-16 bg-gradient-to-br from-[var(--success)] to-[var(--success-glow)] rounded-full animate-pulse-glow"
            />
          </div>
        </div>

        {/* Success message */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="text-center p-8 glass-effect rounded-2xl border-2 border-[var(--success)]"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            ✅
          </motion.div>
          <h2 className="text-2xl font-bold text-[var(--success)] mb-2">
            CSS System Working Perfectly!
          </h2>
          <p className="text-[var(--text-secondary)]">
            All enhanced styles, animations, and effects are functioning correctly.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default StyleTest;
