const dotenv = require("dotenv");
const path = require("path");

// Load environment-specific .env file
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : process.env.NODE_ENV === "staging"
    ? ".env.staging"
    : process.env.NODE_ENV === "test"
    ? ".env.test"
    : ".env.development";

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Load default .env as fallback
dotenv.config();

class EnvironmentConfig {
  constructor() {
    this.validateRequiredEnvVars();
  }

  // Application Configuration
  get app() {
    return {
      name: process.env.APP_NAME || "PhonePe Payment Service",
      version: process.env.APP_VERSION || "1.0.0",
      description:
        process.env.APP_DESCRIPTION ||
        "Payment processing service with PhonePe integration",
      port: parseInt(process.env.PORT) || 3000,
      host: process.env.HOST || "localhost",
      nodeEnv: process.env.NODE_ENV || "development",
      timezone: process.env.TZ || "Asia/Kolkata",
      locale: process.env.LOCALE || "en-IN",
    };
  }

  // Server Configuration
  get server() {
    return {
      keepAliveTimeout: parseInt(process.env.KEEP_ALIVE_TIMEOUT) || 61000,
      headersTimeout: parseInt(process.env.HEADERS_TIMEOUT) || 65000,
      maxConnections: parseInt(process.env.MAX_CONNECTIONS) || 1000,
      timeout: parseInt(process.env.SERVER_TIMEOUT) || 30000,
      bodyLimit: process.env.BODY_LIMIT || "10mb",
      corsOrigin: this.getCorsOrigins(),
      trustedProxies: this.getTrustedProxies(),
    };
  }

