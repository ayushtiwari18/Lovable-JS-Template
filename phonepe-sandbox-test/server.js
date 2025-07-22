require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const { getEnvironmentConfig } = require("./src/config/environment");

const { frontendUrl, isDevelopment } = getEnvironmentConfig();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration
const corsOptions = {
  origin: isDevelopment
    ? [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:3001",
      ]
    : [frontendUrl, process.env.FRONTEND_URL],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

// Rest of your middleware and routes...

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

console.log("✅ Middleware configured");

// Routes
app.get("/", (req, res) => {
  res.render("index");
});

console.log("✅ Root route configured");

try {
  console.log("🔄 Loading payment routes...");
  const paymentRoutes = require("./src/routes/payment");
  app.use("/", paymentRoutes);
  console.log("✅ Payment routes loaded successfully");
} catch (error) {
  console.error("❌ Failed to load payment routes:", error.message);
  process.exit(1);
}

try {
  console.log("🔄 Loading upload routes...");
  const uploadRoutes = require("./src/routes/upload");
  app.use("/api/upload", uploadRoutes);
  console.log("✅ Upload routes loaded successfully");
} catch (error) {
  console.error("❌ Failed to load upload routes:", error.message);
  console.error("This might be expected if upload routes don't exist yet");
}

// Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
    timestamp: new Date().toISOString(),
  });
});

console.log("✅ Error handler configured");

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`💡 Ready to accept requests!`);
});

console.log("✅ Server setup complete");
