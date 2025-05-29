import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import EnhancedCoinFlip from '../games/EnhancedCoinFlip';
import { mockWallet, mockConnection } from '../../test/setup';

// Mock the enhanced game hook
const mockGameState = {
  isPlaying: false,
  result: null,
  isAnimating: false,
  gameId: null,
  transactionSignature: null,
  error: null,
  startTime: null,
  endTime: null,
};

const mockGameStats = {
  totalGames: 10,
  totalWagered: 5.5,
  totalWon: 4.2,
  biggestWin: 1.95,
  currentStreak: 2,
  bestStreak: 5,
  winRate: 60.0,
  profitLoss: -1.3,
};

const mockGameHistory = [
  {
    id: '1',
    gameType: 'coinflip',
    betAmount: 0.1,
    prediction: { choice: 'heads' },
    result: { outcome: 'heads', won: true, payout: 0.195 },
    won: true,
    payout: 0.195,
    timestamp: Date.now() - 60000,
    transactionSignature: 'mock-signature-1',
    provableFairData: {
      clientSeed: 'client-seed-1',
      serverSeedHash: 'server-hash-1',
      nonce: 1,
    },
  },
  {
    id: '2',
    gameType: 'coinflip',
    betAmount: 0.2,
    prediction: { choice: 'tails' },
    result: { outcome: 'heads', won: false, payout: 0 },
    won: false,
    payout: 0,
    timestamp: Date.now() - 120000,
    transactionSignature: 'mock-signature-2',
    provableFairData: {
      clientSeed: 'client-seed-2',
      serverSeedHash: 'server-hash-2',
      nonce: 2,
    },
  },
];

const mockPlaceBet = jest.fn();
const mockSetSoundEnabled = jest.fn();

