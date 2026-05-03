import app from "./app.js";
import ENV from "./config/env.js";
import connectDB from "./config/db.js";
import mongoose from "mongoose";
import { initStore } from "./utils/data/store.js";

const startServer = async () => {
  try {
    await connectDB();

    if (mongoose.connection.readyState !== 1) {
      await initStore();
      console.log("JSON state fallback initialized");
    }

    app.listen(ENV.PORT, () => {
      console.log(`Server running on port ${ENV.PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start:", error.message);
    process.exit(1);
  }
};

startServer();
