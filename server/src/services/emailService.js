const sgMail = require("@sendgrid/mail");

// Configure SendGrid with API key
const sendGridApiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER;
const fromName = process.env.SENDGRID_FROM_NAME || "NeuroAssess Support";

if (!sendGridApiKey) {
  console.error("❌ SENDGRID_API_KEY is not set in environment variables!");
  console.error("   Email service will not work. Please add SENDGRID_API_KEY to your .env file");
} else {
  sgMail.setApiKey(sendGridApiKey);
  console.log("✅ SendGrid API configured successfully");
}

console.log("📧 Email Service Configuration:");
console.log(`   Provider: SendGrid`);
console.log(`   From Email: ${fromEmail}`);
console.log(`   From Name: ${fromName}`);
console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);

// Helper function to send email with retry logic
const sendEmailWithRetry = async (mailOptions, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 [Attempt ${attempt}/${maxRetries}] Sending email to: ${mailOptions.to}`);

      // Send email using SendGrid
      const response = await sgMail.send(mailOptions);

      console.log(`✅ Email sent successfully to ${mailOptions.to}`);
      console.log(`   Status Code: ${response[0].statusCode}`);
      console.log(`   Message ID: ${response[0].headers['x-message-id']}`);

      return {
        success: true,
        messageId: response[0].headers['x-message-id'],
        statusCode: response[0].statusCode,
      };
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);

      // Log SendGrid-specific error details
      if (error.response) {
        console.error(`   Status Code: ${error.response.statusCode}`);
        console.error(`   Error Body:`, error.response.body);
      }

      // If this isn't the last attempt, wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 seconds
        console.log(`⏳ Retrying in ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  // All retries failed
  console.error(`❌ All ${maxRetries} email send attempts failed`);
  throw lastError;
};

// Send OTP email
exports.sendOTPEmail = async (
  email,
  otp,
  subject = "Verify Your Email - NeuroAssess"
) => {
  try {
    console.log(`📧 Preparing OTP email for: ${email}`);

    const mailOptions = {
      to: email,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to NeuroAssess!</h2>
          <p>Thank you for registering. To complete your registration, please use the following verification code:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this verification code, please ignore this email.</p>
          <p>Best regards,<br>The NeuroAssess Team</p>
        </div>
      `,
      text: `Welcome to NeuroAssess! Your verification code is: ${otp}. This code will expire in 10 minutes.`,
    };

    const result = await sendEmailWithRetry(mailOptions);
    return result;
  } catch (error) {
    console.error("❌ Send OTP email error:", error);
    return { success: false, error };
  }
};

// Send Reset Password email
exports.sendResetPasswordEmail = async (email, resetUrl) => {
  try {
    console.log(`📧 Preparing password reset email for: ${email}`);

    const mailOptions = {
      to: email,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: "Reset Your Password - NeuroAssess",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested a password reset for your NeuroAssess account. Please click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Reset Password</a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>Best regards,<br>The NeuroAssess Team</p>
        </div>
      `,
      text: `You requested a password reset. Click this link to reset your password: ${resetUrl}. This link will expire in 1 hour.`,
    };

    const result = await sendEmailWithRetry(mailOptions);
    return result;
  } catch (error) {
    console.error("❌ Send reset password email error:", error);
    return { success: false, error };
  }
};

// Send psychiatrist approval email
exports.sendApprovalEmail = async (email, name) => {
  try {
    console.log(`📧 Preparing approval email for: ${email}`);

    const mailOptions = {
      to: email,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: "Your Psychiatrist Account Has Been Approved - NeuroAssess",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Account Approved!</h2>
          <p>Congratulations, ${name}! Your psychiatrist account on NeuroAssess has been approved.</p>
          <p>You can now log in and start using all the features available to psychiatrists on our platform.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/login" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Log In Now</a>
          </div>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>The NeuroAssess Team</p>
        </div>
      `,
      text: `Congratulations, ${name}! Your psychiatrist account has been approved. Log in at ${process.env.FRONTEND_URL}/login`,
    };

    const result = await sendEmailWithRetry(mailOptions);
    return result;
  } catch (error) {
    console.error("❌ Send approval email error:", error);
    return { success: false, error };
  }
};

// Send psychiatrist rejection email
exports.sendRejectionEmail = async (email, name, reason) => {
  try {
    console.log(`📧 Preparing rejection email for: ${email}`);

    const mailOptions = {
      to: email,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: "Update on Your Psychiatrist Application - NeuroAssess",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Application Update</h2>
          <p>Dear ${name},</p>
          <p>Thank you for your interest in becoming a psychiatrist on the NeuroAssess platform.</p>
          <p>After careful review of your application, we regret to inform you that we are unable to approve your psychiatrist account at this time.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          <p>You may still use our platform as a patient, or you can submit a new psychiatrist application with updated information in the future.</p>
          <p>If you have any questions or would like further clarification, please contact our support team.</p>
          <p>Best regards,<br>The NeuroAssess Team</p>
        </div>
      `,
      text: `Dear ${name}, Thank you for your interest. We are unable to approve your psychiatrist account at this time. ${reason ? `Reason: ${reason}` : ""
        }`,
    };

    const result = await sendEmailWithRetry(mailOptions);
    return result;
  } catch (error) {
    console.error("❌ Send rejection email error:", error);
    return { success: false, error };
  }
};

// Test SendGrid connection on startup
(async () => {
  if (!sendGridApiKey) {
    console.error("⚠️  Skipping SendGrid connection test - API key not configured");
    return;
  }

  try {
    console.log("🔍 Testing SendGrid API connection...");
    // SendGrid doesn't have a verify method, but we can check if the API key is set
    console.log("✅ SendGrid is ready to send emails");
    console.log("   Note: Actual delivery will be tested when sending emails");
  } catch (error) {
    console.error("❌ SendGrid configuration error:", error.message);
    console.error("   Email service may not work properly. Please check your SENDGRID_API_KEY");
  }
})();
