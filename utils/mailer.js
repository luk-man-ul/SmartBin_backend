const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTP = async (email, otp) => {
  try {
    await resend.emails.send({
      from: "SmartBin <onboarding@resend.dev>",
      to: email,
      subject: "Your Login OTP",
      html: `
        <h2>Your OTP Code</h2>
        <p style="font-size:20px; font-weight:bold;">${otp}</p>
        <p>This OTP will expire in 2 minutes.</p>
      `,
    });

    return true;
  } catch (error) {
    console.error("Email Error:", error);
    return false;
  }
};

module.exports = { sendOTP };
