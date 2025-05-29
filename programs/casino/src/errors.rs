use anchor_lang::prelude::*;

#[error_code]
pub enum CasinoError {
    #[msg("Bet amount is too small")]
    BetTooSmall,
    
    #[msg("Bet amount is too large")]
    BetTooLarge,
    
    #[msg("Invalid house edge percentage")]
    InvalidHouseEdge,
    
    #[msg("Invalid treasury fee percentage")]
    InvalidTreasuryFee,
    
    #[msg("Casino is not active")]
    CasinoNotActive,
    
    #[msg("Casino is paused")]
    CasinoPaused,
    
    #[msg("Insufficient funds in vault")]
    InsufficientVaultFunds,
    
    #[msg("Game cannot be resolved")]
    CannotResolveGame,
    
    #[msg("Game cannot be cancelled")]
    CannotCancelGame,
    
    #[msg("Game has expired")]
    GameExpired,
    
    #[msg("Game has not expired")]
    GameNotExpired,
    
    #[msg("Cannot expire game")]
    CannotExpireGame,
    
    #[msg("Cannot claim winnings")]
    CannotClaimWinnings,
    
    #[msg("Invalid prediction format")]
    InvalidPrediction,
    
    #[msg("Invalid server seed")]
    InvalidServerSeed,
    
    #[msg("Invalid client seed")]
    InvalidClientSeed,
    
    #[msg("Provable fairness verification failed")]
    ProvableFairnessVerificationFailed,
    
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Invalid token mint")]
    InvalidTokenMint,
    
    #[msg("Invalid token account")]
    InvalidTokenAccount,
    
    #[msg("Token transfer failed")]
    TokenTransferFailed,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("Arithmetic underflow")]
    ArithmeticUnderflow,
    
    #[msg("Invalid game type")]
    InvalidGameType,
    
    #[msg("Game already resolved")]
    GameAlreadyResolved,
    
    #[msg("Game already claimed")]
    GameAlreadyClaimed,
    
    #[msg("Player not found")]
    PlayerNotFound,
    
    #[msg("Tournament not found")]
    TournamentNotFound,
    
    #[msg("Tournament is full")]
    TournamentFull,
    
    #[msg("Tournament has not started")]
    TournamentNotStarted,
    
    #[msg("Tournament has ended")]
    TournamentEnded,
    
    #[msg("Already joined tournament")]
    AlreadyJoinedTournament,
    
    #[msg("Invalid tournament entry fee")]
    InvalidTournamentEntryFee,
    
    #[msg("Cannot finalize tournament")]
    CannotFinalizeTournament,
    
    #[msg("Invalid payout calculation")]
    InvalidPayoutCalculation,
    
    #[msg("Maximum payout exceeded")]
    MaxPayoutExceeded,
    
    #[msg("Invalid nonce")]
    InvalidNonce,
    
    #[msg("Seed already used")]
    SeedAlreadyUsed,
    
    #[msg("Invalid timestamp")]
    InvalidTimestamp,
    
    #[msg("Account already initialized")]
    AccountAlreadyInitialized,
    
    #[msg("Account not initialized")]
    AccountNotInitialized,
    
    #[msg("Invalid account owner")]
    InvalidAccountOwner,
    
    #[msg("Invalid program ID")]
    InvalidProgramId,
    
    #[msg("Invalid instruction data")]
    InvalidInstructionData,
    
    #[msg("Slippage tolerance exceeded")]
    SlippageToleranceExceeded,
    
    #[msg("Rate limit exceeded")]
    RateLimitExceeded,
    
    #[msg("Maintenance mode active")]
    MaintenanceModeActive,
    
    #[msg("Feature not implemented")]
    FeatureNotImplemented,
    
    #[msg("Invalid configuration")]
    InvalidConfiguration,
    
    #[msg("Insufficient permissions")]
    InsufficientPermissions,
    
    #[msg("Operation not allowed")]
    OperationNotAllowed,
    
    #[msg("Invalid state transition")]
    InvalidStateTransition,
    
    #[msg("Concurrent modification detected")]
    ConcurrentModification,
    
    #[msg("Resource temporarily unavailable")]
    ResourceTemporarilyUnavailable,
    
    #[msg("Invalid signature")]
    InvalidSignature,
    
    #[msg("Replay attack detected")]
    ReplayAttackDetected,
    
    #[msg("Invalid randomness source")]
    InvalidRandomnessSource,
    
    #[msg("Randomness not available")]
    RandomnessNotAvailable,
    
    #[msg("Oracle price feed stale")]
    OraclePriceFeedStale,
    
    #[msg("Oracle price feed invalid")]
    OraclePriceFeedInvalid,
    
    #[msg("Liquidation threshold reached")]
    LiquidationThresholdReached,
    
    #[msg("Emergency shutdown active")]
    EmergencyShutdownActive,
    
    #[msg("Circuit breaker triggered")]
    CircuitBreakerTriggered,
    
    #[msg("Daily limit exceeded")]
    DailyLimitExceeded,
    
    #[msg("Weekly limit exceeded")]
    WeeklyLimitExceeded,
    
    #[msg("Monthly limit exceeded")]
    MonthlyLimitExceeded,
    
    #[msg("Cooldown period active")]
    CooldownPeriodActive,
    
    #[msg("Invalid referral code")]
    InvalidReferralCode,
    
    #[msg("Self-referral not allowed")]
    SelfReferralNotAllowed,
    
    #[msg("Referral already used")]
    ReferralAlreadyUsed,
    
    #[msg("VIP level requirement not met")]
    VipLevelRequirementNotMet,
    
    #[msg("Bonus already claimed")]
    BonusAlreadyClaimed,
    
    #[msg("Bonus expired")]
    BonusExpired,
    
    #[msg("Wagering requirement not met")]
    WageringRequirementNotMet,
    
    #[msg("Geolocation restricted")]
    GeolocationRestricted,
    
    #[msg("Age verification required")]
    AgeVerificationRequired,
    
    #[msg("KYC verification required")]
    KycVerificationRequired,
    
    #[msg("Account suspended")]
    AccountSuspended,
    
    #[msg("Account banned")]
    AccountBanned,
    
    #[msg("Withdrawal limit exceeded")]
    WithdrawalLimitExceeded,
    
    #[msg("Deposit limit exceeded")]
    DepositLimitExceeded,
    
    #[msg("Loss limit exceeded")]
    LossLimitExceeded,
    
    #[msg("Session time limit exceeded")]
    SessionTimeLimitExceeded,
    
    #[msg("Responsible gambling limit reached")]
    ResponsibleGamblingLimitReached,
}
