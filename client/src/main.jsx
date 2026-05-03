import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import "./index.css";

import AppErrorBoundary from "./components/AppErrorBoundary.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { WalletProvider } from "./context/WalletContext";
import { TransactionProvider } from "./context/TransactionContext";
import { AdminProvider } from "./context/AdminContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <TransactionProvider>
            <AdminProvider>
              <AppErrorBoundary>
                <App />
              </AppErrorBoundary>
            </AdminProvider>
          </TransactionProvider>
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
