use anchor_lang::prelude::*;

pub mod casino;
pub mod game;
pub mod player;
pub mod tournament;

pub use casino::*;
pub use game::*;
pub use player::*;
pub use tournament::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum GameType {
    CoinFlip,
    DiceRoll,
    Slots,
    Blackjack,
    Roulette,
    Poker,
    Lottery,
    SportsBet,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum GameStatus {
    Created,
    Active,
    Resolving,
    Resolved,
    Claimed,
    Cancelled,
    Expired,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum TournamentStatus {
    Created,
    Active,
    Finished,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct GameResult {
    pub outcome: Vec<u8>,
    pub multiplier: u64, // In basis points (10000 = 1x)
    pub payout: u64,
    pub house_edge_taken: u64,
    pub treasury_fee_taken: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ProvableFairData {
    pub server_seed_hash: String,
    pub client_seed: String,
    pub nonce: u64,
    pub server_seed: Option<String>, // Revealed after game resolution
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PlayerStats {
    pub games_played: u64,
    pub total_wagered: u64,
    pub total_won: u64,
    pub biggest_win: u64,
    pub current_streak: i32,
    pub best_streak: i32,
    pub level: u32,
    pub experience: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CasinoStats {
    pub total_games: u64,
    pub total_volume: u64,
    pub total_profit: i64,
    pub total_payouts: u64,
    pub active_players: u32,
    pub house_edge_collected: u64,
    pub treasury_fees_collected: u64,
}

// Constants
pub const MAX_GAME_DURATION: i64 = 3600; // 1 hour
pub const MAX_TOURNAMENT_DURATION: i64 = 86400 * 7; // 1 week
pub const MIN_HOUSE_EDGE: u16 = 50; // 0.5%
pub const MAX_HOUSE_EDGE: u16 = 1000; // 10%
pub const MAX_TREASURY_FEE: u16 = 500; // 5%
pub const BASIS_POINTS: u64 = 10000;

// Seeds for PDA derivation
pub const CASINO_SEED: &[u8] = b"casino";
pub const GAME_SEED: &[u8] = b"game";
pub const PLAYER_SEED: &[u8] = b"player";
pub const TOURNAMENT_SEED: &[u8] = b"tournament";
pub const TREASURY_SEED: &[u8] = b"treasury";
pub const VAULT_SEED: &[u8] = b"vault";

// Game-specific constants
pub const COINFLIP_PAYOUT: u64 = 19500; // 1.95x in basis points
pub const DICE_MAX_PAYOUT: u64 = 98000; // 9.8x max payout
pub const SLOTS_MAX_PAYOUT: u64 = 250000; // 25x max payout
pub const BLACKJACK_PAYOUT: u64 = 20000; // 2x for blackjack
pub const ROULETTE_STRAIGHT_PAYOUT: u64 = 350000; // 35x for straight bet
