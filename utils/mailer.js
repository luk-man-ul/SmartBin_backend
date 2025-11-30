const SibApiV3Sdk = require("sib-api-v3-sdk");

// Create Brevo API instance
const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const transEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

async function sendMail(to, otp) {
  try {
    //console.log("Sending OTP to:", to);

    const mailPayload = {
      sender: { email: "noreply.mailgateway@gmail.com", name: "SmartBin" },
      to: [{ email: to }],
      subject: "Your OTP Code",
      htmlContent: `
        <h2>Your OTP Code</h2>
        <h1 style="color:blue;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
      `,
    };

    await transEmailApi.sendTransacEmail(mailPayload);

    //console.log("OTP SENT SUCCESSFULLY!");
    return true;

  } catch (error) {
    console.error("BREVO ERROR:", error.response?.text || error.message || error);
    return false;
  }
}

module.exports = sendMail;
