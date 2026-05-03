import bcrypt from "bcryptjs";
import User from "../../modules/user/user.model.js";
import Wallet from "../../modules/wallet/wallet.model.js";
import Credit from "../../modules/credit/credit.model.js";
import Beneficiary from "../../modules/beneficiary/beneficiary.model.js";
import Transaction from "../../modules/transaction/transaction.model.js";
import Notification from "../../modules/notification/notification.model.js";
import Loan from "../../modules/loan/loan.model.js";

const ensureDemoUser = async ({ password, ...profile }) => {
  const passwordHash = await bcrypt.hash(password, 10);

  return User.findOneAndUpdate(
    { email: profile.email },
    {
      $set: {
        ...profile,
        passwordHash,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
};

const ensureWallet = async (userId, payload) => {
  const existing = await Wallet.findOne({ userId });

  if (!existing) {
    await Wallet.create({
      userId,
      ...payload,
    });
  }
};

const ensureCredit = async (userId, payload) => {
  const existing = await Credit.findOne({ userId });

  if (!existing) {
    await Credit.create({
      userId,
      ...payload,
    });
  }
};

export const ensureMongoDemoData = async () => {
  const [admin, user] = await Promise.all([
    ensureDemoUser({
      fullName: "Ava Admin",
      email: "admin@crosspay.com",
      password: "Admin@123",
      role: "ADMIN",
      country: "United States",
      phone: "+1 202 555 0192",
      address: "New York, USA",
      occupation: "Operations Director",
      accountStatus: "ACTIVE",
      kycStatus: "VERIFIED",
      preferredTransferType: "smart",
    }),
    ensureDemoUser({
      fullName: "Rahul Mehta",
      email: "user@crosspay.com",
      password: "User@123",
      role: "USER",
      country: "India",
      phone: "+91 98765 43210",
      address: "Mumbai, India",
      occupation: "Import Business Owner",
      accountStatus: "ACTIVE",
      kycStatus: "VERIFIED",
      preferredTransferType: "smart",
    }),
  ]);

  await Promise.all([
    ensureWallet(admin._id, {
      defaultCurrency: "USD",
      balances: { USD: 25000, EUR: 9000, INR: 300000 },
      status: "ACTIVE",
    }),
    ensureWallet(user._id, {
      defaultCurrency: "USD",
      balances: { USD: 12500, EUR: 2200, INR: 150000, GBP: 1400 },
      status: "ACTIVE",
    }),
    ensureCredit(admin._id, {
      score: 830,
      riskLevel: "LOW",
      monthlyVolume: 0,
      transactionCount: 0,
      eligibleLoanAmount: 0,
    }),
    ensureCredit(user._id, {
      score: 736,
      riskLevel: "MEDIUM",
      monthlyVolume: 2650,
      transactionCount: 3,
      eligibleLoanAmount: 5222.05,
    }),
  ]);

  const [priya, oliver] = await Promise.all([
    Beneficiary.findOneAndUpdate(
      { userId: user._id, fullName: "Priya Sharma", bankName: "HDFC Bank" },
      {
        $setOnInsert: {
          userId: user._id,
          fullName: "Priya Sharma",
          email: "priya.sharma@example.com",
          bankName: "HDFC Bank",
          accountNumber: "908712341234",
          maskedAccountNumber: "XXXXXX1234",
          swiftCode: "HDFCINBBXXX",
          country: "IN",
          currency: "INR",
          isActive: true,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ),
    Beneficiary.findOneAndUpdate(
      { userId: user._id, fullName: "Oliver Smith", bankName: "HSBC UK" },
      {
        $setOnInsert: {
          userId: user._id,
          fullName: "Oliver Smith",
          email: "oliver.smith@example.com",
          bankName: "HSBC UK",
          accountNumber: "112245678901",
          maskedAccountNumber: "XXXXXX8901",
          swiftCode: "HBUKGB4BXXX",
          country: "GB",
          currency: "GBP",
          isActive: true,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ),
  ]);

  if ((await Loan.countDocuments({ userId: user._id })) === 0) {
    await Loan.create([
      {
        userId: user._id,
        amount: 5000,
        purpose: "Working capital",
        tenureMonths: 12,
        interestRate: 10.9,
        status: "approved",
      },
      {
        userId: user._id,
        amount: 8000,
        purpose: "Education support",
        tenureMonths: 18,
        interestRate: 11.8,
        status: "pending",
      },
    ]);
  }

  if ((await Transaction.countDocuments({ userId: user._id })) === 0) {
    await Transaction.create([
      {
        userId: user._id,
        beneficiaryId: priya._id,
        amountSent: 1200,
        amountReceived: 101236.8,
        currencyFrom: "USD",
        currencyTo: "INR",
        exchangeRate: 84.364,
        routingPath: ["USD", "EUR", "INR"],
        transferType: "smart",
        feeAmount: 13.2,
        totalDebit: 1213.2,
        savingsAmount: 18.5,
        status: "completed",
        completedAt: new Date(),
      },
      {
        userId: user._id,
        beneficiaryId: oliver._id,
        amountSent: 800,
        amountReceived: 630.88,
        currencyFrom: "USD",
        currencyTo: "GBP",
        exchangeRate: 0.7886,
        routingPath: ["USD", "GBP"],
        transferType: "instant",
        feeAmount: 14.4,
        totalDebit: 814.4,
        savingsAmount: 0,
        status: "completed",
        completedAt: new Date(),
      },
      {
        userId: user._id,
        beneficiaryId: priya._id,
        amountSent: 650,
        amountReceived: 54836.6,
        currencyFrom: "USD",
        currencyTo: "INR",
        exchangeRate: 84.364,
        routingPath: ["USD", "EUR", "INR"],
        transferType: "best_rate",
        feeAmount: 4.88,
        totalDebit: 654.88,
        savingsAmount: 21.14,
        status: "completed",
        completedAt: new Date(),
      },
    ]);
  }

  if ((await Notification.countDocuments({ userId: user._id })) === 0) {
    await Notification.create([
      {
        userId: user._id,
        title: "Transfer completed",
        message:
          "Your smart USD to INR transfer to Priya Sharma settled successfully.",
        type: "transaction",
        read: false,
      },
      {
        userId: user._id,
        title: "Loan offer refreshed",
        message:
          "Your current credit score unlocks pre-qualified loans up to $12,000.",
        type: "loan",
        read: false,
      },
    ]);
  }

  if ((await Notification.countDocuments({ userId: admin._id })) === 0) {
    await Notification.create({
      userId: admin._id,
      title: "Platform heartbeat",
      message: "CrossPay demo environment initialized successfully.",
      type: "system",
      read: true,
    });
  }
};
