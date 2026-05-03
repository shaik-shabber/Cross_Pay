import bcrypt from "bcryptjs";
import { nowIso, roundCurrency } from "../../utils/entity.util.js";

const clone = (obj) => JSON.parse(JSON.stringify(obj));

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const collections = [
  "users",
  "wallets",
  "beneficiaries",
  "credits",
  "loans",
  "transactions",
  "notifications",
];

const DEMO_IDS = {
  adminUser: "usr_demo_admin",
  demoUser: "usr_demo_user",
  adminWallet: "wal_demo_admin",
  demoWallet: "wal_demo_user",
  priya: "ben_demo_priya",
  oliver: "ben_demo_oliver",
  adminCredit: "crd_demo_admin",
  demoCredit: "crd_demo_user",
  workingCapitalLoan: "lon_demo_working_capital",
  educationLoan: "lon_demo_education",
  transferOne: "txn_demo_transfer_1",
  transferTwo: "txn_demo_transfer_2",
  transferThree: "txn_demo_transfer_3",
  userTransferNotification: "ntf_demo_transfer",
  userLoanNotification: "ntf_demo_loan",
  adminSystemNotification: "ntf_demo_admin",
};

const ensureCollections = (state = {}) => {
  const normalized = { ...state };

  collections.forEach((key) => {
    normalized[key] = ensureArray(normalized[key]);
  });

  return normalized;
};

const buildTransaction = ({
  id,
  userId,
  beneficiaryId,
  beneficiaryName,
  amountSent,
  amountReceived,
  currencyFrom,
  currencyTo,
  exchangeRate,
  routingPath,
  transferType,
  feeAmount,
  savingsAmount,
  status,
  createdAt,
  completedAt,
}) => ({
  id,
  reference: `CP-${id.slice(-6).toUpperCase()}`,
  userId,
  beneficiaryId,
  beneficiaryName,
  amountSent,
  amountReceived,
  currencyFrom,
  currencyTo,
  exchangeRate,
  routingPath,
  transferType,
  feeAmount,
  totalDebit: roundCurrency(Number(amountSent || 0) + Number(feeAmount || 0)),
  savingsAmount,
  status,
  createdAt,
  updatedAt: completedAt || createdAt,
  completedAt: completedAt || null,
  scheduledFor: null,
});

const createDemoUsers = async (createdAt) => [
  {
    id: DEMO_IDS.adminUser,
    fullName: "Ava Admin",
    email: "admin@crosspay.com",
    passwordHash: await bcrypt.hash("Admin@123", 10),
    role: "ADMIN",
    country: "United States",
    phone: "+1 202 555 0192",
    address: "New York, USA",
    occupation: "Operations Director",
    accountStatus: "ACTIVE",
    fraudFlag: false,
    adminNote: "",
    kycStatus: "VERIFIED",
    preferredTransferType: "smart",
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: DEMO_IDS.demoUser,
    fullName: "Rahul Mehta",
    email: "user@crosspay.com",
    passwordHash: await bcrypt.hash("User@123", 10),
    role: "USER",
    country: "India",
    phone: "+91 98765 43210",
    address: "Mumbai, India",
    occupation: "Import Business Owner",
    accountStatus: "ACTIVE",
    fraudFlag: false,
    adminNote: "",
    kycStatus: "VERIFIED",
    preferredTransferType: "smart",
    createdAt,
    updatedAt: createdAt,
  },
];

