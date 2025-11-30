const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer");

// ---------------- EMAIL SENDER (Nodemailer) ----------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper method to send email
async function sendMail(to, otp) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: "Your Verification OTP",
      html: `<h2>Your OTP is:</h2>
             <h1 style="color:blue;">${otp}</h1>
             <p>Expires in 10 minutes</p>`
    });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

// ---------------- SIGNUP (Auto Login) ----------------
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    // 🔥 Create tokens (same as login)
    const accessToken = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    // 🔥 Return tokens + user data
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


// ---------------- LOGIN + REMEMBER ME ----------------
router.post("/login", async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid password" });

    // Token handling
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

// ---------------- FORGOT PASSWORD (Send OTP) ----------------
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "Email not registered" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.resetOTPHash = hashedOtp;
    user.resetExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const mailSent = await sendMail(email, otp);
    if (!mailSent) return res.status(500).json({ message: "Failed to send email" });

    res.json({ message: "OTP sent to your email" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- VERIFY OTP ----------------
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

    // Clear OTP
    user.resetOTPHash = null;
    user.resetExpires = null;
    await user.save();

    // 🔥 Create new tokens (same as login)
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    // 🔥 Return tokens + user
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

// ---------------- REFRESH TOKEN ROUTE ----------------
router.post("/refresh-token", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: "Expired or invalid refresh token" });
  }
});

// ---------------- GET USER BY ID (for Dashboard Points) ----------------
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("name email rewardPoints");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
