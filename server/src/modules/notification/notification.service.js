import mongoose from "mongoose";
import Notification from "./notification.model.js";

import { getState, updateState } from "../../utils/data/store.js";
import { createHttpError } from "../../utils/httpError.js";
import { createId, nowIso } from "../../utils/entity.util.js";

const isDBConnected = () => mongoose.connection.readyState === 1;

// ================= PUSH =================
export const pushNotification = async (payload) => {
  const timestamp = nowIso();

  // ===== Mongo =====
  if (isDBConnected()) {
    return await Notification.create({
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type || "system",
    });
  }

  // ===== Store =====
  let created = null;

  await updateState((draft) => {
    created = {
      id: createId("ntf"),
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type || "system",
      read: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    draft.notifications.unshift(created);
  });

  return created;
};

// ================= LIST (UNREAD ONLY) =================
export const listNotifications = async (userId) => {
  // ===== Mongo =====
  if (isDBConnected()) {
    return await Notification.find({
      userId,
      read: false, // 🔥 ONLY UNREAD
    })
      .sort({ createdAt: -1 })
      .lean();
  }

  // ===== Store =====
  return getState()
    .notifications.filter(
      (n) => n.userId === userId && !n.read
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// ================= MARK AS READ =================
export const markAsRead = async (userId, notificationId) => {
  const timestamp = nowIso();

  // ===== Mongo =====
  if (isDBConnected()) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true, readAt: timestamp },
      { new: true }
    );

    if (!notification) {
      throw createHttpError(404, "Notification not found");
    }

    return notification;
  }

  // ===== Store =====
  let updated = null;

  await updateState((draft) => {
    const notification = draft.notifications.find(
      (n) => n.id === notificationId && n.userId === userId
    );

    if (!notification) {
      throw createHttpError(404, "Notification not found");
    }

    notification.read = true;
    notification.updatedAt = timestamp;

    updated = notification;
  });

  return updated;
};

// ================= CLEAR ALL =================
export const clearAllNotifications = async (userId) => {
  const timestamp = nowIso();

  // ===== Mongo =====
  if (isDBConnected()) {
    await Notification.updateMany(
      { userId, read: false },
      { read: true, readAt: timestamp }
    );

    return { success: true };
  }

  // ===== Store =====
  await updateState((draft) => {
    draft.notifications.forEach((n) => {
      if (n.userId === userId && !n.read) {
        n.read = true;
        n.updatedAt = timestamp;
      }
    });
  });

  return { success: true };
};