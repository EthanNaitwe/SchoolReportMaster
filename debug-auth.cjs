#!/usr/bin/env node

// Debug script to test authentication system
const { storage } = require('./server/storage.js');
const { hashPassword, comparePasswords } = require('./server/replitAuth.js');

async function debugAuth() {
  console.log('🔍 Debugging authentication system...\n');

  try {
    // Test 1: Check storage initialization
    console.log('1. Testing storage initialization...');
    const stats = await storage.getDashboardStats();
    console.log('✅ Storage initialized successfully');
    console.log('   Dashboard stats:', stats);

    // Test 2: Check if users exist
    console.log('\n2. Checking for existing users...');
    const users = await storage.getAllUsers();
    console.log(`   Found ${users.length} users`);
    
    if (users.length > 0) {
      users.forEach(user => {
        console.log(`   - ${user.username} (${user.email}) - Active: ${user.isActive}`);
      });
    } else {
      console.log('   ⚠️  No users found - this might be the issue!');
    }

    // Test 3: Test user lookup
    console.log('\n3. Testing user lookup...');
    const testUsername = 'admin';
    const user = await storage.getUserByUsername(testUsername);
    
    if (user) {
      console.log(`   ✅ Found user: ${user.username}`);
      console.log(`   User details:`, {
        id: user.id,
        username: user.username,
        email: user.email,
        isActive: user.isActive,
        hasPassword: !!user.password
      });
    } else {
      console.log(`   ❌ User '${testUsername}' not found`);
    }

    // Test 4: Test password comparison
    if (user) {
      console.log('\n4. Testing password comparison...');
      const testPassword = 'admin123';
      const isValid = await comparePasswords(testPassword, user.password);
      console.log(`   Password '${testPassword}' is ${isValid ? 'valid' : 'invalid'}`);
    }

    // Test 5: Test user creation if no users exist
    if (users.length === 0) {
      console.log('\n5. Creating test user...');
      try {
        const newUser = await storage.createUser({
          username: 'admin',
          email: 'admin@tamayuz.edu',
          password: 'admin123',
          firstName: 'Admin',
          lastName: 'User',
          isActive: true
        });
        console.log(`   ✅ Created test user: ${newUser.username}`);
      } catch (error) {
        console.error('   ❌ Failed to create test user:', error.message);
      }
    }

    console.log('\n🎉 Authentication system debug completed!');

  } catch (error) {
    console.error('\n❌ Debug failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the debug
debugAuth().catch(console.error); 