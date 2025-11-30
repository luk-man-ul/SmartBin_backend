const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendOTP = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Login OTP",
      html: `
        <h2>Your OTP Code</h2>
        <p style="font-size:20px; font-weight:bold;">${otp}</p>
        <p>This OTP will expire in 2 minutes.</p>
      `
    });
    return true;
  } catch (error) {
    console.log("Email Error:", error);
    return false;
  }
};

module.exports = { sendOTP };