  // Database Configuration (Supabase)
  get database() {
    return {
      supabase: {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        jwtSecret: process.env.SUPABASE_JWT_SECRET,
        options: {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          },
          realtime: {
            params: {
              eventsPerSecond: 10,
            },
          },
        },
      },
      // Connection pool settings
      pool: {
        min: parseInt(process.env.DB_POOL_MIN) || 2,
        max: parseInt(process.env.DB_POOL_MAX) || 10,
        acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 30000,
        createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT) || 30000,
        destroyTimeoutMillis: parseInt(process.env.DB_DESTROY_TIMEOUT) || 5000,
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
        reapIntervalMillis: parseInt(process.env.DB_REAP_INTERVAL) || 1000,
        createRetryIntervalMillis:
          parseInt(process.env.DB_CREATE_RETRY_INTERVAL) || 200,
      },
    };
  }

  // Redis Configuration
  get redis() {
    return {
      enabled: process.env.REDIS_ENABLED === "true",
      url: process.env.REDIS_URL,
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      database: parseInt(process.env.REDIS_DB) || 0,
      keyPrefix: process.env.REDIS_KEY_PREFIX || "phonepe:",
      connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 10000,
      commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT) || 5000,
      retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY) || 100,
      maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES) || 3,
      lazyConnect: true,
      // Connection pool settings
      maxPoolSize: parseInt(process.env.REDIS_MAX_POOL_SIZE) || 50,
      minPoolSize: parseInt(process.env.REDIS_MIN_POOL_SIZE) || 5,
    };
  }

  // PhonePe Configuration
  get phonepe() {
    return {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      saltKey: process.env.PHONEPE_SALT_KEY,
      saltIndex: parseInt(process.env.PHONEPE_SALT_INDEX) || 1,
      baseUrl: this.getPhonePeBaseUrl(),
      redirectUrl:
        process.env.PHONEPE_REDIRECT_URL ||
        `${this.getBaseUrl()}/api/payments/redirect`,
      callbackUrl:
        process.env.PHONEPE_CALLBACK_URL ||
        `${this.getBaseUrl()}/api/payments/callback`,
      timeout: parseInt(process.env.PHONEPE_TIMEOUT) || 30000,
      retryAttempts: parseInt(process.env.PHONEPE_RETRY_ATTEMPTS) || 3,
      retryDelay: parseInt(process.env.PHONEPE_RETRY_DELAY) || 1000,
    };
  }

  // JWT Configuration
  get jwt() {
    return {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
      issuer: process.env.JWT_ISSUER || "phonepe-payment-service",
      audience: process.env.JWT_AUDIENCE || "phonepe-users",
      algorithm: process.env.JWT_ALGORITHM || "HS256",
    };
  }

  // Security Configuration
  get security() {
    return {
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
      apiKey: process.env.API_KEY,
      encryptionKey: process.env.ENCRYPTION_KEY,
      sessionSecret: process.env.SESSION_SECRET,
      csrfSecret: process.env.CSRF_SECRET,
      rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== "false",
      corsEnabled: process.env.CORS_ENABLED !== "false",
      helmetEnabled: process.env.HELMET_ENABLED !== "false",
      httpsOnly: process.env.HTTPS_ONLY === "true",
      trustProxy: process.env.TRUST_PROXY === "true",
    };
  }

  // Email Configuration
  get email() {
    return {
      enabled: process.env.EMAIL_ENABLED === "true",
      smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASSWORD,
        pool: process.env.SMTP_POOL === "true",
        maxConnections: parseInt(process.env.SMTP_MAX_CONNECTIONS) || 5,
        maxMessages: parseInt(process.env.SMTP_MAX_MESSAGES) || 100,
      },
      from: process.env.EMAIL_FROM || "noreply@phonepe-service.com",
      replyTo: process.env.EMAIL_REPLY_TO,
      templates: {
        path: process.env.EMAIL_TEMPLATES_PATH || "./templates/email",
      },
    };
  }

  // Logging Configuration
  get logging() {
    return {
      level:
        process.env.LOG_LEVEL ||
        (this.app.nodeEnv === "production" ? "info" : "debug"),
      format: process.env.LOG_FORMAT || "json",
      colorize: process.env.LOG_COLORIZE !== "false",
      timestamp: process.env.LOG_TIMESTAMP !== "false",
      maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
      maxSize: process.env.LOG_MAX_SIZE || "5m",
      datePattern: process.env.LOG_DATE_PATTERN || "YYYY-MM-DD",
      // External logging service
      externalService: process.env.LOG_EXTERNAL_SERVICE
        ? {
            enabled: true,
            host: process.env.LOG_EXTERNAL_HOST,
            port: parseInt(process.env.LOG_EXTERNAL_PORT),
            path: process.env.LOG_EXTERNAL_PATH,
            auth: process.env.LOG_EXTERNAL_AUTH
              ? {
                  username: process.env.LOG_EXTERNAL_USERNAME,
                  password: process.env.LOG_EXTERNAL_PASSWORD,
                }
              : null,
          }
        : { enabled: false },
    };
  }

  // File Upload Configuration
  get upload() {
    return {
      destination: process.env.UPLOAD_DESTINATION || "./uploads",
      maxFileSize:
        parseInt(process.env.UPLOAD_MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
      maxFiles: parseInt(process.env.UPLOAD_MAX_FILES) || 5,
      allowedImageTypes: (
        process.env.UPLOAD_ALLOWED_IMAGE_TYPES || "jpeg,jpg,png,gif,webp"
      ).split(","),
      allowedDocTypes: (
        process.env.UPLOAD_ALLOWED_DOC_TYPES || "pdf,doc,docx"
      ).split(","),
      preservePath: process.env.UPLOAD_PRESERVE_PATH === "true",
      // Cloud storage (if enabled)
      cloudStorage: {
        enabled: process.env.CLOUD_STORAGE_ENABLED === "true",
        provider: process.env.CLOUD_STORAGE_PROVIDER, // aws, gcp, azure
        bucket: process.env.CLOUD_STORAGE_BUCKET,
        region: process.env.CLOUD_STORAGE_REGION,
        accessKeyId: process.env.CLOUD_STORAGE_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUD_STORAGE_SECRET_ACCESS_KEY,
      },
    };
  }

  // Rate Limiting Configuration
  get rateLimit() {
    return {
      enabled: process.env.RATE_LIMIT_ENABLED !== "false",
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
      skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESS === "true",
      skipFailedRequests: process.env.RATE_LIMIT_SKIP_FAILED === "true",
      // Different limits for different endpoints
      payment: {
        windowMs:
          parseInt(process.env.RATE_LIMIT_PAYMENT_WINDOW) || 15 * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_PAYMENT_MAX) || 5,
      },
      auth: {
        windowMs:
          parseInt(process.env.RATE_LIMIT_AUTH_WINDOW) || 15 * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 10,
      },
      upload: {
        windowMs: parseInt(process.env.RATE_LIMIT_UPLOAD_WINDOW) || 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_UPLOAD_MAX) || 10,
      },
    };
  }

  // Monitoring and Analytics
  get monitoring() {
    return {
      enabled: process.env.MONITORING_ENABLED === "true",
      metricsEnabled: process.env.METRICS_ENABLED === "true",
      healthCheckPath: process.env.HEALTH_CHECK_PATH || "/health",
      metricsPath: process.env.METRICS_PATH || "/metrics",
      // APM Configuration
      apm: {
        enabled: process.env.APM_ENABLED === "true",
        serviceName: process.env.APM_SERVICE_NAME || "phonepe-payment-service",
        serverUrl: process.env.APM_SERVER_URL,
        secretToken: process.env.APM_SECRET_TOKEN,
        environment: process.env.APM_ENVIRONMENT || this.app.nodeEnv,
      },
      // Sentry Configuration
      sentry: {
        enabled: process.env.SENTRY_ENABLED === "true",
        dsn: process.env.SENTRY_DSN,
        environment: process.env.SENTRY_ENVIRONMENT || this.app.nodeEnv,
        release: process.env.SENTRY_RELEASE || this.app.version,
        tracesSampleRate:
          parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
      },
    };
  }

  // Frontend Configuration
  get frontend() {
    return {
      url: process.env.FRONTEND_URL || "http://localhost:5173",
      adminUrl: process.env.ADMIN_FRONTEND_URL || "http://localhost:3001",
    };
  }

  // Webhook Configuration
  get webhook() {
    return {
      enabled: process.env.WEBHOOK_ENABLED === "true",
      secret: process.env.WEBHOOK_SECRET,
      timeout: parseInt(process.env.WEBHOOK_TIMEOUT) || 10000,
      retryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS) || 3,
      retryDelay: parseInt(process.env.WEBHOOK_RETRY_DELAY) || 2000,
    };
  }

  // Feature Flags
  get features() {
    return {
      emailNotifications: process.env.FEATURE_EMAIL_NOTIFICATIONS !== "false",
      smsNotifications: process.env.FEATURE_SMS_NOTIFICATIONS === "true",
      pushNotifications: process.env.FEATURE_PUSH_NOTIFICATIONS === "true",
      analytics: process.env.FEATURE_ANALYTICS !== "false",
      auditLogs: process.env.FEATURE_AUDIT_LOGS !== "false",
      multiCurrency: process.env.FEATURE_MULTI_CURRENCY === "true",
      refunds: process.env.FEATURE_REFUNDS !== "false",
    };
  }

  // Helper Methods
  getPhonePeBaseUrl() {
    if (process.env.PHONEPE_BASE_URL) {
      return process.env.PHONEPE_BASE_URL;
    }

    return this.app.nodeEnv === "production"
      ? "https://api.phonepe.com/apis/hermes/pg/v1"
      : "https://api-preprod.phonepe.com/apis/pg-sandbox";
  }

  getBaseUrl() {
    const protocol = this.security.httpsOnly ? "https" : "http";
    const host =
      process.env.BASE_URL || `${protocol}://${this.app.host}:${this.app.port}`;
    return host;
  }

  getCorsOrigins() {
    const origins = process.env.CORS_ORIGINS;
    if (!origins) {
      return this.app.nodeEnv === "production"
        ? [this.frontend.url, this.frontend.adminUrl]
        : true; // Allow all origins in development
    }
    return origins.split(",").map((origin) => origin.trim());
  }

  getTrustedProxies() {
    const proxies = process.env.TRUSTED_PROXIES;
    if (!proxies) return [];
    return proxies.split(",").map((proxy) => proxy.trim());
  }

  // Environment Validation
  validateRequiredEnvVars() {
    const required = [
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
      "PHONEPE_MERCHANT_ID",
      "PHONEPE_SALT_KEY",
      "JWT_SECRET",
    ];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`
      );
    }

    // Additional production-specific validations
    if (this.app.nodeEnv === "production") {
      const prodRequired = [
        "SUPABASE_SERVICE_ROLE_KEY",
        "API_KEY",
        "ENCRYPTION_KEY",
        "SESSION_SECRET",
      ];

      const missingProd = prodRequired.filter((key) => !process.env[key]);

      if (missingProd.length > 0) {
        throw new Error(
          `Missing required production environment variables: ${missingProd.join(
            ", "
          )}`
        );
      }
    }
  }

  // Get all configuration
  getAll() {
    return {
      app: this.app,
      server: this.server,
      database: this.database,
      redis: this.redis,
      phonepe: this.phonepe,
      jwt: this.jwt,
      security: this.security,
      email: this.email,
      logging: this.logging,
      upload: this.upload,
      rateLimit: this.rateLimit,
      monitoring: this.monitoring,
      frontend: this.frontend,
      webhook: this.webhook,
      features: this.features,
    };
  }

  // Check if running in production
  isProduction() {
    return this.app.nodeEnv === "production";
  }

  // Check if running in development
  isDevelopment() {
    return this.app.nodeEnv === "development";
  }

  // Check if running in test environment
  isTest() {
    return this.app.nodeEnv === "test";
  }
}

// Create and export singleton instance
const config = new EnvironmentConfig();

module.exports = config;