export const createSeedState = async () => {
  const createdAt = nowIso();
  const users = await createDemoUsers(createdAt);

  return {
    users,
    wallets: [
      {
        id: DEMO_IDS.adminWallet,
        userId: DEMO_IDS.adminUser,
        defaultCurrency: "USD",
        balances: { USD: 25000, EUR: 9000, INR: 300000 },
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: DEMO_IDS.demoWallet,
        userId: DEMO_IDS.demoUser,
        defaultCurrency: "USD",
        balances: { USD: 12500, EUR: 2200, INR: 150000, GBP: 1400 },
        createdAt,
        updatedAt: createdAt,
      },
    ],
    beneficiaries: [
      {
        id: DEMO_IDS.priya,
        userId: DEMO_IDS.demoUser,
        fullName: "Priya Sharma",
        email: "priya.sharma@example.com",
        bankName: "HDFC Bank",
        accountNumber: "908712341234",
        maskedAccountNumber: "XXXXXX1234",
        swiftCode: "HDFCINBBXXX",
        country: "IN",
        currency: "INR",
        isActive: true,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: DEMO_IDS.oliver,
        userId: DEMO_IDS.demoUser,
        fullName: "Oliver Smith",
        email: "oliver.smith@example.com",
        bankName: "HSBC UK",
        accountNumber: "112245678901",
        maskedAccountNumber: "XXXXXX8901",
        swiftCode: "HBUKGB4BXXX",
        country: "GB",
        currency: "GBP",
        isActive: true,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    credits: [
      {
        id: DEMO_IDS.adminCredit,
        userId: DEMO_IDS.adminUser,
        score: 830,
        riskLevel: "LOW",
        monthlyVolume: 0,
        transactionCount: 0,
        eligibleLoanAmount: 0,
        lastUpdated: createdAt,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: DEMO_IDS.demoCredit,
        userId: DEMO_IDS.demoUser,
        score: 736.05,
        riskLevel: "MEDIUM",
        monthlyVolume: 2650,
        transactionCount: 3,
        eligibleLoanAmount: 5222.05,
        lastUpdated: createdAt,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    loans: [
      {
        id: DEMO_IDS.workingCapitalLoan,
        userId: DEMO_IDS.demoUser,
        amount: 5000,
        purpose: "Working capital",
        tenureMonths: 12,
        interestRate: 10.9,
        status: "approved",
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: DEMO_IDS.educationLoan,
        userId: DEMO_IDS.demoUser,
        amount: 8000,
        purpose: "Education support",
        tenureMonths: 18,
        interestRate: 11.8,
        status: "pending",
        createdAt,
        updatedAt: createdAt,
      },
    ],
    transactions: [
      buildTransaction({
        id: DEMO_IDS.transferOne,
        userId: DEMO_IDS.demoUser,
        beneficiaryId: DEMO_IDS.priya,
        beneficiaryName: "Priya Sharma",
        amountSent: 1200,
        amountReceived: 101236.8,
        currencyFrom: "USD",
        currencyTo: "INR",
        exchangeRate: 84.364,
        routingPath: ["USD", "EUR", "INR"],
        transferType: "smart",
        feeAmount: 13.2,
        savingsAmount: 18.5,
        status: "completed",
        createdAt,
        completedAt: createdAt,
      }),
      buildTransaction({
        id: DEMO_IDS.transferTwo,
        userId: DEMO_IDS.demoUser,
        beneficiaryId: DEMO_IDS.oliver,
        beneficiaryName: "Oliver Smith",
        amountSent: 800,
        amountReceived: 630.88,
        currencyFrom: "USD",
        currencyTo: "GBP",
        exchangeRate: 0.7886,
        routingPath: ["USD", "GBP"],
        transferType: "instant",
        feeAmount: 14.4,
        savingsAmount: 0,
        status: "completed",
        createdAt,
        completedAt: createdAt,
      }),
      buildTransaction({
        id: DEMO_IDS.transferThree,
        userId: DEMO_IDS.demoUser,
        beneficiaryId: DEMO_IDS.priya,
        beneficiaryName: "Priya Sharma",
        amountSent: 650,
        amountReceived: 54836.6,
        currencyFrom: "USD",
        currencyTo: "INR",
        exchangeRate: 84.364,
        routingPath: ["USD", "EUR", "INR"],
        transferType: "best_rate",
        feeAmount: 4.88,
        savingsAmount: 21.14,
        status: "completed",
        createdAt,
        completedAt: createdAt,
      }),
    ],
    notifications: [
      {
        id: DEMO_IDS.userTransferNotification,
        userId: DEMO_IDS.demoUser,
        title: "Transfer completed",
        message:
          "Your smart USD to INR transfer to Priya Sharma settled successfully.",
        type: "transaction",
        read: false,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: DEMO_IDS.userLoanNotification,
        userId: DEMO_IDS.demoUser,
        title: "Loan offer refreshed",
        message:
          "Your current credit score unlocks pre-qualified loans up to $12,000.",
        type: "loan",
        read: false,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: DEMO_IDS.adminSystemNotification,
        userId: DEMO_IDS.adminUser,
        title: "Platform heartbeat",
        message: "CrossPay demo environment initialized successfully.",
        type: "system",
        read: true,
        createdAt,
        updatedAt: createdAt,
      },
    ],
  };
};

const mergeDemoUser = (existingUser, seedUser, timestamp) => {
  existingUser.fullName = seedUser.fullName;
  existingUser.email = seedUser.email;
  existingUser.passwordHash = seedUser.passwordHash;
  existingUser.role = seedUser.role;
  existingUser.country = seedUser.country;
  existingUser.phone = seedUser.phone;
  existingUser.address = seedUser.address;
  existingUser.occupation = seedUser.occupation;
  existingUser.accountStatus = seedUser.accountStatus;
  existingUser.fraudFlag =
    typeof existingUser.fraudFlag === "boolean"
      ? existingUser.fraudFlag
      : seedUser.fraudFlag;
  existingUser.adminNote =
    typeof existingUser.adminNote === "string"
      ? existingUser.adminNote
      : seedUser.adminNote;
  existingUser.kycStatus = seedUser.kycStatus;
  existingUser.preferredTransferType = seedUser.preferredTransferType;
  existingUser.updatedAt = timestamp;
};

export const ensureDemoState = async (existingState) => {
  const state = ensureCollections(existingState);
  const seed = await createSeedState();
  const timestamp = nowIso();

  const userIdMap = new Map();

  seed.users.forEach((seedUser) => {
    const existingUser = state.users.find((user) => user.email === seedUser.email);

    if (!existingUser) {
      state.users.push(clone(seedUser));
      userIdMap.set(seedUser.id, seedUser.id);
      return;
    }

    mergeDemoUser(existingUser, seedUser, timestamp);
    userIdMap.set(seedUser.id, existingUser.id);
  });

  seed.wallets.forEach((seedWallet) => {
    const resolvedUserId = userIdMap.get(seedWallet.userId) || seedWallet.userId;

    if (!state.wallets.some((wallet) => wallet.userId === resolvedUserId)) {
      const nextWallet = clone(seedWallet);
      nextWallet.userId = resolvedUserId;
      state.wallets.push(nextWallet);
    }
  });

  seed.credits.forEach((seedCredit) => {
    const resolvedUserId = userIdMap.get(seedCredit.userId) || seedCredit.userId;

    if (!state.credits.some((credit) => credit.userId === resolvedUserId)) {
      const nextCredit = clone(seedCredit);
      nextCredit.userId = resolvedUserId;
      state.credits.push(nextCredit);
    }
  });

  const beneficiaryIdMap = new Map();

  seed.beneficiaries.forEach((seedBeneficiary) => {
    const resolvedUserId =
      userIdMap.get(seedBeneficiary.userId) || seedBeneficiary.userId;
    let existingBeneficiary = state.beneficiaries.find(
      (beneficiary) =>
        beneficiary.userId === resolvedUserId &&
        beneficiary.fullName === seedBeneficiary.fullName &&
        beneficiary.bankName === seedBeneficiary.bankName
    );

    if (!existingBeneficiary) {
      const nextBeneficiary = clone(seedBeneficiary);
      nextBeneficiary.userId = resolvedUserId;
      state.beneficiaries.push(nextBeneficiary);
      existingBeneficiary = nextBeneficiary;
    }

    beneficiaryIdMap.set(seedBeneficiary.id, existingBeneficiary.id);
  });

  seed.loans.forEach((seedLoan) => {
    const resolvedUserId = userIdMap.get(seedLoan.userId) || seedLoan.userId;
    const exists = state.loans.some(
      (loan) =>
        loan.userId === resolvedUserId &&
        loan.amount === seedLoan.amount &&
        loan.purpose === seedLoan.purpose
    );

    if (!exists) {
      const nextLoan = clone(seedLoan);
      nextLoan.userId = resolvedUserId;
      state.loans.push(nextLoan);
    }
  });

  seed.transactions.forEach((seedTransaction) => {
    const resolvedUserId =
      userIdMap.get(seedTransaction.userId) || seedTransaction.userId;
    const resolvedBeneficiaryId =
      beneficiaryIdMap.get(seedTransaction.beneficiaryId) ||
      seedTransaction.beneficiaryId;
    const exists = state.transactions.some(
      (transaction) =>
        transaction.reference === seedTransaction.reference ||
        (transaction.userId === resolvedUserId &&
          transaction.beneficiaryId === resolvedBeneficiaryId &&
          transaction.amountSent === seedTransaction.amountSent &&
          transaction.transferType === seedTransaction.transferType)
    );

    if (!exists) {
      const nextTransaction = clone(seedTransaction);
      nextTransaction.userId = resolvedUserId;
      nextTransaction.beneficiaryId = resolvedBeneficiaryId;
      state.transactions.push(nextTransaction);
    }
  });

  seed.notifications.forEach((seedNotification) => {
    const resolvedUserId =
      userIdMap.get(seedNotification.userId) || seedNotification.userId;
    const exists = state.notifications.some(
      (notification) =>
        notification.userId === resolvedUserId &&
        notification.title === seedNotification.title &&
        notification.message === seedNotification.message
    );

    if (!exists) {
      const nextNotification = clone(seedNotification);
      nextNotification.userId = resolvedUserId;
      state.notifications.push(nextNotification);
    }
  });

  return state;
};
