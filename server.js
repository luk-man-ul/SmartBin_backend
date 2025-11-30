require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const userRoutes = require("./routes/userRoutes");
const binRoutes = require("./routes/binRoutes");
const rewardRoutes = require("./routes/rewardRoutes");

const app = express();

// -------------------- CORS FIX --------------------
app.use(cors({
  origin: "http://localhost:5173",   // your frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// middleware
app.use(express.json());

// connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// test route
app.get("/", (req, res) => {
  res.send("Backend is working!");
});

// use routes
app.use("/api/users", userRoutes);
app.use("/api/bin", binRoutes);
app.use("/api/history", rewardRoutes);

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
