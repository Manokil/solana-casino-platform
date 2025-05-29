use anchor_lang::prelude::*;
use super::{GameType, GameStatus, GameResult, ProvableFairData, PlayerStats};

#[account]
pub struct Game {
    /// Player who created the game
    pub player: Pubkey,
    /// Casino this game belongs to
    pub casino: Pubkey,
    /// Type of game being played
    pub game_type: GameType,
    /// Bet amount in token units
    pub bet_amount: u64,
    /// Player's prediction/choice
    pub prediction: Vec<u8>,
    /// Game result (populated after resolution)
    pub result: Option<GameResult>,
    /// Provably fair data
    pub provable_fair: ProvableFairData,
    /// Current game status
    pub status: GameStatus,
    /// Timestamp when game was created
    pub created_at: i64,
    /// Timestamp when game was resolved
    pub resolved_at: Option<i64>,
    /// Timestamp when winnings were claimed
    pub claimed_at: Option<i64>,
    /// Expiration timestamp
    pub expires_at: i64,
    /// Game session ID for tracking
    pub session_id: u64,
    /// Bump seed for PDA
    pub bump: u8,
}

impl Game {
    pub const LEN: usize = 8 + // discriminator
        32 + // player
        32 + // casino
        1 + // game_type
        8 + // bet_amount
        4 + 256 + // prediction (vec with max 256 bytes)
        1 + (4 + 256 + 8 + 8 + 8) + // result (optional)
        (4 + 64 + 4 + 64 + 8 + 1 + 4 + 64) + // provable_fair
        1 + // status
        8 + // created_at
        1 + 8 + // resolved_at (optional)
        1 + 8 + // claimed_at (optional)
        8 + // expires_at
        8 + // session_id
        1 + // bump
        128; // padding for future fields

    pub fn is_expired(&self) -> bool {
        Clock::get().unwrap().unix_timestamp > self.expires_at
    }

    pub fn can_be_resolved(&self) -> bool {
        matches!(self.status, GameStatus::Active) && !self.is_expired()
    }

    pub fn can_claim_winnings(&self) -> bool {
        matches!(self.status, GameStatus::Resolved) && 
        self.result.as_ref().map_or(false, |r| r.payout > 0) &&
        self.claimed_at.is_none()
    }

    pub fn resolve_game(&mut self, result: GameResult) -> Result<()> {
        require!(self.can_be_resolved(), crate::errors::CasinoError::CannotResolveGame);
        
        self.result = Some(result);
        self.status = GameStatus::Resolved;
        self.resolved_at = Some(Clock::get()?.unix_timestamp);
        
        Ok(())
    }

    pub fn claim_winnings(&mut self) -> Result<u64> {
        require!(self.can_claim_winnings(), crate::errors::CasinoError::CannotClaimWinnings);
        
        let payout = self.result.as_ref().unwrap().payout;
        self.status = GameStatus::Claimed;
        self.claimed_at = Some(Clock::get()?.unix_timestamp);
        
        Ok(payout)
    }

    pub fn cancel_game(&mut self) -> Result<()> {
        require!(
            matches!(self.status, GameStatus::Created | GameStatus::Active),
            crate::errors::CasinoError::CannotCancelGame
        );
        
        self.status = GameStatus::Cancelled;
        Ok(())
    }

    pub fn expire_game(&mut self) -> Result<()> {
        require!(self.is_expired(), crate::errors::CasinoError::GameNotExpired);
        require!(
            !matches!(self.status, GameStatus::Resolved | GameStatus::Claimed | GameStatus::Cancelled),
            crate::errors::CasinoError::CannotExpireGame
        );
        
        self.status = GameStatus::Expired;
        Ok(())
    }

    pub fn get_game_duration(&self) -> i64 {
        match self.resolved_at {
            Some(resolved) => resolved - self.created_at,
            None => Clock::get().unwrap().unix_timestamp - self.created_at,
        }
    }

    pub fn verify_provable_fairness(&self, server_seed: &str) -> Result<bool> {
        use sha2::{Sha256, Digest};
        
        // Verify server seed hash
        let mut hasher = Sha256::new();
        hasher.update(server_seed.as_bytes());
        let computed_hash = hex::encode(hasher.finalize());
        
        Ok(computed_hash == self.provable_fair.server_seed_hash)
    }

