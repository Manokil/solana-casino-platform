# Implementation Guide - Priority 1 Enhancements

## 1. Smart Contract Development (CRITICAL)

### Setup Anchor Framework
```bash
# Install Anchor CLI
npm install -g @coral-xyz/anchor-cli

# Initialize new Anchor project
anchor init solana-casino --template multiple
cd solana-casino
```

### Casino Program Structure
```rust
// programs/casino/src/lib.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("CasinoProgram11111111111111111111111111111");

#[program]
pub mod casino {
    use super::*;
    
    pub fn initialize_casino(
        ctx: Context<InitializeCasino>,
        house_edge: u16, // basis points (e.g., 200 = 2%)
        min_bet: u64,
        max_bet: u64,
    ) -> Result<()> {
        let casino = &mut ctx.accounts.casino;
        casino.authority = ctx.accounts.authority.key();
        casino.house_edge = house_edge;
        casino.min_bet = min_bet;
        casino.max_bet = max_bet;
        casino.total_volume = 0;
        casino.total_profit = 0;
        Ok(())
    }
    
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        amount: u64,
        game_type: GameType,
        prediction: Vec<u8>,
        client_seed: String,
    ) -> Result<()> {
        // Validate bet amount
        require!(
            amount >= ctx.accounts.casino.min_bet && 
            amount <= ctx.accounts.casino.max_bet,
            CasinoError::InvalidBetAmount
        );
        
        // Transfer bet amount to escrow
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.player_token_account.to_account_info(),
                to: ctx.accounts.escrow_token_account.to_account_info(),
                authority: ctx.accounts.player.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, amount)?;
        
        // Create game state
        let game = &mut ctx.accounts.game;
        game.player = ctx.accounts.player.key();
        game.amount = amount;
        game.game_type = game_type;
        game.prediction = prediction;
        game.client_seed = client_seed;
        game.status = GameStatus::Pending;
        game.created_at = Clock::get()?.unix_timestamp;
        
        Ok(())
    }
    
    pub fn resolve_game(
        ctx: Context<ResolveGame>,
        server_seed: String,
        nonce: u64,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        require!(game.status == GameStatus::Pending, CasinoError::GameAlreadyResolved);
        
        // Generate provably fair result
        let result = generate_game_result(
            &server_seed,
            &game.client_seed,
            nonce,
            game.game_type,
        )?;
        
        let won = check_win_condition(&game.prediction, &result, game.game_type)?;
        
        if won {
            let payout = calculate_payout(game.amount, game.game_type);
            // Transfer payout to player
            // Implementation details...
        }
        
        game.result = result;
        game.won = won;
        game.status = GameStatus::Resolved;
        game.resolved_at = Clock::get()?.unix_timestamp;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeCasino<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Casino::LEN
    )]
    pub casino: Account<'info, Casino>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(
        init,
        payer = player,
        space = 8 + Game::LEN
    )]
    pub game: Account<'info, Game>,
    #[account(mut)]
    pub casino: Account<'info, Casino>,
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut)]
    pub player_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Casino {
    pub authority: Pubkey,
    pub house_edge: u16,
    pub min_bet: u64,
    pub max_bet: u64,
    pub total_volume: u64,
    pub total_profit: i64,
}

impl Casino {
    pub const LEN: usize = 32 + 2 + 8 + 8 + 8 + 8;
}

#[account]
pub struct Game {
    pub player: Pubkey,
    pub amount: u64,
    pub game_type: GameType,
    pub prediction: Vec<u8>,
    pub client_seed: String,
    pub result: Vec<u8>,
    pub won: bool,
    pub status: GameStatus,
    pub created_at: i64,
    pub resolved_at: i64,
}

impl Game {
    pub const LEN: usize = 32 + 8 + 1 + 32 + 64 + 32 + 1 + 1 + 8 + 8;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum GameType {
    CoinFlip,
    DiceRoll,
    Slots,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum GameStatus {
    Pending,
    Resolved,
    Cancelled,
}

#[error_code]
pub enum CasinoError {
    #[msg("Invalid bet amount")]
    InvalidBetAmount,
    #[msg("Game already resolved")]
    GameAlreadyResolved,
    #[msg("Insufficient funds")]
    InsufficientFunds,
}
```

## 2. Backend API Development

