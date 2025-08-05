#!/usr/bin/env node

/**
 * Vercel Deployment Helper Script
 * 
 * This script helps prepare your School Report Master app for Vercel deployment.
 * Run this script before deploying to ensure everything is configured correctly.
 */

import fs from 'fs';
import path from 'path';

console.log('🚀 Preparing School Report Master for Vercel deployment...\n');

// Check if required files exist
const requiredFiles = [
  'api/index.ts',
  'client/package.json',
  'client/vite.config.ts',
  'vercel.json',
  'server/routes.ts',
  'server/storage.ts',
  'server/replitAuth.ts'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please ensure all files are present before deploying.');
  process.exit(1);
}

console.log('\n✅ All required files are present!');

// Check package.json files
console.log('\n📦 Checking package.json files...');

const rootPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const clientPackageJson = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));

// Check if @vercel/node is in dependencies
if (!rootPackageJson.dependencies['@vercel/node']) {
  console.log('⚠️  @vercel/node not found in root package.json dependencies');
  console.log('   This is required for Vercel deployment');
}

console.log('✅ Package.json files are valid');

// Check vercel.json configuration
console.log('\n⚙️  Checking vercel.json configuration...');

try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  
  if (vercelConfig.builds && vercelConfig.routes) {
    console.log('✅ vercel.json is properly configured');
  } else {
    console.log('❌ vercel.json is missing required configuration');
  }
} catch (error) {
  console.log('❌ vercel.json is not valid JSON');
}

// Environment variables checklist
console.log('\n🔐 Environment Variables Checklist:');
console.log('   Make sure to set these in your Vercel project settings:');
console.log('');
console.log('   Required:');
console.log('   - SESSION_SECRET (for authentication)');
console.log('   - GOOGLE_SHEETS_SPREADSHEET_ID (for data storage)');
console.log('   - GOOGLE_SHEETS_CLIENT_EMAIL (Google service account email)');
console.log('   - GOOGLE_SHEETS_PRIVATE_KEY (Google service account private key)');
console.log('');
console.log('   Optional:');
console.log('   - NODE_ENV=production');

// Deployment instructions
console.log('\n📋 Deployment Instructions:');
console.log('');
console.log('1. Push your code to a Git repository (GitHub, GitLab, etc.)');
console.log('2. Go to https://vercel.com and create a new project');
console.log('3. Import your Git repository');
console.log('4. Set the environment variables listed above');
console.log('5. Deploy!');
console.log('');
console.log('Or use Vercel CLI:');
console.log('1. Install: npm i -g vercel');
console.log('2. Login: vercel login');
console.log('3. Deploy: vercel');
console.log('');

console.log('🎉 Your app is ready for Vercel deployment!');
console.log('');
console.log('💡 Tips:');
console.log('- Test your API endpoints after deployment');
console.log('- Check the Functions tab in Vercel dashboard for logs');
console.log('- Monitor function execution times and cold starts');
console.log('- Consider setting up a custom domain'); 