const cors = require("cors");
const logger = require("../utils/logger");
const config = require("../config/environment");

class CorsMiddleware {
  // Basic CORS configuration
  basicCors() {
    const allowedOrigins = this.getAllowedOrigins();

    return cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          logger.warn("CORS blocked request", {
            origin,
            allowedOrigins,
          });
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-API-Key",
        "X-Verify",
      ],
      exposedHeaders: ["X-Total-Count", "X-RateLimit-Remaining"],
      maxAge: 86400, // 24 hours
    });
  }

  // Development CORS (allows all origins)
  developmentCors() {
    if (config.nodeEnv !== "development") {
      throw new Error(
        "Development CORS can only be used in development environment"
      );
    }

    return cors({
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: "*",
    });
  }

  // Production CORS (strict)
  productionCors() {
    const allowedOrigins = this.getAllowedOrigins();

    return cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          logger.error("CORS violation attempt", {
            origin,
            timestamp: new Date().toISOString(),
          });
          callback(new Error("CORS policy violation"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-API-Key",
        "X-Verify",
      ],
      optionsSuccessStatus: 200,
      maxAge: 3600, // 1 hour
    });
  }

  // API-specific CORS
  apiCors() {
    return cors({
      origin: this.getAllowedOrigins(),
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
      credentials: false, // API doesn't need credentials
    });
  }

  // Webhook CORS (for payment callbacks)
  webhookCors() {
    const webhookOrigins = [
      "https://api.phonepe.com",
      "https://api-preprod.phonepe.com",
      "https://sandbox.phonepe.com",
    ];

    return cors({
      origin: (origin, callback) => {
        // Allow no origin for server-to-server calls
        if (!origin) return callback(null, true);

        if (webhookOrigins.includes(origin)) {
          callback(null, true);
        } else {
          logger.warn("Webhook CORS blocked", { origin });
          callback(new Error("Webhook origin not allowed"));
        }
      },
      methods: ["POST"],
      allowedHeaders: ["Content-Type", "X-Verify", "User-Agent"],
      credentials: false,
    });
  }

  // Admin panel CORS
  adminCors() {
    const adminOrigins = process.env.ADMIN_ORIGINS
      ? process.env.ADMIN_ORIGINS.split(",")
      : [`http://localhost:3001`, `https://admin.${process.env.DOMAIN}`];

    return cors({
      origin: adminOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    });
  }

  // Mobile app CORS
  mobileCors() {
    return cors({
      origin: false, // Mobile apps don't send origin header
      credentials: false,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-App-Version",
        "X-Device-ID",
      ],
    });
  }

  // Dynamic CORS based on request type
  dynamicCors() {
    return (req, res, next) => {
      let corsOptions;

      // Different CORS for different endpoints
      if (req.path.startsWith("/webhook") || req.path.startsWith("/callback")) {
        corsOptions = this.getWebhookCorsOptions();
      } else if (req.path.startsWith("/admin")) {
        corsOptions = this.getAdminCorsOptions();
      } else if (req.path.startsWith("/api")) {
        corsOptions = this.getApiCorsOptions();
      } else {
        corsOptions = this.getBasicCorsOptions();
      }

      cors(corsOptions)(req, res, next);
    };
  }

  // Helper methods
  getAllowedOrigins() {
    const baseOrigins = [
      `http://localhost:3000`,
      `http://localhost:5173`,
      `http://localhost:3001`,
      `https://shrifal-handicrafts.onrender.com`,
    ];

    if (process.env.ALLOWED_ORIGINS) {
      return baseOrigins.concat(process.env.ALLOWED_ORIGINS.split(","));
    }

    if (config.nodeEnv === "production") {
      return [
        `https://${process.env.DOMAIN}`,
        `https://www.${process.env.DOMAIN}`,
        `https://app.${process.env.DOMAIN}`,
      ];
    }

    return baseOrigins;
  }

  getBasicCorsOptions() {
    return {
      origin: this.getAllowedOrigins(),
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    };
  }

  getWebhookCorsOptions() {
    return {
      origin: false,
      credentials: false,
      methods: ["POST"],
      allowedHeaders: ["Content-Type", "X-Verify"],
    };
  }

  getAdminCorsOptions() {
    return {
      origin: [`http://localhost:3001`, `https://admin.${process.env.DOMAIN}`],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    };
  }

  getApiCorsOptions() {
    return {
      origin: this.getAllowedOrigins(),
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    };
  }

  // CORS error handler
  handleCorsError(err, req, res, next) {
    if (err.message.includes("CORS")) {
      logger.warn("CORS error", {
        origin: req.get("origin"),
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      return res.status(403).json({
        success: false,
        message: "CORS policy violation",
        timestamp: new Date().toISOString(),
      });
    }
    next(err);
  }
}

module.exports = new CorsMiddleware();
