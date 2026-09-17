import { spawn } from 'child_process';
import app from './app';
import prisma from './config/database';
import config from './config/env';

const PORT = config.PORT || 5000;

// ── Ollama auto-start ──────────────────────────────────────────────────────────

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const AI_PROVIDER     = process.env.AI_PROVIDER     || 'gemini';

/** Returns true if Ollama is already responding. */
async function isOllamaRunning(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Spawns `ollama serve` in the background (detached so it survives nodemon reloads). */
function startOllamaProcess(): void {
  const proc = spawn('ollama', ['serve'], {
    detached: true,
    stdio:    'ignore',
  });
  proc.unref(); // allow the Node process to exit independently
  console.log('🦙 Ollama process started (PID may be detached)');
}

/** Waits up to `maxWaitMs` for Ollama to become ready, polling every `intervalMs`. */
async function waitForOllama(maxWaitMs = 30_000, intervalMs = 1_000): Promise<boolean> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    if (await isOllamaRunning()) return true;
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return false;
}

/** Ensures Ollama is running; starts it if necessary. Only runs when AI_PROVIDER=ollama. */
async function ensureOllama(): Promise<void> {
  const needsOllama =
    AI_PROVIDER === 'ollama' ||
    (AI_PROVIDER === 'gemini' && !process.env.GEMINI_API_KEY);

  if (!needsOllama) return;

  console.log('🦙 Checking Ollama status...');

  if (await isOllamaRunning()) {
    console.log('✅ Ollama is already running');
    return;
  }

  console.log('⏳ Ollama not detected — starting it now...');
  startOllamaProcess();

  const ready = await waitForOllama();
  if (ready) {
    console.log('✅ Ollama is ready');
  } else {
    console.warn('⚠️  Ollama did not become ready within 30 s — AI features may be unavailable');
  }
}

// ── Bootstrap ──────────────────────────────────────────────────────────────────

async function bootstrap() {
  // Start Ollama before Express so first AI request doesn't time out
  await ensureOllama();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running in ${config.NODE_ENV} mode`);
    console.log(`📡 Listening on port ${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
    console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: Error) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => process.exit(1));
  });

  // Graceful shutdown handler
  const shutdown = async (signal: string) => {
    console.log(`👋 ${signal} RECEIVED. Shutting down gracefully...`);

    server.close(async () => {
      console.log('🛑 Server closed');
      try {
        await prisma.$disconnect();
        console.log('✅ Database connection closed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Failed to close database connection:', error);
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('⏰ Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

bootstrap().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
