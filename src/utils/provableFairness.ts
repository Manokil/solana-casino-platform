import SHA256 from 'crypto-js/sha256';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types for provable fairness
interface ServerSeed {
  hashed: string;
  revealed?: string;
  nonce: number;
  createdAt: number;
  usedAt?: number;
}

interface ClientSeed {
  value: string;
  createdAt: number;
}

interface ProvableFairnessState {
  serverSeeds: ServerSeed[];
  clientSeed: ClientSeed;
  setClientSeed: (seed: string) => void;
  addServerSeed: (hashedSeed: string) => void;
  revealServerSeed: (index: number, plainSeed: string) => boolean;
  getActiveServerSeed: () => ServerSeed | null;
  rotateServerSeed: () => void;
}

// Store for provable fairness
export const useProvableFairnessStore = create<ProvableFairnessState>()(
  persist(
    (set, get) => ({
      serverSeeds: [],
      clientSeed: {
        value: generateRandomString(16),
        createdAt: Date.now(),
      },
      setClientSeed: (seed: string) => set({
        clientSeed: {
          value: seed,
          createdAt: Date.now(),
        }
      }),
      addServerSeed: (hashedSeed: string) => set((state) => ({
        serverSeeds: [
          ...state.serverSeeds,
          {
            hashed: hashedSeed,
            nonce: state.serverSeeds.length,
            createdAt: Date.now(),
          }
        ]
      })),
      revealServerSeed: (index: number, plainSeed: string) => {
        const { serverSeeds } = get();
        if (index >= serverSeeds.length) return false;
        
        const seed = serverSeeds[index];
        const hashedPlainSeed = SHA256(plainSeed).toString();
        
        if (hashedPlainSeed !== seed.hashed) return false;
        
        set({
          serverSeeds: serverSeeds.map((s, i) => 
            i === index ? { ...s, revealed: plainSeed, usedAt: Date.now() } : s
          )
        });
        
        return true;
      },
      getActiveServerSeed: () => {
        const { serverSeeds } = get();
        return serverSeeds.find(seed => !seed.revealed) || null;
      },
      rotateServerSeed: () => {
        const newSeed = generateRandomString(32);
        const hashedSeed = SHA256(newSeed).toString();
        
        // Store the plain seed securely on the server in a real implementation
        // For demo purposes, we're just adding the hashed seed
        get().addServerSeed(hashedSeed);
      }
    }),
    {
      name: 'provable-fairness-storage',
    }
  )
);

// Helper function to generate random string
function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result;
}

// Initialize with a server seed if none exists
export const initializeProvableFairness = () => {
  const { serverSeeds, rotateServerSeed } = useProvableFairnessStore.getState();
  
  if (serverSeeds.length === 0) {
    rotateServerSeed();
  }
};

// Generate a provably fair result for coin flip (0 or 1)
export const generateCoinFlipResult = (
  serverSeed: string,
  clientSeed: string,
  nonce: number
): 'heads' | 'tails' => {
  const combinedSeed = `${serverSeed}-${clientSeed}-${nonce}`;
  const hash = SHA256(combinedSeed).toString();
  const hexValue = hash.substring(0, 8);
  const decimalValue = parseInt(hexValue, 16);
  
  return decimalValue % 2 === 0 ? 'heads' : 'tails';
};

// Generate a provably fair result for dice roll (1-100)
export const generateDiceRollResult = (
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number => {
  const combinedSeed = `${serverSeed}-${clientSeed}-${nonce}`;
  const hash = SHA256(combinedSeed).toString();
  const hexValue = hash.substring(0, 8);
  const decimalValue = parseInt(hexValue, 16);
  
  return (decimalValue % 100) + 1;
};

// Verify a previous result
export const verifyResult = (
  gameType: 'coinflip' | 'diceroll',
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  expectedResult: 'heads' | 'tails' | number
): boolean => {
  if (gameType === 'coinflip') {
    const result = generateCoinFlipResult(serverSeed, clientSeed, nonce);
    return result === expectedResult;
  } else if (gameType === 'diceroll') {
    const result = generateDiceRollResult(serverSeed, clientSeed, nonce);
    return result === expectedResult;
  }
  
  return false;
};
