import * as service from "./auth.service.js";
import { sendSuccess } from "../../utils/response.util.js";
import { createHttpError } from "../../utils/httpError.js";

export const register = async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== "object") {
      return next(createHttpError(400, "Invalid request body"));
    }

    const data = await service.registerUser(req.body);

    sendSuccess(res, {
      statusCode: 201,
      message: "User registered successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    if (!req.body?.email || !req.body?.password) {
      return next(createHttpError(400, "Email and password are required"));
    }

    const data = await service.loginUser(req.body);

    sendSuccess(res, {
      message: "Login successful",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(createHttpError(401, "Unauthorized"));
    }

    const data = await service.getCurrentUser(req.user.id);

    sendSuccess(res, {
      message: "User fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const data = await service.logoutUser();

    sendSuccess(res, {
      message: data.message,
    });
  } catch (error) {
    next(error);
  }
};