import jwt from "jsonwebtoken";
import ENV from "../config/env.js";
import { createHttpError } from "../utils/httpError.js";

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw createHttpError(401, "Authentication token is required");
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    next(createHttpError(401, "Invalid or expired token"));
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(createHttpError(401, "Authentication required"));
  }

  if (!roles.includes(req.user.role)) {
    return next(
      createHttpError(403, "You do not have access to this resource")
    );
  }

  next();
};