#!/usr/bin/env node

// Development script to run backend and frontend on separate ports
import { spawn } from 'child_process';

console.log('🚀 Starting development environment...');
console.log('📡 Backend will run on http://localhost:3000');
console.log('🎨 Frontend will run on http://localhost:5000');
console.log('');

// Start backend server
const backend = spawn('tsx', ['server/index.ts'], {
  stdio: 'pipe',
  env: { ...process.env, NODE_ENV: 'development' }
});

// Start frontend dev server with custom config
const frontend = spawn('vite', ['--config', 'client/vite.config.local.ts', '--port', '5000', '--host', '0.0.0.0'], {
  stdio: 'pipe',
  env: { ...process.env }
});

// Handle backend output
backend.stdout.on('data', (data) => {
  process.stdout.write(`[BACKEND] ${data}`);
});

backend.stderr.on('data', (data) => {
  process.stderr.write(`[BACKEND] ${data}`);
});

// Handle frontend output
frontend.stdout.on('data', (data) => {
  process.stdout.write(`[FRONTEND] ${data}`);
});

frontend.stderr.on('data', (data) => {
  process.stderr.write(`[FRONTEND] ${data}`);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down development servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});

backend.on('close', (code) => {
  console.log(`Backend process exited with code ${code}`);
  frontend.kill();
  process.exit(code);
});

frontend.on('close', (code) => {
  console.log(`Frontend process exited with code ${code}`);
  backend.kill();
  process.exit(code);
});