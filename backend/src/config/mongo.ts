import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const connectMongo = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('MONGO_URI not found in .env');
      return;
    }
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Cloud successfully');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', (err as Error).message);
  }
};

export default connectMongo;
