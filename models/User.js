const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // Reward Points (important!)
    rewardPoints: { type: Number, default: 0 },

    // OTP Login
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },

    // Remember-Me Refresh Token
    refreshToken: { type: String, default: null },

    // Forgot Password
    resetOTPHash: { type: String, default: null },
    resetTokenHash: { type: String, default: null },
    resetExpires: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
