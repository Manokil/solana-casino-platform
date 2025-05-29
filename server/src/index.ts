import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { validateRequest } from './middleware/validation';
import { metricsMiddleware } from './middleware/metrics';
import { setupDatabase } from './database';
import { setupRedis } from './cache/redis';
import { setupQueues } from './queues';
import { setupWebSocket } from './websocket';
import { setupCronJobs } from './jobs/cronJobs';
import { setupSwagger } from './docs/swagger';

// Route imports
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import casinoRoutes from './routes/casinos';
import gameRoutes from './routes/games';
import tournamentRoutes from './routes/tournaments';
import analyticsRoutes from './routes/analytics';
import adminRoutes from './routes/admin';
import webhookRoutes from './routes/webhooks';
import healthRoutes from './routes/health';

class CasinoServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.cors.origin,
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });
  }

  private async setupMiddleware(): Promise<void> {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Compression
    this.app.use(compression());

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    this.app.use(morgan('combined', {
      stream: { write: (message) => logger.info(message.trim()) }
    }));

    // Metrics
    this.app.use(metricsMiddleware);

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: config.rateLimit.max,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
          error: 'Too many requests from this IP, please try again later.',
          retryAfter: '15 minutes'
        });
      }
    });

    this.app.use('/api/', limiter);

    // Stricter rate limiting for auth endpoints
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: { error: 'Too many authentication attempts, please try again later.' }
    });

    this.app.use('/api/auth/', authLimiter);
  }

  private setupRoutes(): void {
    // Health check (no auth required)
    this.app.use('/health', healthRoutes);

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', authMiddleware, userRoutes);
    this.app.use('/api/casinos', authMiddleware, casinoRoutes);
    this.app.use('/api/games', authMiddleware, gameRoutes);
    this.app.use('/api/tournaments', authMiddleware, tournamentRoutes);
    this.app.use('/api/analytics', authMiddleware, analyticsRoutes);
    this.app.use('/api/admin', authMiddleware, adminRoutes);
    this.app.use('/api/webhooks', webhookRoutes);

    // API documentation
    setupSwagger(this.app);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
      });
    });

    // Global error handler
    this.app.use(errorHandler);
  }

  private async setupServices(): Promise<void> {
    try {
      // Database
      await setupDatabase();
      logger.info('Database connected successfully');

      // Redis
      await setupRedis();
      logger.info('Redis connected successfully');

      // Job queues
      await setupQueues();
      logger.info('Job queues initialized successfully');

      // WebSocket
      setupWebSocket(this.io);
      logger.info('WebSocket server initialized successfully');

      // Cron jobs
      setupCronJobs();
      logger.info('Cron jobs scheduled successfully');

    } catch (error) {
      logger.error('Failed to setup services:', error);
      throw error;
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      this.server.close(() => {
        logger.info('HTTP server closed');
        
        // Close database connections
        // Close Redis connections
        // Close other resources
        
        process.exit(0);
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  public async start(): Promise<void> {
    try {
      // Setup middleware
      await this.setupMiddleware();

      // Setup services
      await this.setupServices();

      // Setup routes
      this.setupRoutes();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      // Start server
      this.server.listen(config.port, () => {
        logger.info(`🚀 Casino server running on port ${config.port}`);
        logger.info(`📚 API documentation available at http://localhost:${config.port}/api-docs`);
        logger.info(`🏥 Health check available at http://localhost:${config.port}/health`);
        logger.info(`🌍 Environment: ${config.env}`);
      });

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new CasinoServer();
server.start().catch((error) => {
  logger.error('Failed to start casino server:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default server;
