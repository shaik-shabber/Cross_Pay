import mongoose from "mongoose";
import ENV from "./env.js";
import { ensureMongoDemoData } from "../utils/data/mongoSeed.js";

const connectDB = async () => {
  try {
    if (!ENV.MONGO_URI) {
      console.warn("MongoDB URI not provided");
      return;
    }

    await mongoose.connect(ENV.MONGO_URI);
    await ensureMongoDemoData();

    console.log("MongoDB connected");
  } catch (error) {
    console.warn("MongoDB connection failed:", error.message);
  }
};

export default connectDB;
