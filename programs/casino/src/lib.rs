use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use anchor_spl::associated_token::AssociatedToken;
use switchboard_v2::AggregatorAccountData;
use sha2::{Sha256, Digest};

declare_id!("CasinoProgram11111111111111111111111111111");

pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

use errors::*;
use instructions::*;
use state::*;
use utils::*;

#[program]
pub mod casino {
    use super::*;

    /// Initialize a new casino with configuration
    pub fn initialize_casino(
        ctx: Context<InitializeCasino>,
        house_edge: u16,
        min_bet: u64,
        max_bet: u64,
        treasury_fee: u16,
    ) -> Result<()> {
        instructions::initialize_casino::handler(ctx, house_edge, min_bet, max_bet, treasury_fee)
    }

    /// Create a new game session
    pub fn create_game(
        ctx: Context<CreateGame>,
        game_type: GameType,
        bet_amount: u64,
        prediction: Vec<u8>,
        client_seed: String,
    ) -> Result<()> {
        instructions::create_game::handler(ctx, game_type, bet_amount, prediction, client_seed)
    }

    /// Resolve a game using verifiable randomness
    pub fn resolve_game(
        ctx: Context<ResolveGame>,
        server_seed: String,
        nonce: u64,
    ) -> Result<()> {
        instructions::resolve_game::handler(ctx, server_seed, nonce)
    }

    /// Claim winnings from a resolved game
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        instructions::claim_winnings::handler(ctx)
    }

    /// Update casino configuration (admin only)
    pub fn update_casino_config(
        ctx: Context<UpdateCasinoConfig>,
        house_edge: Option<u16>,
        min_bet: Option<u64>,
        max_bet: Option<u64>,
        is_active: Option<bool>,
    ) -> Result<()> {
        instructions::update_casino_config::handler(ctx, house_edge, min_bet, max_bet, is_active)
    }

    /// Emergency pause (admin only)
    pub fn emergency_pause(ctx: Context<EmergencyPause>) -> Result<()> {
        instructions::emergency_pause::handler(ctx)
    }

    /// Withdraw treasury funds (admin only)
    pub fn withdraw_treasury(
        ctx: Context<WithdrawTreasury>,
        amount: u64,
    ) -> Result<()> {
        instructions::withdraw_treasury::handler(ctx, amount)
    }

    /// Initialize player profile
    pub fn initialize_player(ctx: Context<InitializePlayer>) -> Result<()> {
        instructions::initialize_player::handler(ctx)
    }

    /// Update player statistics
    pub fn update_player_stats(
        ctx: Context<UpdatePlayerStats>,
        games_played: u64,
        total_wagered: u64,
        total_won: u64,
    ) -> Result<()> {
        instructions::update_player_stats::handler(ctx, games_played, total_wagered, total_won)
    }

    /// Create tournament
    pub fn create_tournament(
        ctx: Context<CreateTournament>,
        entry_fee: u64,
        max_players: u32,
        start_time: i64,
        duration: i64,
    ) -> Result<()> {
        instructions::create_tournament::handler(ctx, entry_fee, max_players, start_time, duration)
    }

    /// Join tournament
    pub fn join_tournament(ctx: Context<JoinTournament>) -> Result<()> {
        instructions::join_tournament::handler(ctx)
    }

    /// Finalize tournament
    pub fn finalize_tournament(ctx: Context<FinalizeTournament>) -> Result<()> {
        instructions::finalize_tournament::handler(ctx)
    }
}
