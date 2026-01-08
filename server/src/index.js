require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");
const authModel = require("./models/authModel");

// Connect to MongoDB
connectDB();

const app = express();
app.get("/api/health", (req, res) => {
  res.status(200).send("OK");
});

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        process.env.FRONTEND_URL || "http://localhost:3000", // ✅ Your frontend
      ];

      if (process.env.NODE_ENV === "development") {
        console.log(`✅ [DEV MODE] CORS Allowed: ${origin}`);
        return callback(null, true);
      }

      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn(`❌ CORS Blocked: ${origin}`);
        return callback(new Error("CORS not allowed"), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["set-cookie"],
  })
);

app.use(express.json());
app.use(cookieParser());

// Import routes
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const appointmentsRoutes = require("./routes/appointments");

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/tests", require("./routes/tests"));
app.use("/api/learning-plans", require("./routes/learningPlans"));
app.use("/api/messages", require("./routes/messages"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Schedule cleanup of temporary users
// Run every 12 hours
const CLEANUP_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours (43200000ms)

setInterval(async () => {
  console.log("--------------------------------------------------");
  console.log("Running scheduled cleanup of temporary users");
  try {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString("en-US", { hour12: true });
    const formattedDate = now.toLocaleDateString("en-US");
    console.log(`Cleanup time => ${formattedTime} - ${formattedDate},`);
    const cleanPatient = await authModel.cleanupTemporaryPatients();
    const cleanPsy = await authModel.cleanupTemporaryPsychiatrists();
    console.log("--------------------------------------------------");
  } catch (error) {
    console.error("Error in scheduled cleanup:", error);
  }
}, CLEANUP_INTERVAL);

// // Run cleanup on startup as well
// setTimeout(async () => {
//   console.log("--------------------------------------------");
//   console.log("✅ Running initial cleanup of temporary users");
//   try {
//     const result = await authModel.cleanupTemporaryUsers();
//     console.log("✅ Initial cleanup result:", result);
//   } catch (error) {
//     console.error("❌ Error in initial cleanup:", error);
//   }
//   console.log("--------------------------------------------");
// }, 5000); // Wait 5 seconds after startup

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong!",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  // Close server & exit process
  process.exit(1);
});

const PORT = process.env.PORT || 5000; // 👈 Match this with .env

app.listen(PORT, () => {
  console.log(`--------------------------------------------`);
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT} 🔌`
  );
  console.log(`✅ Backend: http://localhost:${PORT}`);
  console.log(`✅ Frontend: http://localhost:3000`);
});
