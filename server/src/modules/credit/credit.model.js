import mongoose from "mongoose";

const creditSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    score: {
      type: Number,
      default: 700,
      min: 0,
      max: 1000,
    },

    riskLevel: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },

    monthlyVolume: {
      type: Number,
      default: 0,
      min: 0,
    },

    transactionCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    eligibleLoanAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },

    adminNote: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Credit", creditSchema);
