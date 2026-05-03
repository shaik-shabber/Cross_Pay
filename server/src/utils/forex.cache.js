// ================= IN-MEMORY FOREX CACHE =================

const cache = new Map();

// 5 minutes TTL (can adjust later)
const TTL = 5 * 60 * 1000;

// ================= GET CACHE =================
export const getCache = (key) => {
  if (!key) return null;

  const data = cache.get(key);

  if (!data) return null;

  // Expired → remove
  if (Date.now() > data.expiry) {
    cache.delete(key);
    return null;
  }

  return data.value;
};

// ================= SET CACHE =================
export const setCache = (key, value) => {
  if (!key) return;

  cache.set(key, {
    value,
    expiry: Date.now() + TTL,
  });
};

// ================= CLEAR CACHE (OPTIONAL) =================
export const clearCache = () => {
  cache.clear();
};

// ================= DELETE ONE KEY =================
export const deleteCache = (key) => {
  cache.delete(key);
};