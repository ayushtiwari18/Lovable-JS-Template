const cors = require("cors");

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
          console.warn("CORS blocked request", {
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

  // Production CORS (strict) - Recommended for your use case
  productionCors() {
    const allowedOrigins = this.getAllowedOrigins();

    return cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.error("CORS violation attempt", {
            origin,
            timestamp: new Date().toISOString(),
          });
          callback(new Error("CORS policy violation"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Added OPTIONS
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-API-Key",
        "X-Verify",
        "X-Requested-With", // Added this back
      ],
      optionsSuccessStatus: 200,
      maxAge: 3600, // 1 hour
    });
  }

  // ✅ FIXED: Corrected allowed origins
  getAllowedOrigins() {
    const baseOrigins = [
      `http://localhost:3000`,
      `http://localhost:5173`,
      `http://localhost:3001`,
      `https://shrifal-handicrafts.netlify.app`, // ✅ Removed trailing slash
    ];

    // Add custom origins from environment
    if (process.env.ALLOWED_ORIGINS) {
      return baseOrigins.concat(
        process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
      );
    }

    // ✅ FIXED: Use your actual domain
    if (process.env.NODE_ENV === "production") {
      return [
        ...baseOrigins,
        `https://shrifal-handicrafts.onrender.com`, // Your backend domain
      ];
    }

    return baseOrigins;
  }

  // CORS error handler
  handleCorsError(err, req, res, next) {
    if (err.message.includes("CORS")) {
      console.warn("CORS error", {
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
