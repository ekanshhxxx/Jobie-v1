import { StreamClient } from '@stream-io/node-sdk';

const apiKey = process.env.STREAM_API_KEY || '';
const apiSecret = process.env.STREAM_API_SECRET || '';

// Initialize Stream client with increased timeout
export const streamClient = new StreamClient(apiKey, apiSecret, {
  timeout: 10000, // 10 seconds instead of default 3 seconds
});

export const streamApiKey = apiKey;
export const isStreamConfigured = Boolean(apiKey && apiSecret);

// Log Stream configuration status on startup
if (isStreamConfigured) {
  console.log('[Stream] API configured successfully');
} else {
  console.warn('[Stream] API key or secret not configured - messaging features will be disabled');
}

export const toStreamUserId = (userId: string | number): string => `user-${userId}`;

export const generateStreamToken = (userId: string | number): string => {
  // Generates a User Token for the calling side frontend to connect
  return streamClient.generateUserToken({ user_id: toStreamUserId(userId) });
};
