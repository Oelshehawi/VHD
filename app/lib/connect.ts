import mongoose from "mongoose";

declare global {
  var mongooseConnectPromise: Promise<typeof mongoose> | null;
}

const connectMongo = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!global.mongooseConnectPromise) {
    mongoose.set("bufferCommands", false);
    mongoose.set("bufferTimeoutMS", 0);
    global.mongooseConnectPromise = mongoose
      .connect(process.env.MONGODB_URI as string)
      .catch((error) => {
        global.mongooseConnectPromise = null;
        throw error;
      });
  }

  try {
    await global.mongooseConnectPromise;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
};

export default connectMongo;
