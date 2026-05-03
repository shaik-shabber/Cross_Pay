import { createContext, useContext, useState } from "react";
import api, { getPayload } from "../lib/api";

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const res = await api.get("/wallet");
      const data = getPayload(res);
      setWallet(data);
      return data;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const topUpWallet = async (payload) => {
    const res = await api.post("/wallet/topup", payload);
    const data = getPayload(res);
    setWallet(data);
    return data;
  };

  const withdrawWallet = async (payload) => {
    const res = await api.post("/wallet/withdraw", payload);
    const data = getPayload(res);
    setWallet(data);
    return data;
  };

  return (
    <WalletContext.Provider value={{ wallet, loading, fetchWallet, topUpWallet, withdrawWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