### Express.js Server Setup
```typescript
// server/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { authRouter } from './routes/auth';
import { gameRouter } from './routes/games';
import { userRouter } from './routes/users';
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/games', authenticateToken, gameRouter);
app.use('/api/users', authenticateToken, userRouter);

// Error handling
app.use(errorHandler);

// WebSocket handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-game', (gameId) => {
    socket.join(`game-${gameId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

export { app, server, io };
```

### Database Schema (PostgreSQL)
```sql
-- migrations/001_initial_schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(44) UNIQUE NOT NULL,
    username VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    total_wagered DECIMAL(20, 9) DEFAULT 0,
    total_won DECIMAL(20, 9) DEFAULT 0,
    games_played INTEGER DEFAULT 0
);

CREATE TABLE casinos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    token_mint VARCHAR(44) NOT NULL,
    house_edge INTEGER NOT NULL, -- basis points
    min_bet DECIMAL(20, 9) NOT NULL,
    max_bet DECIMAL(20, 9) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_volume DECIMAL(20, 9) DEFAULT 0,
    total_profit DECIMAL(20, 9) DEFAULT 0
);

CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    casino_id UUID REFERENCES casinos(id),
    player_id UUID REFERENCES users(id),
    game_type VARCHAR(20) NOT NULL,
    bet_amount DECIMAL(20, 9) NOT NULL,
    prediction JSONB,
    result JSONB,
    client_seed VARCHAR(64) NOT NULL,
    server_seed_hash VARCHAR(64) NOT NULL,
    server_seed VARCHAR(64), -- revealed after game
    nonce INTEGER NOT NULL,
    won BOOLEAN,
    payout DECIMAL(20, 9),
    transaction_signature VARCHAR(88),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE TABLE provable_fairness_seeds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    casino_id UUID REFERENCES casinos(id),
    seed_hash VARCHAR(64) NOT NULL,
    seed_plain VARCHAR(64), -- revealed after use
    nonce INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revealed_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_games_player_id ON games(player_id);
