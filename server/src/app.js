import express from "express";
import cors from "cors";

import ENV from "./config/env.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

// ================= ROUTES =================
import userRoutes from "./modules/user/user.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import walletRoutes from "./modules/wallet/wallet.routes.js";
import transactionRoutes from "./modules/transaction/transaction.routes.js";
import creditRoutes from "./modules/credit/credit.routes.js";
import notificationRoutes from "./modules/notification/notification.routes.js";
import forexRoutes from "./modules/forex/forex.routes.js";
import beneficiaryRoutes from "./modules/beneficiary/beneficiary.routes.js"; 
import loanRoutes from "./modules/loan/loan.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";

// ================= MIDDLEWARE =================
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

// ================= GLOBAL MIDDLEWARE =================
app.use(
  cors({
    origin(origin, callback) {
      const allowedOrigins = new Set([
        ENV.CLIENT_URL,
        "http://localhost:5173",
        "http://localhost:5174",
      ]);

      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiter
app.use("/api", apiLimiter);

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CrossPay API is running",
  });
});

// ================= API ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/credit", creditRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/forex", forexRoutes);
app.use("/api/beneficiaries", beneficiaryRoutes); 
app.use("/api/loans", loanRoutes);
app.use("/api/admin", adminRoutes);

// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ================= ERROR HANDLER =================
app.use(errorHandler);

export default app;
