import * as service from "./user.service.js";
import { sendSuccess } from "../../utils/response.util.js";
import { createHttpError } from "../../utils/httpError.js";

export const getProfile = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(createHttpError(401, "Unauthorized"));
    }

    const data = await service.getProfile(req.user.id);

    sendSuccess(res, {
      message: "Profile fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboard = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(createHttpError(401, "Unauthorized"));
    }

    const data = await service.getDashboard(req.user.id);

    sendSuccess(res, {
      message: "Dashboard fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(createHttpError(401, "Unauthorized"));
    }

    if (!req.body || typeof req.body !== "object") {
      return next(createHttpError(400, "Invalid request body"));
    }

    const data = await service.updateProfile(req.user.id, req.body);

    sendSuccess(res, {
      message: "Profile updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};