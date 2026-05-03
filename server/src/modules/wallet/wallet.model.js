import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    balances: {
      USD: {
        type: Number,
        default: 0,
        min: 0,
      },
      EUR: {
        type: Number,
        default: 0,
        min: 0,
      },
      INR: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    defaultCurrency: {
      type: String,
      enum: ["USD", "EUR", "INR"],
      default: "USD",
    },

    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "BLOCKED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Wallet", walletSchema);