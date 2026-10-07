import express from "express";
import nodemailer from "nodemailer";
import serverless from "serverless-http";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json({ limit: "10mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);

app.use(cors({ origin: "*" }));

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("SMTP connection failed:", error);
  } else {
    console.log("SMTP server is ready");
  }
});

const verifyRequest = (req, res, next) => {
  const secret = req.headers["x-email-service-secret"];

  if (!secret || secret !== process.env.EMAIL_SERVICE_SECRET) {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized",
    });
  }

  next();
};

router.get("/health", (_req, res) => {
  return res.status(200).json({
    status: "success",
    message: "Chatz email service is running",
  });
});

router.post("/send-verification", verifyRequest, async (req, res) => {
  try {
    const { email, name, token } = req.body;

    //  console.log("Incoming email request:", {
    //   email,
    //   name,
    //   hasToken: !!token,
    // });

    if (!email || !token) {
      return res.status(400).json({
        status: "error",
        message: "Email and token are required",
      });
    }

    const signupUrl = `${process.env.FRONTEND_URL}/complete-signup?token=${encodeURIComponent(token)}`;

    const info = await transporter.sendMail({
      from: `"Chatz" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Complete your Chatz signup",
      text: `Hi ${name ?? ""}, complete your Chatz signup by visiting: ${signupUrl}`,
      html: `
  <div
    style="
      font-family: Arial, sans-serif;
      background: #f5f5f5;
      padding: 40px 20px;
    "
  >
    <div
      style="
        max-width: 600px;
        margin: 0 auto;
        background: #ffffff;
        padding: 40px;
        border-radius: 12px;
      "
    >

      <!-- Chatz Logo -->
      <div
        style="
          text-align: center;
          margin-bottom: 30px;
        "
      >
        <img
          src=${process.env.LOGO_URL}
          alt="Chatz"
          width="64"
          height="64"
          style="
            display: block;
            margin: 0 auto;
            border-radius: 12px;
          "
        />
      </div>

      <h1
        style="
          margin: 0 0 20px;
          color: #111111;
          font-size: 28px;
        "
      >
        Welcome to Chatz, ${name ?? ""}!
      </h1>

      <p
        style="
          color: #555555;
          font-size: 16px;
          line-height: 1.6;
        "
      >
        Thanks for signing up for Chatz.
      </p>

      <p
        style="
          color: #555555;
          font-size: 16px;
          line-height: 1.6;
        "
      >
        You're almost there. Click the button below to confirm your
        email address and continue creating your Chatz account.
      </p>

      

      <div style="margin: 30px 0;">
        <a
          href="${signupUrl}"
          style="
            display: inline-block;
            padding: 14px 24px;
            background: #000000;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
          "
        >
          Complete Your Signup
        </a>
      </div>


      <p
  style="
    color: #777777;
    font-size: 14px;
    line-height: 1.6;
    background: #f8f8f8;
    padding: 12px 16px;
    border-radius: 8px;
    margin: 20px 0;
  "
>
  <strong style="color: #555555;">
    Can't find the email?
  </strong>
  Please check your Spam or Junk folder. If you find it there,
  mark it as "Not spam" so you don't miss future Chatz emails.
</p>

      <p
        style="
          color: #777777;
          font-size: 14px;
          line-height: 1.6;
        "
      >
        This link will expire in 30 minutes.
      </p>

      <p
        style="
          color: #777777;
          font-size: 14px;
          line-height: 1.6;
        "
      >
        If you didn't try to create a Chatz account, you can safely
        ignore this email.
      </p>

      <hr
        style="
          border: none;
          border-top: 1px solid #eeeeee;
          margin: 30px 0;
        "
      />

      <p
        style="
          color: #999999;
          font-size: 12px;
          text-align: center;
        "
      >
        © ${new Date().getFullYear()} Chatz. All rights reserved.
      </p>

    </div>
  </div>
`,
    });

    //  console.log("Email delivery result:", {
    //   messageId: info.messageId,
    //   accepted: info.accepted,
    //   rejected: info.rejected,
    //   response: info.response,
    // });

    return res.status(200).json({
      status: "success",
      message: "Signup email sent",
    });
  } catch (error) {
    console.error("Signup email error:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to send signup email",
    });
  }
});

router.post("/send-password-reset", verifyRequest, async (req, res) => {
  try {
    const { email, name, token } = req.body;
    // console.log(req.body)

    if (!email || !token) {
      return res.status(400).json({
        status: "error",
        message: "Email and token are required",
      });
    }

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;

    await transporter.sendMail({
      from: `"Chatz" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Reset your Chatz password",
      text: `Reset your Chatz password by visiting: ${resetUrl}`,
      html: `
  <div
    style="
      font-family: Arial, sans-serif;
      background: #f5f5f5;
      padding: 40px 20px;
    "
  >
    <div
      style="
        max-width: 600px;
        margin: 0 auto;
        background: #ffffff;
        padding: 40px;
        border-radius: 12px;
      "
    >

      <!-- Chatz Logo -->
      <div
        style="
          text-align: center;
          margin-bottom: 30px;
        "
      >
        <img
          src=${process.env.LOGO_URL}
          alt="Chatz"
          width="64"
          height="64"
          style="
            display: block;
            margin: 0 auto;
            border-radius: 12px;
          "
        />
      </div>

      <h1
        style="
          margin: 0 0 20px;
          color: #111111;
          font-size: 28px;
        "
      >
        Password Reset
      </h1>

      <p
        style="
          color: #555555;
          font-size: 16px;
          line-height: 1.6;
        "
      >
        Hi ${name ?? "there"},
      </p>

      <p
        style="
          color: #555555;
          font-size: 16px;
          line-height: 1.6;
        "
      >
        We received a request to reset your Chatz password.
      </p>

      <p
        style="
          color: #555555;
          font-size: 16px;
          line-height: 1.6;
        "
      >
        Click the button below to create a new password.
      </p>

      <p
  style="
    color: #777777;
    font-size: 14px;
    line-height: 1.6;
    background: #f8f8f8;
    padding: 12px 16px;
    border-radius: 8px;
    margin: 20px 0;
  "
>
  <strong style="color: #555555;">
    Can't find the email?
  </strong>
  Please check your Spam or Junk folder. If you find it there,
  mark it as "Not spam" so you don't miss future Chatz emails.
</p>

      <div style="margin: 30px 0;">
        <a
          href="${resetUrl}"
          style="
            display: inline-block;
            padding: 14px 24px;
            background: #000000;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
          "
        >
          Reset Password
        </a>
      </div>

      <p
        style="
          color: #777777;
          font-size: 14px;
          line-height: 1.6;
        "
      >
        If you didn't request a password reset, you can safely ignore
        this email.
      </p>

      <hr
        style="
          border: none;
          border-top: 1px solid #eeeeee;
          margin: 30px 0;
        "
      />

      <p
        style="
          color: #999999;
          font-size: 12px;
          text-align: center;
        "
      >
        © ${new Date().getFullYear()} Chatz. All rights reserved.
      </p>

    </div>
  </div>
`,
    });

    // console.log("sent password reset email to:", email);
    return res.status(200).json({
      status: "success",
      message: "Password reset email sent",
    });
  } catch (error) {
    console.error("Password reset email error:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to send password reset email",
    });
  }
});

// IMPORTANT
app.use("/.netlify/functions/api", router);

export const handler = serverless(app);
