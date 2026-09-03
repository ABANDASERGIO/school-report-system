import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { settingsService } from './services/settings.service';

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Seed default settings (idempotent)
    await settingsService.seedDefaults();
    console.log('✅ Default settings seeded');

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(env.port, () => {
      console.log(`🚀 Server running on port ${env.port}`);
      console.log(`📍 Health check: http://localhost:${env.port}/health`);
      console.log(`🔗 API base: http://localhost:${env.port}/api/v1`);
      console.log(`🌍 Environment: ${env.nodeEnv}`);
      console.log(`🎯 Frontend URL: ${env.frontendUrl}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      server.close(async () => {
        console.log('HTTP server closed');
        await disconnectDatabase();
        console.log('Database disconnected');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
