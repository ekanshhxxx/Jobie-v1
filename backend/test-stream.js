// Quick test script to verify Stream API credentials
require('dotenv').config();
const { StreamClient } = require('@stream-io/node-sdk');

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

console.log('Testing Stream API credentials...');
console.log('API Key:', apiKey ? `${apiKey.substring(0, 6)}...` : 'NOT SET');
console.log('API Secret:', apiSecret ? `${apiSecret.substring(0, 6)}...` : 'NOT SET');

if (!apiKey || !apiSecret) {
  console.error('❌ Stream credentials not configured in .env');
  process.exit(1);
}

const client = new StreamClient(apiKey, apiSecret, { timeout: 10000 });

async function testConnection() {
  try {
    console.log('\nAttempting to upsert test user...');
    await client.upsertUsers([
      {
        id: 'test-user-123',
        name: 'Test User',
        image: 'https://i.pravatar.cc/300',
      },
    ]);
    console.log('✅ Stream API connection successful!');
    console.log('✅ Credentials are valid and working');
  } catch (error) {
    console.error('❌ Stream API connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('timeout')) {
      console.error('\n💡 Timeout suggests:');
      console.error('   - Network connectivity issues');
      console.error('   - Firewall blocking Stream API');
      console.error('   - Stream service might be down');
    } else if (error.code === 4) {
      console.error('\n💡 Error code 4 suggests:');
      console.error('   - Invalid API credentials');
      console.error('   - Stream account not active');
      console.error('   - API key/secret mismatch');
    }
  }
}

testConnection().then(() => process.exit(0));
