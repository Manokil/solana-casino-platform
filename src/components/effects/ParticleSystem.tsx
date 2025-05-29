import React, { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'spark' | 'confetti' | 'coin' | 'star' | 'explosion';
  rotation: number;
  rotationSpeed: number;
}

interface ParticleSystemProps {
  trigger?: boolean;
  type?: 'win' | 'jackpot' | 'spin' | 'flip' | 'explosion';
  intensity?: 'low' | 'medium' | 'high' | 'extreme';
  duration?: number;
  colors?: string[];
  position?: { x: number; y: number };
  className?: string;
}

const PARTICLE_CONFIGS = {
  win: {
    count: 30,
    colors: ['#00ff88', '#00d4ff', '#ffd700', '#ff6b35'],
    types: ['confetti', 'star'] as const,
    spread: 120,
    velocity: 8,
  },
  jackpot: {
    count: 100,
    colors: ['#ffd700', '#ffed4e', '#ff6b35', '#ff4757'],
    types: ['coin', 'star', 'confetti'] as const,
    spread: 180,
    velocity: 12,
  },
  spin: {
    count: 20,
    colors: ['#00d4ff', '#3742fa', '#a55eea'],
    types: ['spark'] as const,
    spread: 360,
    velocity: 6,
  },
  flip: {
    count: 15,
    colors: ['#ffd700', '#c0c0c0'],
    types: ['coin', 'spark'] as const,
    spread: 90,
    velocity: 5,
  },
  explosion: {
    count: 50,
    colors: ['#ff4757', '#ff6b35', '#ffa502', '#ffed4e'],
    types: ['explosion', 'spark'] as const,
    spread: 360,
    velocity: 10,
  },
};

const ParticleSystem: React.FC<ParticleSystemProps> = ({
  trigger = false,
  type = 'win',
  intensity = 'medium',
  duration = 3000,
  colors,
  position = { x: 50, y: 50 },
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const config = PARTICLE_CONFIGS[type];
  const intensityMultiplier = {
    low: 0.5,
    medium: 1,
    high: 1.5,
    extreme: 2.5,
  }[intensity];

  const particleColors = colors || config.colors;

  // Create particles
  const createParticles = useCallback((centerX: number, centerY: number) => {
    const particleCount = Math.floor(config.count * intensityMultiplier);
    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * (config.spread * Math.PI / 180);
      const velocity = config.velocity * (0.5 + Math.random() * 0.5) * intensityMultiplier;
      const particleType = config.types[Math.floor(Math.random() * config.types.length)];
      
      newParticles.push({
        id: Date.now() + i,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        size: (2 + Math.random() * 6) * intensityMultiplier,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
        life: duration,
        maxLife: duration,
        type: particleType,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
      });
    }

    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, [config, intensityMultiplier, particleColors, duration]);

  // Update particles
  const updateParticles = useCallback((deltaTime: number) => {
    particlesRef.current = particlesRef.current.filter(particle => {
      // Update position
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      
      // Apply gravity
      particle.vy += 0.3 * deltaTime;
      
      // Apply air resistance
      particle.vx *= 0.99;
      particle.vy *= 0.99;
      
      // Update rotation
      particle.rotation += particle.rotationSpeed * deltaTime;
      
      // Update life
      particle.life -= deltaTime * 16.67; // Assuming 60fps
      
      return particle.life > 0;
    });
  }, []);

  // Render particles
  const renderParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    particlesRef.current.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      
      ctx.globalAlpha = alpha;
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      
      switch (particle.type) {
        case 'confetti':
          ctx.fillStyle = particle.color;
          ctx.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
          break;
          
        case 'coin':
          // Draw coin with gradient
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
          gradient.addColorStop(0, particle.color);
          gradient.addColorStop(1, particle.color + '80');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
          ctx.fill();
          
          // Add shine effect
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.beginPath();
          ctx.arc(-particle.size / 3, -particle.size / 3, particle.size / 3, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'star':
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5;
            const x = Math.cos(angle) * particle.size;
            const y = Math.sin(angle) * particle.size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            
            const innerAngle = ((i + 0.5) * Math.PI * 2) / 5;
            const innerX = Math.cos(innerAngle) * particle.size * 0.5;
            const innerY = Math.sin(innerAngle) * particle.size * 0.5;
            ctx.lineTo(innerX, innerY);
          }
          ctx.closePath();
          ctx.fill();
          break;
          
        case 'spark':
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = particle.size / 2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-particle.size, 0);
          ctx.lineTo(particle.size, 0);
          ctx.stroke();
          break;
          
        case 'explosion':
          const explosionGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
          explosionGradient.addColorStop(0, particle.color);
          explosionGradient.addColorStop(0.5, particle.color + 'AA');
          explosionGradient.addColorStop(1, particle.color + '00');
          ctx.fillStyle = explosionGradient;
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
      
      ctx.restore();
    });
  }, []);

  // Animation loop
  const animate = useCallback((currentTime: number) => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const deltaTime = (currentTime - lastTimeRef.current) / 16.67; // Normalize to 60fps
    lastTimeRef.current = currentTime;
    
    updateParticles(deltaTime);
    renderParticles(ctx);
    
    if (particlesRef.current.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [updateParticles, renderParticles]);

  // Handle trigger
  useEffect(() => {
    if (trigger && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const centerX = (position.x / 100) * canvas.width;
      const centerY = (position.y / 100) * canvas.height;
      
      createParticles(centerX, centerY);
      
      if (!animationRef.current) {
        lastTimeRef.current = performance.now();
        animationRef.current = requestAnimationFrame(animate);
      }
    }
  }, [trigger, position, createParticles, animate]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-10 ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

// Preset particle effects components
export const WinParticles: React.FC<{ trigger: boolean; position?: { x: number; y: number } }> = ({ 
  trigger, 
  position 
}) => (
  <ParticleSystem 
    trigger={trigger} 
    type="win" 
    intensity="high" 
    position={position}
  />
);

export const JackpotParticles: React.FC<{ trigger: boolean; position?: { x: number; y: number } }> = ({ 
  trigger, 
  position 
}) => (
  <ParticleSystem 
    trigger={trigger} 
    type="jackpot" 
    intensity="extreme" 
    duration={5000}
    position={position}
  />
);

export const SpinParticles: React.FC<{ trigger: boolean; position?: { x: number; y: number } }> = ({ 
  trigger, 
  position 
}) => (
  <ParticleSystem 
    trigger={trigger} 
    type="spin" 
    intensity="medium" 
    duration={2000}
    position={position}
  />
);

export const FlipParticles: React.FC<{ trigger: boolean; position?: { x: number; y: number } }> = ({ 
  trigger, 
  position 
}) => (
  <ParticleSystem 
    trigger={trigger} 
    type="flip" 
    intensity="medium" 
    duration={2500}
    position={position}
  />
);

export const ExplosionParticles: React.FC<{ trigger: boolean; position?: { x: number; y: number } }> = ({ 
  trigger, 
  position 
}) => (
  <ParticleSystem 
    trigger={trigger} 
    type="explosion" 
    intensity="high" 
    duration={1500}
    position={position}
  />
);

export default ParticleSystem;
