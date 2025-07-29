#!/usr/bin/env node

// Simple development script to start both servers
import { spawn } from 'child_process';
import { createServer } from 'http';

// Start backend on port 3000
console.log('🚀 Starting backend server on port 3000...');
const backend = spawn('tsx', ['server/index.ts'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

// Wait a moment then start frontend on port 5000
setTimeout(() => {
  console.log('🎨 Starting frontend server on port 5000...');
  const frontend = spawn('vite', ['--config', 'client/vite.config.local.ts'], {
    stdio: 'inherit',
    env: { ...process.env }
  });

  // Handle termination
  process.on('SIGTERM', () => {
    backend.kill();
    frontend.kill();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    backend.kill();
    frontend.kill();
    process.exit(0);
  });

  frontend.on('close', (code) => {
    backend.kill();
    process.exit(code);
  });
}, 2000);

backend.on('close', (code) => {
  process.exit(code);
});