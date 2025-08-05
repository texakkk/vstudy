require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

// Validate required environment variables
["MONGO_URI", "CLIENT_URL"].forEach((key) => {
  if (!process.env[key]) {
    console.warn(`⚠️ Missing required environment variable: ${key}`);
  }
});

const allowedOrigins = [process.env.CLIENT_URL || "http://localhost:3000"];

// Create Express and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS settings
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  exposedHeaders: ["Content-Disposition", "Authorization"],
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options("*", cors(corsOptions));

// Serve static files with proper headers
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    dotfiles: "allow",
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Cache-Control", "public, max-age=31536000");
      res.setHeader(
        "Access-Control-Expose-Headers",
        "Content-Length,Content-Type"
      );
    },
  })
);

app.set("io", io); // Make io accessible in routes if needed

// Route imports
const authRoutes = require("./routes/auth");
const groupRoutes = require("./routes/group");
const taskRoutes = require("./routes/task");
const messageRoutes = require("./routes/message");
const videosessionRoutes = require("./routes/videosession");
const settingsRoutes = require("./routes/settings");
const dashboardRoutes = require("./routes/dashboard");
const notificationRoutes = require("./routes/notification");
const searchRoutes = require("./routes/search");
const reportRoutes = require("./routes/report");

// Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/group", groupRoutes);
app.use("/api/task", taskRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/videosession", videosessionRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/report", reportRoutes);

// Root route for testing
app.get("/", (req, res) => {
  res.send("Welcome to the Virtual Study Group API!");
});

// Connect to MongoDB Atlas using Mongoose
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Setup custom socket handlers
const setupChatSockets = require("./sockets/chatsocket");
const setupVideoChatSockets = require("./sockets/Videochatsocket");
const setupNotificationSockets = require("./sockets/notificationSocket");

setupChatSockets(io);
setupVideoChatSockets(io);
const notificationNamespace = setupNotificationSockets(io);

// Make notification namespace available to routes
app.set("notificationNamespace", notificationNamespace);

// Global error handler
app.use((err, req, res, next) => {
  console.error("❗ Global error handler:", err.message);
  res.status(500).json({ message: "Server Error", error: err.message });
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
