import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    beneficiaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Beneficiary",
      default: null,
    },

    reference: {
      type: String,
      unique: true,
      index: true,
    },

    amountSent: {
      type: Number,
      required: true,
      min: 0,
    },

    amountReceived: {
      type: Number,
      required: true,
      min: 0,
    },

    currencyFrom: {
      type: String,
      required: true,
    },

    currencyTo: {
      type: String,
      required: true,
    },

    exchangeRate: {
      type: Number,
      required: true,
      min: 0,
    },

    routingPath: {
      type: [String], // 🔥 array (multi-hop transfers)
      default: [],
    },

    transferType: {
      type: String,
      enum: ["instant", "smart", "best_rate"],
      default: "smart",
    },

    feeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalDebit: {
      type: Number,
      required: true,
      min: 0,
    },

    savingsAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },

    initiatedAt: {
      type: Date,
      default: Date.now,
    },

    processedAt: Date,
    completedAt: Date,
    failedAt: Date,

    failureReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// 🔥 Auto-generate reference
transactionSchema.pre("save", function () {
  if (!this.reference) {
    this.reference =
      "CP-" + this._id.toString().slice(-6).toUpperCase();
  }
});

export default mongoose.model("Transaction", transactionSchema);
