import { Navigate, Route, Routes } from "react-router-dom";

import AuthLayout from "../layouts/AuthLayout";
import UserLayout from "../layouts/UserLayout";
import AdminLayout from "../layouts/AdminLayout";
import Login from "../pages/auth/LoginPage";
import Register from "../pages/auth/RegisterPage";
import AdminCredit from "../pages/admin/Credit";
import AdminDashboard from "../pages/admin/Dashboard";
import AdminLoanDetails from "../pages/admin/LoanDetails";
import AdminLoans from "../pages/admin/Loans";
import AdminNotifications from "../pages/admin/Notifications";
import AdminReports from "../pages/admin/Reports";
import AdminTransactions from "../pages/admin/Transactions";
import AdminUserDetails from "../pages/admin/UserDetails";
import AdminUsers from "../pages/admin/Users";
import ForexRatesPage from "../pages/shared/ForexRatesPage";
import Beneficiaries from "../pages/user/Beneficiaries";
import Credit from "../pages/user/Credit";
import Dashboard from "../pages/user/Dashboard";
import Loans from "../pages/user/Loans";
import Profile from "../pages/user/Profile";
import SendMoney from "../pages/user/SendMoney";
import Transactions from "../pages/user/Transactions";
import Wallet from "../pages/user/Wallet";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

const UserPage = ({ children }) => (
  <ProtectedRoute>
    <RoleRoute role="USER">
      <UserLayout>{children}</UserLayout>
    </RoleRoute>
  </ProtectedRoute>
);

const AdminPage = ({ children }) => (
  <ProtectedRoute>
    <RoleRoute role="ADMIN">
      <AdminLayout>{children}</AdminLayout>
    </RoleRoute>
  </ProtectedRoute>
);

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AuthLayout><Login /></AuthLayout>} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />

      <Route path="/dashboard" element={<UserPage><Dashboard /></UserPage>} />
      <Route path="/wallet" element={<UserPage><Wallet /></UserPage>} />
      <Route path="/send" element={<UserPage><SendMoney /></UserPage>} />
      <Route path="/rates" element={<UserPage><ForexRatesPage audience="user" /></UserPage>} />
      <Route path="/beneficiaries" element={<UserPage><Beneficiaries /></UserPage>} />
      <Route path="/transactions" element={<UserPage><Transactions /></UserPage>} />
      <Route path="/credit" element={<UserPage><Credit /></UserPage>} />
      <Route path="/loans" element={<UserPage><Loans /></UserPage>} />
      <Route path="/profile" element={<UserPage><Profile /></UserPage>} />

      <Route path="/admin" element={<AdminPage><AdminDashboard /></AdminPage>} />
      <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
      <Route path="/admin/rates" element={<AdminPage><ForexRatesPage audience="admin" /></AdminPage>} />
      <Route path="/admin/users" element={<AdminPage><AdminUsers /></AdminPage>} />
      <Route path="/admin/users/:userId" element={<AdminPage><AdminUserDetails /></AdminPage>} />
      <Route path="/admin/transactions" element={<AdminPage><AdminTransactions /></AdminPage>} />
      <Route path="/admin/credit" element={<AdminPage><AdminCredit /></AdminPage>} />
      <Route path="/admin/loans" element={<AdminPage><AdminLoans /></AdminPage>} />
      <Route path="/admin/loans/:loanId" element={<AdminPage><AdminLoanDetails /></AdminPage>} />
      <Route path="/admin/notifications" element={<AdminPage><AdminNotifications /></AdminPage>} />
      <Route path="/admin/reports" element={<AdminPage><AdminReports /></AdminPage>} />

      <Route
        path="/unauthorized"
        element={
          <AuthLayout>
            <div className="mx-auto max-w-md text-center">
              <h1 className="text-4xl font-extrabold text-ink">Access Denied</h1>
              <p className="mt-3 text-sm font-semibold text-slate-500">
                Your account does not have access to that workspace.
              </p>
            </div>
          </AuthLayout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
