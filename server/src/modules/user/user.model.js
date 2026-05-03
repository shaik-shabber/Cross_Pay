import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      default: "",
    },

    country: {
      type: String,
      default: "United States",
    },

    address: {
      type: String,
      default: "",
    },

    occupation: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },

    accountStatus: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED"],
      default: "ACTIVE",
    },

    fraudFlag: {
      type: Boolean,
      default: false,
    },

    adminNote: {
      type: String,
      default: "",
    },

    kycStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING",
    },

    preferredTransferType: {
      type: String,
      enum: ["smart", "instant", "best_rate"],
      default: "smart",
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);