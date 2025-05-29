use anchor_lang::prelude::*;
use super::{CasinoStats, BASIS_POINTS};

#[account]
pub struct Casino {
    /// Authority that can update casino settings
    pub authority: Pubkey,
    /// Token mint for the casino (SOL or SPL token)
    pub token_mint: Pubkey,
    /// Treasury account for collecting fees
    pub treasury: Pubkey,
    /// Vault account for holding game funds
    pub vault: Pubkey,
    /// House edge in basis points (e.g., 200 = 2%)
    pub house_edge: u16,
    /// Minimum bet amount in token units
    pub min_bet: u64,
    /// Maximum bet amount in token units
    pub max_bet: u64,
    /// Treasury fee in basis points (e.g., 100 = 1%)
    pub treasury_fee: u16,
    /// Whether the casino is currently active
    pub is_active: bool,
    /// Whether the casino is paused (emergency)
    pub is_paused: bool,
    /// Casino statistics
    pub stats: CasinoStats,
    /// Timestamp when casino was created
    pub created_at: i64,
    /// Last update timestamp
    pub updated_at: i64,
    /// Bump seed for PDA
    pub bump: u8,
}

impl Casino {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // token_mint
        32 + // treasury
        32 + // vault
        2 + // house_edge
        8 + // min_bet
        8 + // max_bet
        2 + // treasury_fee
        1 + // is_active
        1 + // is_paused
        (8 * 8 + 4) + // stats (8 u64s + 1 u32)
        8 + // created_at
        8 + // updated_at
        1 + // bump
        64; // padding for future fields

    pub fn validate_bet_amount(&self, amount: u64) -> Result<()> {
        require!(amount >= self.min_bet, crate::errors::CasinoError::BetTooSmall);
        require!(amount <= self.max_bet, crate::errors::CasinoError::BetTooLarge);
        Ok(())
    }

    pub fn validate_house_edge(&self) -> Result<()> {
        require!(
            self.house_edge >= super::MIN_HOUSE_EDGE && self.house_edge <= super::MAX_HOUSE_EDGE,
            crate::errors::CasinoError::InvalidHouseEdge
        );
        Ok(())
    }

    pub fn validate_treasury_fee(&self) -> Result<()> {
        require!(
            self.treasury_fee <= super::MAX_TREASURY_FEE,
            crate::errors::CasinoError::InvalidTreasuryFee
        );
        Ok(())
    }

    pub fn calculate_house_edge(&self, bet_amount: u64) -> u64 {
        (bet_amount * self.house_edge as u64) / BASIS_POINTS
    }

    pub fn calculate_treasury_fee(&self, bet_amount: u64) -> u64 {
        (bet_amount * self.treasury_fee as u64) / BASIS_POINTS
    }

    pub fn calculate_max_payout(&self, bet_amount: u64, multiplier: u64) -> u64 {
        let gross_payout = (bet_amount * multiplier) / BASIS_POINTS;
        let house_edge = self.calculate_house_edge(bet_amount);
        let treasury_fee = self.calculate_treasury_fee(bet_amount);
        
        gross_payout.saturating_sub(house_edge).saturating_sub(treasury_fee)
    }

    pub fn is_operational(&self) -> bool {
        self.is_active && !self.is_paused
    }

    pub fn update_stats(&mut self, bet_amount: u64, payout: u64, house_edge_taken: u64, treasury_fee_taken: u64) {
        self.stats.total_games = self.stats.total_games.saturating_add(1);
        self.stats.total_volume = self.stats.total_volume.saturating_add(bet_amount);
        self.stats.total_payouts = self.stats.total_payouts.saturating_add(payout);
        self.stats.house_edge_collected = self.stats.house_edge_collected.saturating_add(house_edge_taken);
        self.stats.treasury_fees_collected = self.stats.treasury_fees_collected.saturating_add(treasury_fee_taken);
        
        // Calculate profit (house edge - payouts)
        let profit = house_edge_taken as i64 - payout as i64;
        self.stats.total_profit = self.stats.total_profit.saturating_add(profit);
        
        self.updated_at = Clock::get().unwrap().unix_timestamp;
    }

    pub fn get_profit_margin(&self) -> f64 {
        if self.stats.total_volume == 0 {
            return 0.0;
        }
        (self.stats.total_profit as f64 / self.stats.total_volume as f64) * 100.0
    }

    pub fn get_payout_ratio(&self) -> f64 {
        if self.stats.total_volume == 0 {
            return 0.0;
        }
        (self.stats.total_payouts as f64 / self.stats.total_volume as f64) * 100.0
    }
}
