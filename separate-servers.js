#!/usr/bin/env node

// Script to run backend and frontend on separate ports concurrently
import { spawn } from 'child_process';

console.log('Starting separate server development mode...');
console.log('Backend API: http://localhost:3001');
console.log('Frontend: http://localhost:5000');

// Use concurrently to run both servers
const concurrently = spawn('npx', [
  'concurrently',
  '--prefix', '[{name}]',
  '--names', 'backend,frontend',
  '--prefix-colors', 'blue,green',
  'NODE_ENV=development tsx server/index.ts',
  'vite --config client/vite.config.local.ts --port 5000 --host 0.0.0.0'
], {
  stdio: 'inherit',
  env: { ...process.env }
});

process.on('SIGTERM', () => concurrently.kill());
process.on('SIGINT', () => concurrently.kill());

concurrently.on('close', (code) => {
  process.exit(code);
});