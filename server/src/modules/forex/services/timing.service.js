const transferProfiles = {
  instant: {
    feeRate: 0.018,
    rateMultiplier: 0.995,
    delayMs: 0,
    settlementText: "Settles in seconds",
  },
  smart: {
    feeRate: 0.011,
    rateMultiplier: 1,
    delayMs: 20000,
    settlementText: "Targets a lower-cost route within ~20 seconds",
  },
  best_rate: {
    feeRate: 0.0075,
    rateMultiplier: 1.004,
    delayMs: 45000,
    settlementText: "Waits for a stronger market window within ~45 seconds",
  },
};

// ✅ ES MODULE EXPORT
export const getTransferProfile = (transferType) =>
  transferProfiles[transferType] || transferProfiles.smart;