CREATE INDEX idx_games_casino_id ON games(casino_id);
CREATE INDEX idx_games_created_at ON games(created_at);
CREATE INDEX idx_games_status ON games(status);
```

## 3. Enhanced Frontend Components

### Optimized Game Hook
```typescript
// src/hooks/useGame.ts
import { useCallback, useMemo, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import { Casino } from '../types/casino';
import { toast } from 'react-hot-toast';

export const useGame = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const programRef = useRef<Program<Casino> | null>(null);

  const provider = useMemo(() => {
    if (!publicKey || !signTransaction) return null;
    
    return new AnchorProvider(
      connection,
      { publicKey, signTransaction } as any,
      { commitment: 'confirmed' }
    );
  }, [connection, publicKey, signTransaction]);

  const program = useMemo(() => {
    if (!provider) return null;
    
    if (!programRef.current) {
      programRef.current = new Program(
        CasinoIDL,
        CASINO_PROGRAM_ID,
        provider
      );
    }
    
    return programRef.current;
  }, [provider]);

  const placeBet = useCallback(async (
    amount: number,
    gameType: string,
    prediction: any,
    clientSeed: string
  ) => {
    if (!program || !publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const gameKeypair = web3.Keypair.generate();
      
      const tx = await program.methods
        .placeBet(
          new web3.BN(amount * web3.LAMPORTS_PER_SOL),
          { [gameType]: {} },
          Array.from(Buffer.from(JSON.stringify(prediction))),
          clientSeed
        )
        .accounts({
          game: gameKeypair.publicKey,
          casino: CASINO_ACCOUNT,
          player: publicKey,
          playerTokenAccount: await getAssociatedTokenAddress(
            TOKEN_MINT,
            publicKey
          ),
          escrowTokenAccount: ESCROW_TOKEN_ACCOUNT,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([gameKeypair])
        .rpc();

      toast.success('Bet placed successfully!');
      return { signature: tx, gameId: gameKeypair.publicKey.toString() };
    } catch (error) {
      console.error('Error placing bet:', error);
      toast.error('Failed to place bet');
      throw error;
    }
  }, [program, publicKey]);

  return {
    placeBet,
    program,
    isConnected: !!publicKey,
  };
};
```

### Real-time Game Component
```typescript
// src/components/games/EnhancedCoinFlip.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../hooks/useGame';
import { useSocket } from '../../hooks/useSocket';
import { toast } from 'react-hot-toast';

interface GameState {
  isPlaying: boolean;
  result: 'heads' | 'tails' | null;
  isAnimating: boolean;
  gameId: string | null;
}

export const EnhancedCoinFlip: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    result: null,
    isAnimating: false,
    gameId: null,
  });
  
  const [betAmount, setBetAmount] = useState('0.1');
  const [prediction, setPrediction] = useState<'heads' | 'tails'>('heads');
  
  const { placeBet, isConnected } = useGame();
  const socket = useSocket();

  // Listen for game results via WebSocket
  useEffect(() => {
    if (!socket || !gameState.gameId) return;

    const handleGameResult = (data: any) => {
      if (data.gameId === gameState.gameId) {
        setGameState(prev => ({
          ...prev,
          result: data.result,
          isAnimating: false,
          isPlaying: false,
        }));
        
        if (data.won) {
          toast.success(`You won ${data.payout} SOL!`);
        } else {
          toast.error('Better luck next time!');
        }
      }
    };

    socket.on('game-result', handleGameResult);
    return () => socket.off('game-result', handleGameResult);
  }, [socket, gameState.gameId]);

  const handleFlip = useCallback(async () => {
    if (!isConnected || gameState.isPlaying) return;

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid bet amount');
      return;
    }

    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      isAnimating: true,
      result: null,
    }));

    try {
      const clientSeed = Math.random().toString(36).substring(7);
      const { gameId } = await placeBet(amount, 'coinFlip', { prediction }, clientSeed);
      
      setGameState(prev => ({ ...prev, gameId }));
      
      // Join game room for real-time updates
      socket?.emit('join-game', gameId);
      
    } catch (error) {
      setGameState(prev => ({
        ...prev,
        isPlaying: false,
        isAnimating: false,
      }));
    }
  }, [isConnected, gameState.isPlaying, betAmount, prediction, placeBet, socket]);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card rounded-xl border border-border">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Coin Flip</h2>
        <p className="text-text-secondary">Choose heads or tails and flip to win!</p>
      </div>

      {/* Coin Animation */}
      <div className="flex justify-center mb-8">
        <motion.div
          className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-4xl font-bold shadow-lg"
          animate={gameState.isAnimating ? {
            rotateY: [0, 180, 360, 540, 720],
            scale: [1, 1.1, 1, 1.1, 1],
          } : {}}
          transition={{
            duration: 3,
            ease: "easeInOut",
          }}
        >
          {gameState.result ? (gameState.result === 'heads' ? '👑' : '🦅') : '🪙'}
        </motion.div>
      </div>

      {/* Game Controls */}
      <div className="space-y-6">
        <div>
          <label className="label">Bet Amount (SOL)</label>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            className="input"
            min="0.01"
            step="0.01"
            disabled={gameState.isPlaying}
          />
        </div>

        <div>
          <label className="label">Your Prediction</label>
          <div className="flex gap-4">
            <button
              onClick={() => setPrediction('heads')}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                prediction === 'heads'
                  ? 'bg-accent text-white'
                  : 'bg-card-hover text-text-secondary hover:text-text-primary'
              }`}
              disabled={gameState.isPlaying}
            >
              👑 Heads
            </button>
            <button
              onClick={() => setPrediction('tails')}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                prediction === 'tails'
                  ? 'bg-accent text-white'
                  : 'bg-card-hover text-text-secondary hover:text-text-primary'
              }`}
              disabled={gameState.isPlaying}
            >
              🦅 Tails
            </button>
          </div>
        </div>

        <button
          onClick={handleFlip}
          disabled={!isConnected || gameState.isPlaying}
          className="w-full btn-primary py-4 text-lg font-bold"
        >
          {gameState.isPlaying ? 'Flipping...' : 'Flip Coin'}
        </button>
      </div>

      {/* Result Display */}
      <AnimatePresence>
        {gameState.result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 p-4 rounded-lg bg-card-hover text-center"
          >
            <p className="text-lg">
              Result: <span className="font-bold">{gameState.result}</span>
            </p>
            <p className={`text-sm mt-1 ${
              gameState.result === prediction ? 'text-success' : 'text-error'
            }`}>
              {gameState.result === prediction ? 'You won!' : 'You lost!'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

## Next Steps

1. **Immediate Actions (Week 1)**:
   - Set up Anchor development environment
   - Initialize smart contract project
   - Create basic casino program structure

2. **Backend Setup (Week 2)**:
   - Set up Express.js server
   - Configure PostgreSQL database
   - Implement basic API endpoints

3. **Frontend Integration (Week 3)**:
   - Update existing components to use new smart contracts
   - Implement real-time WebSocket connections
   - Add comprehensive error handling

4. **Testing & Security (Week 4)**:
   - Write comprehensive tests
   - Conduct security audit
   - Deploy to testnet for testing

This implementation guide provides the foundation for transforming the current prototype into a production-ready casino platform. Each component is designed to be scalable, secure, and maintainable.