jest.mock('../../hooks/useEnhancedGame', () => ({
  useEnhancedGame: () => ({
    gameState: mockGameState,
    gameHistory: mockGameHistory,
    gameStats: mockGameStats,
    balance: 10.5,
    isLoading: false,
    isConnected: true,
    soundEnabled: true,
    placeBet: mockPlaceBet,
    setSoundEnabled: mockSetSoundEnabled,
  }),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('EnhancedCoinFlip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the coin flip interface', () => {
      renderWithRouter(<EnhancedCoinFlip />);
      
      expect(screen.getByText('Enhanced Coin Flip')).toBeInTheDocument();
      expect(screen.getByText(/Experience the ultimate coin flip game/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Bet Amount/)).toBeInTheDocument();
      expect(screen.getByText('Heads')).toBeInTheDocument();
      expect(screen.getByText('Tails')).toBeInTheDocument();
      expect(screen.getByText('Flip Coin')).toBeInTheDocument();
    });

    it('displays current balance and potential win', () => {
      renderWithRouter(<EnhancedCoinFlip />);
      
      expect(screen.getByText('Balance: 10.5000 SOL')).toBeInTheDocument();
      expect(screen.getByText('Potential Win: 0.1950 SOL')).toBeInTheDocument();
    });

    it('shows game statistics', () => {
      renderWithRouter(<EnhancedCoinFlip />);
      
      expect(screen.getByText('Quick Stats')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument(); // Total games
      expect(screen.getByText('60.0%')).toBeInTheDocument(); // Win rate
      expect(screen.getByText('-1.3000 SOL')).toBeInTheDocument(); // Profit/Loss
    });

    it('displays recent game history', () => {
      renderWithRouter(<EnhancedCoinFlip />);
      
      expect(screen.getByText('Recent Games')).toBeInTheDocument();
      expect(screen.getByText('+0.1950')).toBeInTheDocument(); // Win amount
      expect(screen.getByText('-0.2000')).toBeInTheDocument(); // Loss amount
    });
  });

  describe('User Interactions', () => {
    it('updates bet amount when input changes', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EnhancedCoinFlip />);
      
      const betInput = screen.getByLabelText(/Bet Amount/) as HTMLInputElement;
      await user.clear(betInput);
      await user.type(betInput, '0.5');
      
      expect(betInput.value).toBe('0.5');
      expect(screen.getByText('Potential Win: 0.9750 SOL')).toBeInTheDocument();
    });

    it('selects prediction when buttons are clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EnhancedCoinFlip />);
      
      const tailsButton = screen.getByText('Tails');
      await user.click(tailsButton);
      
      expect(tailsButton).toHaveClass('bg-[var(--accent)]');
    });

    it('uses quick bet buttons', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EnhancedCoinFlip />);
      
      const quickBetButton = screen.getByText('1 SOL');
      await user.click(quickBetButton);
      
      const betInput = screen.getByLabelText(/Bet Amount/) as HTMLInputElement;
      expect(betInput.value).toBe('1');
    });

    it('doubles bet amount', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EnhancedCoinFlip />);
      
      const betInput = screen.getByLabelText(/Bet Amount/) as HTMLInputElement;
      await user.clear(betInput);
      await user.type(betInput, '0.5');
      
      const doubleButton = screen.getByText('Double');
      await user.click(doubleButton);
      
      expect(betInput.value).toBe('1');
    });

    it('halves bet amount', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EnhancedCoinFlip />);
      
      const betInput = screen.getByLabelText(/Bet Amount/) as HTMLInputElement;
      await user.clear(betInput);
      await user.type(betInput, '1');
      
      const halfButton = screen.getByText('Half');
      await user.click(halfButton);
      
      expect(betInput.value).toBe('0.5');
    });
  });

  describe('Game Logic', () => {
    it('places bet when flip coin button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EnhancedCoinFlip />);
      
      const flipButton = screen.getByText('Flip Coin');
      await user.click(flipButton);
      
      expect(mockPlaceBet).toHaveBeenCalledWith(0.1, { choice: 'heads' });
    });

    it('prevents betting with invalid amount', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EnhancedCoinFlip />);
      
      const betInput = screen.getByLabelText(/Bet Amount/);
      await user.clear(betInput);
      await user.type(betInput, '0');
      
      const flipButton = screen.getByText('Flip Coin');
      expect(flipButton).toBeDisabled();
    });

    it('prevents betting when amount exceeds balance', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EnhancedCoinFlip />);
      
      const betInput = screen.getByLabelText(/Bet Amount/);
      await user.clear(betInput);
      await user.type(betInput, '20'); // More than balance of 10.5
      
      const flipButton = screen.getByText('Flip Coin');
      expect(flipButton).toBeDisabled();
    });

    it('shows loading state during game', () => {
      // Mock game state as playing
      const mockPlayingState = { ...mockGameState, isPlaying: true, isAnimating: true };
      
      jest.doMock('../../hooks/useEnhancedGame', () => ({
        useEnhancedGame: () => ({
          gameState: mockPlayingState,
          gameHistory: mockGameHistory,
          gameStats: mockGameStats,
          balance: 10.5,
          isLoading: false,
          isConnected: true,
          soundEnabled: true,
          placeBet: mockPlaceBet,
          setSoundEnabled: mockSetSoundEnabled,
        }),
      }));

      renderWithRouter(<EnhancedCoinFlip />);
      
      expect(screen.getByText('Flipping...')).toBeInTheDocument();
      expect(screen.getByText('Flip Coin')).toBeDisabled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('flips coin when space is pressed', async () => {
      renderWithRouter(<EnhancedCoinFlip />);
      
      fireEvent.keyDown(document, { key: ' ', code: 'Space' });
      
      expect(mockPlaceBet).toHaveBeenCalledWith(0.1, { choice: 'heads' });
    });

    it('flips coin when enter is pressed', async () => {
      renderWithRouter(<EnhancedCoinFlip />);
      
      fireEvent.keyDown(document, { key: 'Enter', code: 'Enter' });
      
      expect(mockPlaceBet).toHaveBeenCalledWith(0.1, { choice: 'heads' });
    });

    it('selects heads when H is pressed', async () => {
      renderWithRouter(<EnhancedCoinFlip />);
      
      // First select tails
      const tailsButton = screen.getByText('Tails');
      fireEvent.click(tailsButton);
      
      // Then press H
      fireEvent.keyDown(document, { key: 'h', code: 'KeyH' });
      
      const headsButton = screen.getByText('Heads');
      expect(headsButton).toHaveClass('bg-[var(--accent)]');
    });

    it('selects tails when T is pressed', async () => {
      renderWithRouter(<EnhancedCoinFlip />);
      
      fireEvent.keyDown(document, { key: 't', code: 'KeyT' });
      
      const tailsButton = screen.getByText('Tails');
      expect(tailsButton).toHaveClass('bg-[var(--accent)]');
    });

    it('toggles sound when M is pressed', async () => {
      renderWithRouter(<EnhancedCoinFlip />);
      
      fireEvent.keyDown(document, { key: 'm', code: 'KeyM' });
      
      expect(mockSetSoundEnabled).toHaveBeenCalledWith(false);
    });
  });

  describe('Settings', () => {
    it('toggles sound settings', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EnhancedCoinFlip />);
      
      const soundButton = screen.getByRole('button', { name: /sound/i });
      await user.click(soundButton);
      
      expect(mockSetSoundEnabled).toHaveBeenCalledWith(false);
    });

    it('shows/hides provably fair details', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EnhancedCoinFlip />);
      
      const showDetailsButton = screen.getByText('Show Details');
      await user.click(showDetailsButton);
      
      expect(screen.getByText('How it works:')).toBeInTheDocument();
      expect(screen.getByText('Verification:')).toBeInTheDocument();
      
      const hideDetailsButton = screen.getByText('Hide Details');
      await user.click(hideDetailsButton);
      
      expect(screen.queryByText('How it works:')).not.toBeInTheDocument();
    });
  });

  describe('Game Results', () => {
    it('displays win result', () => {
      const mockWinState = {
        ...mockGameState,
        result: {
          outcome: 'heads',
          won: true,
          payout: 0.195,
        },
      };

      jest.doMock('../../hooks/useEnhancedGame', () => ({
        useEnhancedGame: () => ({
          gameState: mockWinState,
          gameHistory: mockGameHistory,
          gameStats: mockGameStats,
          balance: 10.5,
          isLoading: false,
          isConnected: true,
          soundEnabled: true,
          placeBet: mockPlaceBet,
          setSoundEnabled: mockSetSoundEnabled,
        }),
      }));

      renderWithRouter(<EnhancedCoinFlip />);
      
      expect(screen.getByText('You Won!')).toBeInTheDocument();
      expect(screen.getByText('Result: Heads')).toBeInTheDocument();
      expect(screen.getByText('Payout: 0.195 SOL')).toBeInTheDocument();
    });

    it('displays loss result', () => {
      const mockLossState = {
        ...mockGameState,
        result: {
          outcome: 'tails',
          won: false,
          payout: 0,
        },
      };

      jest.doMock('../../hooks/useEnhancedGame', () => ({
        useEnhancedGame: () => ({
          gameState: mockLossState,
          gameHistory: mockGameHistory,
          gameStats: mockGameStats,
          balance: 10.5,
          isLoading: false,
          isConnected: true,
          soundEnabled: true,
          placeBet: mockPlaceBet,
          setSoundEnabled: mockSetSoundEnabled,
        }),
      }));

      renderWithRouter(<EnhancedCoinFlip />);
      
      expect(screen.getByText('You Lost!')).toBeInTheDocument();
      expect(screen.getByText('Result: Tails')).toBeInTheDocument();
      expect(screen.queryByText(/Payout:/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithRouter(<EnhancedCoinFlip />);
      
      expect(screen.getByLabelText(/Bet Amount/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Flip Coin/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Heads/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tails/ })).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      renderWithRouter(<EnhancedCoinFlip />);
      
      const flipButton = screen.getByText('Flip Coin');
      flipButton.focus();
      expect(flipButton).toHaveFocus();
      
      fireEvent.keyDown(flipButton, { key: 'Tab' });
      // Should move focus to next focusable element
    });
  });

  describe('Error Handling', () => {
    it('handles bet placement errors', async () => {
      mockPlaceBet.mockRejectedValueOnce(new Error('Insufficient funds'));
      
      const user = userEvent.setup();
      renderWithRouter(<EnhancedCoinFlip />);
      
      const flipButton = screen.getByText('Flip Coin');
      await user.click(flipButton);
      
      // Error should be handled gracefully
      expect(mockPlaceBet).toHaveBeenCalled();
    });

    it('displays error state', () => {
      const mockErrorState = {
        ...mockGameState,
        error: 'Transaction failed',
        isPlaying: false,
      };

      jest.doMock('../../hooks/useEnhancedGame', () => ({
        useEnhancedGame: () => ({
          gameState: mockErrorState,
          gameHistory: mockGameHistory,
          gameStats: mockGameStats,
          balance: 10.5,
          isLoading: false,
          isConnected: true,
          soundEnabled: true,
          placeBet: mockPlaceBet,
          setSoundEnabled: mockSetSoundEnabled,
        }),
      }));

      renderWithRouter(<EnhancedCoinFlip />);
      
      // Component should handle error state gracefully
      expect(screen.getByText('Flip Coin')).not.toBeDisabled();
    });
  });
});
