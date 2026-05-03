import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { getInitials } from "../lib/formatters";

export default function AccountMenu({ user, isAdmin, logout }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const location = useLocation();
  const initials = getInitials(user?.fullName, isAdmin ? "AA" : "U");

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

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
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
            d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 19.5a7.5 7.5 0 0 1 15 0"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="absolute -bottom-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-extrabold text-white">
          {initials.slice(0, 1)}
        </span>
      </button>

      {open ? (
        <div className="dropdown-panel">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-extrabold text-brand">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-extrabold text-ink">
                  {user?.fullName || "CrossPay"}
                </p>
                <p className="mt-1 truncate text-xs font-medium text-slate-500">
                  {user?.email}
                </p>
              </div>
            </div>

            <button
              aria-label="Close account menu"
              className="icon-button h-9 w-9 shrink-0"
              onClick={() => setOpen(false)}
              type="button"
            >
              <span className="text-sm font-bold">X</span>
            </button>
          </div>

          <div className="mt-4 space-y-2">
            <Link
              className="secondary-button w-full justify-start"
              to={isAdmin ? "/admin" : "/profile"}
            >
              Profile & Settings
            </Link>

            <Link
              className="secondary-button w-full justify-start"
              to={isAdmin ? "/admin" : "/dashboard"}
            >
              {isAdmin ? "Admin Overview" : "Dashboard"}
            </Link>

            <button
              className="danger-button w-full justify-start"
              onClick={logout}
              type="button"
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
