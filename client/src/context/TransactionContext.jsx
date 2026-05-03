import { createContext, useContext, useState } from "react";
import api, { getPayload } from "../lib/api";
import { emitActivityUpdate } from "../lib/realtime";

const TransactionContext = createContext();

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async (filters = {}) => {
    setLoading(true);
    try {
      const res = await api.get("/transactions", { params: filters });
      const data = getPayload(res);
      setTransactions(data || []);
      return data || [];
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getQuotes = async (payload) => {
    const res = await api.post("/transactions/quote", payload);
    const data = getPayload(res) || [];
    setQuotes(data);
    return data;
  };

  const createTransaction = async (payload) => {
    const res = await api.post("/transactions", payload);
    const data = getPayload(res);
    setTransactions((current) => [data, ...current]);
    emitActivityUpdate({ type: "transaction-created", entityId: data?.id || data?._id });
    return data;
  };

  return (
    <TransactionContext.Provider
      value={{ transactions, quotes, loading, fetchTransactions, getQuotes, createTransaction }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransaction = () => useContext(TransactionContext);
