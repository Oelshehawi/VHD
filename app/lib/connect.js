import mongoose from 'mongoose';

let isConnected = false;

const connectMongo = async () => {
  if (isConnected) {
    return;
  }
  try {
    await mongoose.connect(process.env.NEXT_PUBLIC_MONGODB_URI);
    isConnected = true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
};

export default connectMongo;
