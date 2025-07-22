const getEnvironmentConfig = () => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const baseUrl = isDevelopment
    ? "http://localhost:3000"
    : process.env.RENDER_EXTERNAL_URL || "https://your-app-name.onrender.com";

  const frontendUrl = isDevelopment
    ? "http://localhost:5173"
    : process.env.FRONTEND_URL || "https://your-frontend-app.vercel.app";

  return {
    baseUrl,
    frontendUrl,
    isDevelopment,
  };
};

module.exports = { getEnvironmentConfig };
