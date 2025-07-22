require("dotenv").config();

const config = {
  MERCHANT_ID: process.env.PHONEPE_MERCHANT_ID || process.env.MERCHANT_ID,
  SALT_KEY: process.env.PHONEPE_SALT_KEY || process.env.SALT_KEY,
  SALT_INDEX: process.env.PHONEPE_SALT_INDEX || process.env.SALT_INDEX,
  BASE_URL:
    process.env.PHONEPE_BASE_URL ||
    "https://api-preprod.phonepe.com/apis/pg-sandbox",
  getRedirectUrl: (port) =>
    process.env.REDIRECT_URL || `http://localhost:${port}/redirect`,
  getCallbackUrl: (port) =>
    process.env.CALLBACK_URL || `http://localhost:${port}/callback`,
};

// Validate required config
const requiredFields = ["MERCHANT_ID", "SALT_KEY", "SALT_INDEX"];
const missing = requiredFields.filter((field) => !config[field]);

if (missing.length > 0) {
  console.error("❌ Missing required PhonePe configuration:", missing);
  console.error(
    "Available env vars:",
    Object.keys(process.env).filter((key) => key.includes("PHONEPE"))
  );
  process.exit(1);
}

console.log("✅ PhonePe config loaded:", {
  merchantId: config.MERCHANT_ID,
  saltIndex: config.SALT_INDEX,
  baseUrl: config.BASE_URL,
});

module.exports = config;
