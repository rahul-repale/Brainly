import mongoose from "mongoose";
import dns from "node:dns";

// Fix for Windows / ISP DNS resolvers failing on MongoDB Atlas SRV records (querySrv ECONNREFUSED)
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (err) {
  console.warn("Could not set custom DNS servers, using system default:", err);
}

export const connectDB = async () => {
  const mongoDbUrl = process.env.mongoDbUrl;

  if (!mongoDbUrl) {
    throw new Error("FATAL ERROR: mongoDB URL is not defined in the environment.");
  }

  try {
    await mongoose.connect(mongoDbUrl);
    mongoose.set('debug', true);
    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};
