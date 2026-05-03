import { NavLink } from "react-router-dom";

import AccountMenu from "../components/AccountMenu";
import BrandMark from "../components/BrandMark";
import NotificationMenu from "../components/NotificationMenu";
import { useAuth } from "../context/AuthContext";
import { normalizeRole } from "../lib/formatters";

const userNav = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Wallet", to: "/wallet" },
  { label: "Send Money", to: "/send" },
  { label: "Forex Rates", to: "/rates" },
  { label: "Beneficiaries", to: "/beneficiaries" },
  { label: "Transactions", to: "/transactions" },
  { label: "Credit", to: "/credit" },
  { label: "Loans", to: "/loans" },
];

const adminNav = [
  { label: "Overview", to: "/admin" },
  { label: "Forex Rates", to: "/admin/rates" },
  { label: "Users", to: "/admin/users" },
  { label: "Transactions", to: "/admin/transactions" },
  { label: "Credit", to: "/admin/credit" },
  { label: "Loans", to: "/admin/loans" },
  { label: "Notifications", to: "/admin/notifications" },
  { label: "Reports", to: "/admin/reports" },
];

const navClass = ({ isActive }) =>
  `nav-link shrink-0 ${isActive ? "nav-link-active" : ""}`;

export default function AppShell({ children }) {
  const { user, session, logout, refreshSession } = useAuth();
  const isAdmin = normalizeRole(user?.role) === "ADMIN";
  const navItems = isAdmin ? adminNav : userNav;

  return (
    <div className="min-h-screen bg-page px-4 py-5 sm:px-6 lg:px-8">
      <header className="mx-auto flex max-w-7xl flex-col gap-4 rounded-[1.75rem] bg-white px-4 py-4 shadow-bloom md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-slate-400">
                Global Bridge
              </p>
              <p className="text-2xl font-extrabold text-ink">CrossPay</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <NotificationMenu
              refreshSession={refreshSession}
              unreadCount={session?.unreadNotifications || 0}
            />
            <AccountMenu user={user} isAdmin={isAdmin} logout={logout} />
          </div>
        </div>

        <nav className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto md:justify-center">
          {navItems.map((item) => (
            <NavLink
              className={navClass}
              end={item.to === "/admin"}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <NotificationMenu
            refreshSession={refreshSession}
            unreadCount={session?.unreadNotifications || 0}
          />
          <AccountMenu user={user} isAdmin={isAdmin} logout={logout} />
        </div>
      </header>

      <main className="mx-auto mt-8 max-w-7xl pb-12">{children}</main>
    </div>
  );
}
