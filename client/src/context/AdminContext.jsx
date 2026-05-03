import { createContext, useContext, useState } from "react";
import api, { getPayload } from "../lib/api";

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [creditProfiles, setCreditProfiles] = useState([]);
  const [loans, setLoans] = useState([]);
  const [notificationsWorkspace, setNotificationsWorkspace] = useState(null);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async (request) => {
    setLoading(true);
    try {
      const response = await request();
      return getPayload(response);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverview = async () => {
    const data = await run(() => api.get("/admin/overview"));
    setOverview(data);
    return data;
  };

  const fetchUsers = async () => {
    const data = await run(() => api.get("/admin/users"));
    setUsers(data?.users || []);
    return data;
  };

  const fetchUserDetails = async (userId) => {
    return run(() => api.get(`/admin/users/${userId}`));
  };

  const updateUser = async (userId, payload) => {
    const response = await api.patch(`/admin/users/${userId}`, payload);
    const updated = getPayload(response);
    setUsers((current) =>
      current.map((user) => ((user.id || user._id) === (updated.id || updated._id) ? { ...user, ...updated } : user))
    );
    return updated;
  };

  const fetchTransactions = async () => {
    const data = await run(() => api.get("/admin/transactions"));
    setTransactions(data?.transactions || []);
    return data;
  };

  const fetchCreditProfiles = async () => {
    const data = await run(() => api.get("/admin/credit"));
    setCreditProfiles(data?.profiles || []);
    return data;
  };

  const updateCreditProfile = async (userId, payload) => {
    const response = await api.patch(`/admin/credit/${userId}`, payload);
    return getPayload(response);
  };

  const fetchLoans = async () => {
    const data = await run(() => api.get("/admin/loans"));
    setLoans(data?.loans || []);
    return data;
  };

  const fetchLoanDetails = async (loanId) => {
    return run(() => api.get(`/admin/loans/${loanId}`));
  };

  const updateLoan = async (loanId, payload) => {
    const response = await api.patch(`/admin/loans/${loanId}`, payload);
    const updated = getPayload(response);
    setLoans((current) =>
      current.map((loan) => ((loan.id || loan._id) === (updated.id || updated._id) ? { ...loan, ...updated } : loan))
    );
    return updated;
  };

  const fetchNotificationsWorkspace = async () => {
    const data = await run(() => api.get("/admin/notifications"));
    setNotificationsWorkspace(data);
    return data;
  };

  const sendNotification = async (payload) => {
    const response = await api.post("/admin/notifications", payload);
    return getPayload(response);
  };

  const fetchReports = async () => {
    const data = await run(() => api.get("/admin/reports"));
    setReports(data);
    return data;
  };

  return (
    <AdminContext.Provider
      value={{
        overview,
        users,
        transactions,
        creditProfiles,
        loans,
        notificationsWorkspace,
        reports,
        loading,
        fetchOverview,
        fetchUsers,
        fetchUserDetails,
        updateUser,
        fetchTransactions,
        fetchCreditProfiles,
        updateCreditProfile,
        fetchLoans,
        fetchLoanDetails,
        updateLoan,
        fetchNotificationsWorkspace,
        sendNotification,
        fetchReports,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
