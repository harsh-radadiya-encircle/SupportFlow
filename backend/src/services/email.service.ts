import nodemailer from 'nodemailer';
import { env } from '../config/env';

export interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
}

export class EmailService {
  /**
   * Create Nodemailer SMTP Transporter dynamically on every dispatch
   */
  private static getTransporter() {
    const host = (process.env.SMTP_HOST || env.SMTP.HOST || 'smtp.gmail.com').trim();
    const port = parseInt(process.env.SMTP_PORT || String(env.SMTP.PORT || '587'), 10);
    const user = (process.env.SMTP_USER || env.SMTP.USER || '').trim();
    const pass = (process.env.SMTP_PASS || env.SMTP.PASS || '').trim();

    if (!user || !pass) {
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for port 465, false for 587
      auth: {
        user,
        pass,
      },
    });
  }

  /**
   * Send a transactional email using Nodemailer SMTP
   */
  static async sendEmail({ to, toName, subject, htmlContent }: SendEmailOptions): Promise<boolean> {
    const transporter = this.getTransporter();

    const fromEmail = (process.env.SMTP_FROM_EMAIL || env.SMTP.FROM_EMAIL || process.env.SMTP_USER || 'noreply@supportflow.com').trim();
    const fromName = (process.env.SMTP_FROM_NAME || env.SMTP.FROM_NAME || 'SupportFlow Team').trim();

    if (!transporter) {
      console.log('\n=================== 📧 DEV EMAIL NOTICE 📧 ===================');
      console.log(`[To]: ${to}`);
      console.log(`[Subject]: ${subject}`);
      console.log('[Notice]: SMTP_USER or SMTP_PASS is missing in backend/.env.');
      console.log('Action: Configure SMTP_USER and SMTP_PASS in .env to dispatch real SMTP emails.');
      console.log('===============================================================\n');
      return true;
    }

    try {
      console.log(`[Nodemailer SMTP] Sending email to ${to} via SMTP server...`);
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: toName ? `"${toName}" <${to}>` : to,
        subject,
        html: htmlContent,
      });

      console.log(`[Nodemailer SMTP] Email successfully delivered to ${to}. Message ID: ${info.messageId}`);
      return true;
    } catch (error: any) {
      console.error('[Nodemailer SMTP Error]: Failed to send email via SMTP:', error.message);
      throw new Error(`SMTP email delivery failed: ${error.message}`);
    }
  }

  /**
   * Send Password Reset Email via Nodemailer SMTP
   */
  static async sendPasswordResetEmail(email: string, userName: string, resetUrl: string): Promise<boolean> {
    console.log(`\n🔑 [PASSWORD RESET LINK]: ${resetUrl}\n`);
    const subject = '🔒 Reset Your SupportFlow Password';
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; line-height: 1.6; }
    .container { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 36px 32px; text-align: center; color: #ffffff; }
    .header-title { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
    .header-sub { margin: 6px 0 0; opacity: 0.9; font-size: 14px; font-weight: 500; }
    .content { padding: 40px 36px; color: #334155; }
    .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
    .text { font-size: 15px; color: #475569; margin-bottom: 24px; }
    .btn-wrapper { text-align: center; margin: 36px 0; }
    .btn { background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 15px 36px; border-radius: 12px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35); }
    .url-box { background: #f1f5f9; padding: 12px 16px; border-radius: 8px; font-size: 12px; color: #475569; word-break: break-all; margin-top: 12px; border: 1px solid #e2e8f0; }
    .security-note { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 18px; border-radius: 8px; font-size: 13px; color: #1e40af; margin-top: 28px; }
    .footer { background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="header-title">SupportFlow</h1>
      <div class="header-sub">Account Security & Authentication</div>
    </div>
    <div class="content">
      <div class="greeting">Hello, ${userName}! 👋</div>
      <div class="text">
        We received a request to reset the password for your SupportFlow account. Click the button below to choose a new password:
      </div>
      <div class="btn-wrapper">
        <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
      </div>
      <div class="text" style="font-size: 13px; margin-bottom: 6px;">
        Or copy and paste this link into your browser:
      </div>
      <div class="url-box">${resetUrl}</div>
      <div class="security-note">
        <strong>⏰ Security Notice:</strong> This password reset link is valid for <strong>15 minutes</strong>. If you did not request this change, you can safely ignore this email.
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} SupportFlow Inc. All rights reserved.<br>
      Automated Security Notification &bull; Do not reply to this email
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({ to: email, toName: userName, subject, htmlContent });
  }

  /**
   * Send Support Agent Invitation Email via Nodemailer SMTP
   */
  static async sendAgentInvitationEmail(
    email: string,
    inviterName: string,
    businessName: string,
    inviteUrl: string
  ): Promise<boolean> {
    console.log(`\n📩 [AGENT INVITATION LINK]: ${inviteUrl}\n`);
    const subject = `📩 Join ${businessName} on SupportFlow`;
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Team Invitation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; line-height: 1.6; }
    .container { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 36px 32px; text-align: center; color: #ffffff; }
    .header-title { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
    .header-sub { margin: 6px 0 0; opacity: 0.9; font-size: 14px; font-weight: 500; }
    .content { padding: 40px 36px; color: #334155; }
    .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
    .text { font-size: 15px; color: #475569; margin-bottom: 24px; }
    .btn-wrapper { text-align: center; margin: 36px 0; }
    .btn { background: #059669; color: #ffffff !important; text-decoration: none; padding: 15px 36px; border-radius: 12px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35); }
    .url-box { background: #f1f5f9; padding: 12px 16px; border-radius: 8px; font-size: 12px; color: #475569; word-break: break-all; margin-top: 12px; border: 1px solid #e2e8f0; }
    .footer { background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="header-title">SupportFlow</h1>
      <div class="header-sub">Team Invitation</div>
    </div>
    <div class="content">
      <div class="greeting">You've Been Invited! 🎉</div>
      <div class="text">
        <strong>${inviterName}</strong> has invited you to join <strong>${businessName}</strong> as a Support Agent on SupportFlow.
      </div>
      <div class="btn-wrapper">
        <a href="${inviteUrl}" class="btn" target="_blank">Accept Team Invitation</a>
      </div>
      <div class="text" style="font-size: 13px; margin-bottom: 6px;">
        Or copy and paste this invitation link into your browser:
      </div>
      <div class="url-box">${inviteUrl}</div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} SupportFlow Inc. All rights reserved.<br>
      Automated Team Invitation Notification &bull; Do not reply to this email
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({ to: email, subject, htmlContent });
  }
}
