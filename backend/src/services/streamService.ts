import { StreamClient } from '@stream-io/node-sdk';

const apiKey = process.env.STREAM_API_KEY || '';
const apiSecret = process.env.STREAM_API_SECRET || '';

export const streamClient = new StreamClient(apiKey, apiSecret);
export const streamApiKey = apiKey;
export const isStreamConfigured = Boolean(apiKey && apiSecret);

export const toStreamUserId = (userId: string | number): string => `user-${userId}`;

export const generateStreamToken = (userId: string | number): string => {
  // Generates a User Token for the calling side frontend to connect
  return streamClient.generateUserToken({ user_id: toStreamUserId(userId) });
};
