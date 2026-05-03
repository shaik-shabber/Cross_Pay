import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import api, { getErrorMessage } from "../lib/api";
import { formatDate, getEntityId, humanizeLabel } from "../lib/formatters";
import { CROSSPAY_ACTIVITY_EVENT } from "../lib/realtime";

export default function NotificationMenu({ unreadCount = 0, refreshSession }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [clearingAll, setClearingAll] = useState(false);
  const [loadedNotifications, setLoadedNotifications] = useState(false);
  const containerRef = useRef(null);
  const location = useLocation();

  const loadNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError("");

    try {
      const response = await api.get("/notifications");
      setNotifications(response.data.data || []);
      setLoadedNotifications(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open, loadNotifications]);

  useEffect(() => {
    loadNotifications({ silent: true });

    const handleActivityUpdate = async () => {
      await refreshSession();
      await loadNotifications({ silent: true });
    };

    const intervalId = window.setInterval(() => {
      loadNotifications({ silent: true });
    }, 15000);

    window.addEventListener(CROSSPAY_ACTIVITY_EVENT, handleActivityUpdate);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(CROSSPAY_ACTIVITY_EVENT, handleActivityUpdate);
    };
  }, [loadNotifications, refreshSession]);

  const markAsRead = async (notificationId) => {
    setBusyId(notificationId);
    setError("");

    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications((current) =>
        current.filter(
          (notification) => getEntityId(notification) !== notificationId
        )
      );
      setLoadedNotifications(true);
      await refreshSession();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyId("");
    }
  };

  const clearAll = async () => {
    setClearingAll(true);
    setError("");

    try {
      await api.patch("/notifications/clear-all");
      setNotifications([]);
      setLoadedNotifications(true);
      await refreshSession();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setClearingAll(false);
    }
  };

  const liveUnreadCount =
    loadedNotifications
      ? notifications.filter((notification) => !notification.read).length
      : unreadCount;

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className="icon-button relative"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9a6 6 0 1 0-12 0v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.08 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {liveUnreadCount ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white">
            {liveUnreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="dropdown-panel max-h-[28rem] overflow-hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-base font-extrabold text-ink">Notifications</p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                System alerts, account updates, and transfer notices
              </p>
            </div>
            <div className="flex items-center gap-2">
              {liveUnreadCount ? (
                <button
                  className="secondary-button px-3 py-2 text-xs"
                  disabled={clearingAll}
                  onClick={clearAll}
                  type="button"
                >
                  {clearingAll ? "Clearing..." : "Clear All"}
                </button>
              ) : null}
              <button
                aria-label="Close notifications"
                className="icon-button h-9 w-9"
                onClick={() => setOpen(false)}
                type="button"
              >
                <span className="text-sm font-bold">X</span>
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-4 max-h-[20rem] space-y-3 overflow-y-auto pr-1">
            {loading ? (
              <div className="soft-card p-4">
                <p className="text-sm font-semibold text-slate-500">Loading notifications...</p>
              </div>
            ) : notifications.length ? (
              notifications.map((notification) => (
                <div
                  key={getEntityId(notification)}
                  className={`rounded-[1.35rem] border p-4 ${
                    notification.read
                      ? "border-slate-200 bg-white"
                      : "border-brand/15 bg-blue-50/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-extrabold text-ink">{notification.title}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {humanizeLabel(notification.type)}
                      </p>
                    </div>
                    {!notification.read ? (
                      <span className="flex h-2.5 w-2.5 rounded-full bg-brand" />
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
                    {notification.message}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      {formatDate(notification.createdAt)}
                    </p>
                    {!notification.read ? (
                      <button
                        className="secondary-button px-3 py-2 text-xs"
                        disabled={busyId === getEntityId(notification)}
                        onClick={() => markAsRead(getEntityId(notification))}
                        type="button"
                      >
                        {busyId === getEntityId(notification) ? "Saving..." : "Mark Read"}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="soft-card p-4">
                <p className="text-base font-extrabold text-ink">No notifications yet</p>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  System messages will appear here as your account activity grows.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
