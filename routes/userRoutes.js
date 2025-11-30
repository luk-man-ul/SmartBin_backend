const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendMail = require("../utils/mailer");  // <-- Brevo mail sender



// ---------------- SIGNUP ----------------
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    const accessToken = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    res.status(201).json({
      message: "Signup successful",
      user: newUser,
      accessToken,
      refreshToken
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});



// ---------------- LOGIN ----------------
router.post("/login", async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid password" });

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: rememberMe ? "7d" : "1d"
    });

    res.status(200).json({
      message: "Login successful",
      user,
      accessToken,
      refreshToken,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});



// ---------------- FORGOT PASSWORD (SEND OTP) ----------------
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ message: "Email not registered" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.resetOTPHash = hashedOtp;
    user.resetExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Send OTP using BREVO
    const mailSent = await sendMail(email, otp);

    if (!mailSent) {
      user.resetOTPHash = null;
      user.resetExpires = null;
      await user.save();
      return res.status(500).json({ message: "Failed to send OTP" });
    }

    return res.json({ message: "OTP sent successfully" });

  } catch (error) {
    console.error("Forgot-password error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});



// ---------------- VERIFY OTP ----------------
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ message: "Email & OTP required" });

    const user = await User.findOne({ email });

    if (!user || !user.resetOTPHash)
      return res.status(400).json({ message: "Invalid request" });

    if (Date.now() > user.resetExpires)
      return res.status(400).json({ message: "OTP expired" });

    const match = await bcrypt.compare(otp, user.resetOTPHash);

    if (!match)
      return res.status(400).json({ message: "Invalid OTP" });

    user.resetOTPHash = null;
    user.resetExpires = null;
    await user.save();

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    res.json({
      message: "OTP verified successfully",
      user,
      accessToken,
      refreshToken
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});



// ---------------- GET USER BY ID ----------------
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("name email rewardPoints");

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json(user);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- REFRESH TOKEN ----------------
router.post("/refresh-token", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(401).json({ message: "No refresh token provided" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    const newAccessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.json({ accessToken: newAccessToken });

  } catch (err) {
    return res.status(403).json({ message: "Expired or invalid refresh token" });
  }
});
s

module.exports = router;
