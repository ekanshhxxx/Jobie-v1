// Quick Stream test with new credentials
const { StreamClient } = require('@stream-io/node-sdk');

const apiKey = 'nw8r4gpvmzzu';
const apiSecret = '2v5qrc5cwjzrq6nwnzm7mwdhn9dmkqjxd5fg3yv5jfr37bxs6zdeqqs4zt2bmmbp';

console.log('🧪 Testing new Stream API credentials...\n');

const client = new StreamClient(apiKey, apiSecret, { timeout: 10000 });

async function test() {
  try {
    console.log('⏳ Creating test user...');
    await client.upsertUsers([{
      id: 'test-user-' + Date.now(),
      name: 'Test User',
      image: 'https://i.pravatar.cc/300',
    }]);
    console.log('✅ SUCCESS! Stream API is working perfectly!\n');
    console.log('Your backend will now be able to:');
    console.log('  • Create chat channels');
    console.log('  • Send messages between candidates and recruiters');
    console.log('  • Handle video interviews');
    process.exit(0);
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    if (error.code) console.error('   Error code:', error.code);
    process.exit(1);
  }
}

test();
