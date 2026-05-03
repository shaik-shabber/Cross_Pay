const maxHops = 4;

// ================= NORMALIZE =================
const normalizeCurrency = (currency) =>
  typeof currency === "string" ? currency.toUpperCase() : null;

// ================= DIRECT ROUTE =================
export const getDirectRoute = (rate, fromCurrency, toCurrency) => {
  const from = normalizeCurrency(fromCurrency);
  const to = normalizeCurrency(toCurrency);

  if (!from || !to || typeof rate !== "number" || rate <= 0) {
    return null;
  }

  return {
    path: [from, to],
    rate,
  };
};

// ================= BEST ROUTE =================
export const getBestRoute = (graph, fromCurrency, toCurrency) => {
  const from = normalizeCurrency(fromCurrency);
  const to = normalizeCurrency(toCurrency);

  if (!graph || !from || !to || !graph[from]) {
    return null;
  }

  // Same currency case
  if (from === to) {
    return {
      path: [from],
      rate: 1,
    };
  }

  let bestRoute = null;

  const explore = (current, path, rate, visited) => {
    if (!current || typeof rate !== "number" || rate <= 0) return;
    if (path.length > maxHops) return;

    if (current === to) {
      if (!bestRoute || rate > bestRoute.rate) {
        bestRoute = {
          path: [...path],
          rate,
        };
      }
      return;
    }

    const neighbors = graph[current];
    if (!neighbors) return;

    for (const [next, edgeRate] of Object.entries(neighbors)) {
      if (
        !next ||
        typeof edgeRate !== "number" ||
        edgeRate <= 0 ||
        visited.has(next)
      ) {
        continue;
      }

      visited.add(next);
      path.push(next);

      explore(next, path, rate * edgeRate, visited);

      path.pop();
      visited.delete(next);
    }
  };

  explore(from, [from], 1, new Set([from]));

  return bestRoute;
};