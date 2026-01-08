const nodemailer = require("nodemailer");

// Log SMTP configuration for debugging
const emailHost = process.env.EMAIL_HOST;
const emailPort = parseInt(process.env.EMAIL_PORT || "587");
const emailUser = process.env.EMAIL_USER;
const isSecure = process.env.EMAIL_PORT === "465";
const isProduction = process.env.NODE_ENV === "production";

console.log("📧 SMTP Configuration:");
console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
console.log(`   Host: ${emailHost}`);
console.log(`   Port: ${emailPort}`);
console.log(`   Secure: ${isSecure}`);
console.log(`   User: ${emailUser}`);
console.log(`   Pooling: ${!isProduction ? "enabled" : "disabled (serverless)"}`);

// Create transporter factory function for serverless compatibility
const createTransporter = () => {
  return nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: isSecure, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: process.env.EMAIL_PASS,
    },
    pool: !isProduction, // Disable pooling in production/serverless
    maxConnections: isProduction ? 1 : 5,
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000, // 30 seconds
    socketTimeout: 60000, // 60 seconds
    logger: true, // Enable logging for debugging
    debug: process.env.EMAIL_DEBUG === "true", // Show SMTP traffic only if needed
    tls: {
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
    },
    requireTLS: emailPort === 587,
  });
};

// Helper function to send email with retry logic and explicit Promise wrapping
const sendEmailWithRetry = async (mailOptions, maxRetries = 3) => {
  return new Promise(async (resolve, reject) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 [Attempt ${attempt}/${maxRetries}] Sending email to: ${mailOptions.to}`);

        // Create a fresh transporter for each send (serverless best practice)
        const transporter = createTransporter();

        // Wrap sendMail in explicit Promise
        const info = await new Promise((resolveEmail, rejectEmail) => {
          transporter.sendMail(mailOptions, (error, info) => {
            // Close transporter connection immediately after send
            transporter.close();

            if (error) {
              console.error(`❌ Email send error (attempt ${attempt}):`, error.message);
              rejectEmail(error);
            } else {
              console.log(`✅ Email sent successfully to ${mailOptions.to}`);
              console.log(`   Message ID: ${info.messageId}`);
              resolveEmail(info);
            }
          });
        });

        // Success - return immediately
        return resolve({ success: true, messageId: info.messageId });

      } catch (error) {
        lastError = error;
        console.error(`❌ Attempt ${attempt} failed:`, error.message);

        // If this isn't the last attempt, wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 seconds
          console.log(`⏳ Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // All retries failed
    console.error(`❌ All ${maxRetries} email send attempts failed`);
    reject(lastError);
  });
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
      from: `"NeuroAssess Support" <${process.env.EMAIL_USER}>`,
      to: email,
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
    };

    // Use retry wrapper with explicit Promise handling
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
      from: `"NeuroAssess Support" <${process.env.EMAIL_USER}>`,
      to: email,
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
      from: `"NeuroAssess Support" <${process.env.EMAIL_USER}>`,
      to: email,
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
      from: `"NeuroAssess Support" <${process.env.EMAIL_USER}>`,
      to: email,
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
    };

    const result = await sendEmailWithRetry(mailOptions);
    return result;
  } catch (error) {
    console.error("❌ Send rejection email error:", error);
    return { success: false, error };
  }
};

// Verify SMTP connection on startup (async version for serverless)
(async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("✅ SMTP server is ready to send emails");
    transporter.close();
  } catch (error) {
    console.error("❌ SMTP connection error:", error.message);
    console.error("   Email service may not work properly. Please check your SMTP configuration.");
  }
})();
