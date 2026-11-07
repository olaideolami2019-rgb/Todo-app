
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const { setSocket } = require("./config/socket");


const authRoutes = require("./routes/auth");
const todoRoutes = require("./routes/todo");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

setSocket(io);

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// ROUTES
app.use("/auth", authRoutes);
app.use("/todos", todoRoutes);

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/dashboard", (req, res) => {
  res.render("dashboard");
});

// SOCKET.IO JWT AUTHENTICATION
const { authenticateToken } = require("./middleware/auth");

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    const decoded = authenticateToken(token);

    socket.userId = decoded.userId;

    next();
  } catch (error) {
    next(new Error("Unauthorized: Invalid or expired token"));
  }
});

// SOCKET.IO CONNECTION
io.on("connection", (socket) => {
  console.log("Authenticated user connected:", socket.userId);

  // Each user joins their own private room
  socket.join(socket.userId.toString());

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.userId);
  });
});

// CONNECT TO DATABASE AND START SERVER
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    require("./jobs/overdueChecker");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.log("Database connection failed:", error.message);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server, io };
