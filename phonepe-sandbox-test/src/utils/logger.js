const winston = require("winston");
const path = require("path");
const config = require("../config/environment");

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

// Apply colors to winston
winston.addColors(colors);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let metaString = "";

    if (Object.keys(meta).length > 0) {
      metaString = `\n${JSON.stringify(meta, null, 2)}`;
    }

    return `${timestamp} [${level}]: ${message}${metaString}`;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Create transports array
const transports = [];

// Console transport for development
if (config.nodeEnv !== "production") {
  transports.push(
    new winston.transports.Console({
      level: "debug",
      format: consoleFormat,
    })
  );
}

// File transports for production
if (config.nodeEnv === "production") {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/error.log"),
      level: "error",
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/combined.log"),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Console transport for production (limited)
  transports.push(
    new winston.transports.Console({
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.simple()
      ),
    })
  );
}

// HTTP transport for external logging services (optional)
if (config.logging?.externalService) {
  transports.push(
    new winston.transports.Http({
      host: config.logging.externalService.host,
      port: config.logging.externalService.port,
      path: config.logging.externalService.path,
      auth: config.logging.externalService.auth,
      ssl: true,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: config.logging?.level || "info",
  levels,
  format: fileFormat,
  transports,
  exitOnError: false,

  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/exceptions.log"),
    }),
  ],

  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/rejections.log"),
    }),
  ],
});

// Custom logging methods for specific use cases
logger.payment = (message, meta = {}) => {
  logger.info(message, {
    category: "PAYMENT",
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

logger.security = (message, meta = {}) => {
  logger.warn(message, {
    category: "SECURITY",
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

logger.performance = (message, meta = {}) => {
  logger.info(message, {
    category: "PERFORMANCE",
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

logger.audit = (message, meta = {}) => {
  logger.info(message, {
    category: "AUDIT",
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

logger.api = (message, meta = {}) => {
  logger.http(message, {
    category: "API",
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

// Request logging middleware helper
logger.createRequestLogger = () => {
  return (req, res, next) => {
    const startTime = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - startTime;
      const logData = {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        userId: req.user?.id || null,
      };

      if (res.statusCode >= 400) {
        logger.warn("HTTP Request Error", logData);
      } else {
        logger.api("HTTP Request", logData);
      }
    });

    next();
  };
};

// Error logging helper
logger.logError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    context,
    timestamp: new Date().toISOString(),
  };

  logger.error("Application Error", errorInfo);
};

// Payment-specific logging helpers
logger.paymentInitiated = (orderId, amount, method) => {
  logger.payment("Payment Initiated", {
    action: "INITIATED",
    orderId,
    amount,
    method,
  });
};

logger.paymentCompleted = (orderId, transactionId, amount) => {
  logger.payment("Payment Completed", {
    action: "COMPLETED",
    orderId,
    transactionId,
    amount,
  });
};

logger.paymentFailed = (orderId, reason, amount) => {
  logger.payment("Payment Failed", {
    action: "FAILED",
    orderId,
    reason,
    amount,
  });
};

// Security logging helpers
logger.authAttempt = (email, success, ip) => {
  logger.security("Authentication Attempt", {
    action: "AUTH_ATTEMPT",
    email,
    success,
    ip,
  });
};

logger.suspiciousActivity = (activity, details) => {
  logger.security("Suspicious Activity Detected", {
    activity,
    details,
    severity: "HIGH",
  });
};

// Performance logging helpers
logger.slowQuery = (query, duration) => {
  logger.performance("Slow Database Query", {
    query,
    duration,
    threshold: "1000ms",
  });
};

logger.apiPerformance = (endpoint, duration, statusCode) => {
  logger.performance("API Performance", {
    endpoint,
    duration,
    statusCode,
  });
};

// Stream for Morgan HTTP logger integration
logger.stream = {
  write: (message) => {
    logger.api(message.trim());
  },
};

// Cleanup function for graceful shutdown
logger.cleanup = () => {
  return new Promise((resolve) => {
    logger.on("finish", () => {
      resolve();
    });
    logger.end();
  });
};

module.exports = logger;
