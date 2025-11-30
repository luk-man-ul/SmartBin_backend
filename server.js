require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const userRoutes = require("./routes/userRoutes");
const binRoutes = require("./routes/binRoutes"); 
const rewardRoutes = require("./routes/rewardRoutes");



const app = express();

// middleware
app.use(cors());
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
app.use("/api/users", userRoutes);   // existing user routes
app.use("/api/bin", binRoutes);      
app.use("/api/history", rewardRoutes);

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});