    pub fn generate_game_outcome(&self, server_seed: &str) -> Result<Vec<u8>> {
        use sha2::{Sha256, Digest};
        
        // Combine seeds for randomness
        let combined_seed = format!(
            "{}-{}-{}",
            server_seed,
            self.provable_fair.client_seed,
            self.provable_fair.nonce
        );
        
        let mut hasher = Sha256::new();
        hasher.update(combined_seed.as_bytes());
        let hash = hasher.finalize();
        
        // Generate outcome based on game type
        match self.game_type {
            GameType::CoinFlip => {
                let result = hash[0] % 2;
                Ok(vec![result])
            },
            GameType::DiceRoll => {
                let result = (hash[0] % 100) + 1;
                Ok(vec![result])
            },
            GameType::Slots => {
                // Generate 3 reels
                let reel1 = hash[0] % 10;
                let reel2 = hash[1] % 10;
                let reel3 = hash[2] % 10;
                Ok(vec![reel1, reel2, reel3])
            },
            GameType::Roulette => {
                let result = hash[0] % 37; // 0-36 for European roulette
                Ok(vec![result])
            },
            _ => {
                // For more complex games, implement specific logic
                Ok(hash[0..4].to_vec())
            }
        }
    }

    pub fn calculate_payout(&self, outcome: &[u8], casino_house_edge: u16) -> Result<GameResult> {
        let base_amount = self.bet_amount;
        let house_edge_amount = (base_amount * casino_house_edge as u64) / super::BASIS_POINTS;
        
        let (won, multiplier) = match self.game_type {
            GameType::CoinFlip => {
                let prediction = self.prediction[0];
                let result = outcome[0];
                let won = prediction == result;
                let multiplier = if won { super::COINFLIP_PAYOUT } else { 0 };
                (won, multiplier)
            },
            GameType::DiceRoll => {
                // Assuming prediction format: [target, over_under]
                // over_under: 0 = under, 1 = over
                if self.prediction.len() < 2 {
                    return Err(crate::errors::CasinoError::InvalidPrediction.into());
                }
                
                let target = self.prediction[0];
                let over_under = self.prediction[1];
                let result = outcome[0];
                
                let won = if over_under == 0 {
                    result < target
                } else {
                    result > target
                };
                
                let multiplier = if won {
                    // Calculate payout based on probability
                    let probability = if over_under == 0 {
                        target as u64
                    } else {
                        100 - target as u64
                    };
                    
                    if probability > 0 {
                        (9800 * 100) / probability // 98% RTP
                    } else {
                        0
                    }
                } else {
                    0
                };
                
                (won, multiplier.min(super::DICE_MAX_PAYOUT))
            },
            GameType::Slots => {
                let reel1 = outcome[0];
                let reel2 = outcome[1];
                let reel3 = outcome[2];
                
                let multiplier = if reel1 == reel2 && reel2 == reel3 {
                    // Three of a kind
                    match reel1 {
                        7 => 25000, // 25x for triple 7s
                        _ => 10000, // 10x for other triples
                    }
                } else if reel1 == reel2 || reel2 == reel3 || reel1 == reel3 {
                    // Two of a kind
                    2000 // 2x
                } else {
                    0 // No win
                };
                
                (multiplier > 0, multiplier.min(super::SLOTS_MAX_PAYOUT))
            },
            GameType::Roulette => {
                // Simplified roulette - straight number bet
                let prediction = self.prediction[0];
                let result = outcome[0];
                let won = prediction == result;
                let multiplier = if won { super::ROULETTE_STRAIGHT_PAYOUT } else { 0 };
                (won, multiplier)
            },
            _ => {
                // Default case for other games
                (false, 0)
            }
        };

        let gross_payout = if won {
            (base_amount * multiplier) / super::BASIS_POINTS
        } else {
            0
        };

        let net_payout = gross_payout.saturating_sub(house_edge_amount);
        
        Ok(GameResult {
            outcome: outcome.to_vec(),
            multiplier,
            payout: net_payout,
            house_edge_taken: house_edge_amount,
            treasury_fee_taken: 0, // Calculated separately
        })
    }
}
