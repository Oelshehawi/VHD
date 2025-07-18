import mongoose from 'mongoose';

let isConnected = false;

const connectMongo = async () => {
  if (isConnected) {
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    isConnected = true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
};

export default connectMongo;