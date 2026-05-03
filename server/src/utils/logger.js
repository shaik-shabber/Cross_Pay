const LEVELS = {
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  DEBUG: "debug",
};

const formatLog = (level, message, meta = {}) => ({
  timestamp: new Date().toISOString(),
  level,
  message,
  ...meta,
});

const logToConsole = (log) => {
  const output = JSON.stringify(log);

  if (log.level === LEVELS.ERROR) {
    console.error(output);
  } else if (log.level === LEVELS.WARN) {
    console.warn(output);
  } else {
    console.log(output);
  }
};

const logger = {
  info: (message, meta) => {
    logToConsole(formatLog(LEVELS.INFO, message, meta));
  },

  warn: (message, meta) => {
    logToConsole(formatLog(LEVELS.WARN, message, meta));
  },

  error: (message, meta) => {
    logToConsole(formatLog(LEVELS.ERROR, message, meta));
  },

  debug: (message, meta) => {
    if (process.env.NODE_ENV === "development") {
      logToConsole(formatLog(LEVELS.DEBUG, message, meta));
    }
  },
};

export default logger;