import * as service from "./notification.service.js";
import { sendSuccess } from "../../utils/response.util.js";
import { createHttpError } from "../../utils/httpError.js";

export const listNotifications = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(createHttpError(401, "Unauthorized"));
    }

    const data = await service.listNotifications(req.user.id);

    sendSuccess(res, { data });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(createHttpError(401, "Unauthorized"));
    }

    const data = await service.markAsRead(
      req.user.id,
      req.params.notificationId
    );

    sendSuccess(res, {
      message: "Notification marked as read",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// 🔥 CLEAR ALL
export const clearAll = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(createHttpError(401, "Unauthorized"));
    }

    await service.clearAllNotifications(req.user.id);

    sendSuccess(res, {
      message: "All notifications cleared",
    });
  } catch (error) {
    next(error);
  }
};