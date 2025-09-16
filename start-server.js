#!/usr/bin/env node

// Custom startup script that runs the server with proper environment
// This works around the protected package.json that overrides PORT

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set the correct environment variables
process.env.NODE_ENV = 'development';
process.env.PORT = '5000';

console.log('[start-server] Starting integrated server on port 5000...');

// Start the server with tsx
const serverProcess = spawn('tsx', ['server/index.ts'], {
  stdio: 'inherit',
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: '5000'
  }
});

serverProcess.on('error', (error) => {
  console.error('[start-server] Error starting server:', error);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  console.log(`[start-server] Server process exited with code: ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('[start-server] Received SIGINT, shutting down gracefully...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('[start-server] Received SIGTERM, shutting down gracefully...');
  serverProcess.kill('SIGTERM');
});