import mongoose from "mongoose";

const beneficiarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    nickname: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    bankName: {
      type: String,
      required: true,
      trim: true,
    },

    accountNumber: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 34,
    },

    maskedAccountNumber: {
      type: String,
    },

    swiftCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    country: {
      type: String,
      required: true,
      uppercase: true,
    },

    currency: {
      type: String,
      required: true,
      uppercase: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// 🔥 PRE SAVE HOOK (mask account number)
beneficiarySchema.pre("save", function () {
  if (this.accountNumber) {
    const last4 = this.accountNumber.slice(-4);
    this.maskedAccountNumber = `XXXXXX${last4}`;
  }
});

// 🔥 PREVENT DUPLICATES (same user + account)
beneficiarySchema.index(
  { userId: 1, accountNumber: 1 },
  { unique: true }
);

export default mongoose.model("Beneficiary", beneficiarySchema);
