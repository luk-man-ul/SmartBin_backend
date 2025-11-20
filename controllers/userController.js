const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { sendOTP } = require("../utils/mailer");

// Generate OTP helper
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Step 1: Request OTP
exports.requestOTP = async (req, res) => {
  const { email } = req.body;

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ email });
  }

  const otp = generateOTP();
  user.otp = otp;
  user.otpExpiry = Date.now() + 2 * 60 * 1000; // 2 min
  await user.save();

  await sendOTP(email, otp);

  res.json({ success: true, msg: "OTP sent to email." });
};

// Step 2: Verify OTP / Login
exports.verifyOTP = async (req, res) => {
  const { email, otp, rememberMe } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
    return res.status(400).json({ success: false, msg: "Invalid or expired OTP." });
  }

  // Reset OTP
  user.otp = null;
  user.otpExpiry = null;

  // Create tokens
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: rememberMe ? "7d" : "1d" });

  user.refreshToken = refreshToken;
  await user.save();

  res.json({ success: true, accessToken, refreshToken });
};
