const jwt = require("jsonwebtoken");
const { supabase } = require("../config/supabaseClient");
const logger = require("../utils/logger");
const config = require("../config/environment");

class AuthMiddleware {
  // JWT authentication middleware
  async authenticateToken(req, res, next) {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Access token is required",
        });
      }

      // Verify JWT token
      const decoded = jwt.verify(token, config.jwt.secret);

      // Get user from database
      const { data: user, error } = await supabase
        .from("users")
        .select("id, email, role, status, created_at")
        .eq("id", decoded.userId)
        .single();

      if (error || !user) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired token",
        });
      }

      if (user.status !== "active") {
        return res.status(401).json({
          success: false,
          message: "Account is inactive",
        });
      }

      // Add user info to request
      req.user = {
        ...user,
        isAdmin: user.role === "admin",
        isModerator: ["admin", "moderator"].includes(user.role),
      };

      next();
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }

      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired",
        });
      }

      logger.error("Auth middleware error", { error: error.message });
      return res.status(500).json({
        success: false,
        message: "Authentication error",
      });
    }
  }

  // Optional authentication (for routes that work with or without auth)
  async optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
        req.user = null;
        return next();
      }

      const decoded = jwt.verify(token, config.jwt.secret);

      const { data: user, error } = await supabase
        .from("users")
        .select("id, email, role, status")
        .eq("id", decoded.userId)
        .single();

      if (!error && user && user.status === "active") {
        req.user = {
          ...user,
          isAdmin: user.role === "admin",
          isModerator: ["admin", "moderator"].includes(user.role),
        };
      } else {
        req.user = null;
      }

      next();
    } catch (error) {
      // If token is invalid, just continue without user
      req.user = null;
      next();
    }
  }

  // Admin role check
  requireAdmin(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    next();
  }

  // Moderator role check (admin or moderator)
  requireModerator(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!req.user.isModerator) {
      return res.status(403).json({
        success: false,
        message: "Moderator access required",
      });
    }

    next();
  }

  // API Key authentication (for webhooks/callbacks)
  authenticateApiKey(req, res, next) {
    try {
      const apiKey = req.headers["x-api-key"] || req.query.apiKey;

      if (!apiKey) {
        return res.status(401).json({
          success: false,
          message: "API key is required",
        });
      }

      if (apiKey !== config.apiKey) {
        logger.warn("Invalid API key attempt", {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        });

        return res.status(401).json({
          success: false,
          message: "Invalid API key",
        });
      }

      next();
    } catch (error) {
      logger.error("API key auth error", { error: error.message });
      return res.status(500).json({
        success: false,
        message: "Authentication error",
      });
    }
  }

  // Check if user owns resource or is admin
  checkResourceOwnership(resourceIdParam = "userId") {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const resourceId = req.params[resourceIdParam];

      if (req.user.isAdmin || req.user.id === resourceId) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    };
  }

  // Generate JWT token
  generateToken(payload, expiresIn = config.jwt.expiresIn) {
    return jwt.sign(payload, config.jwt.secret, { expiresIn });
  }

  // Verify PhonePe callback signature
  verifyPhonePeSignature(req, res, next) {
    try {
      const receivedSignature = req.headers["x-verify"];

      if (!receivedSignature) {
        return res.status(401).json({
          success: false,
          message: "Signature verification failed",
        });
      }

      // PhonePe signature verification logic would go here
      // This is a simplified version - implement according to PhonePe docs
      const [hash, saltIndex] = receivedSignature.split("###");

      if (!hash || saltIndex !== config.phonepe.saltIndex.toString()) {
        logger.warn("Invalid PhonePe signature", {
          receivedSignature,
          ip: req.ip,
        });

        return res.status(401).json({
          success: false,
          message: "Invalid signature",
        });
      }

      next();
    } catch (error) {
      logger.error("PhonePe signature verification error", {
        error: error.message,
      });
      return res.status(401).json({
        success: false,
        message: "Signature verification failed",
      });
    }
  }
}

module.exports = new AuthMiddleware();
