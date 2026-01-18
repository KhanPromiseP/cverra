import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { Config } from "@/server/config/schema";

@Injectable()
export class MailTemplatesService {
  private readonly appUrl: string;
  private readonly appName: string;
  private readonly supportEmail: string;

  constructor(
    private readonly configService: ConfigService<Config>,
  ) {
    this.appUrl = (this.configService.get("APP_URL") as string) || "http://localhost:3000";
    this.appName = (this.configService.get("APP_NAME") as string) || "Cverra";
    this.supportEmail = (this.configService.get("SUPPORT_EMAIL") as string) || "support@cverra.com";
    
    Logger.log(`MailTemplatesService initialized with APP_URL: ${this.appUrl}`, 'MailTemplatesService');
  }

  async sendVerificationEmail(email: string, name: string, token: string) {
    const verificationLink = `${this.appUrl}/auth/verify-email?token=${token}`;
    const currentYear = new Date().getFullYear();
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - ${this.appName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
        }
        .container {
            background: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .header {
            text-align: center;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 1px solid #e5e7eb;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 12px;
            letter-spacing: -0.025em;
        }
        .title {
            font-size: 24px;
            font-weight: 600;
            color: #111827;
            margin: 16px 0 8px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 24px;
        }
        .content {
            margin: 32px 0;
        }
        .button-container {
            text-align: center;
            margin: 32px 0;
        }
        .button {
            display: inline-block;
            background: #2563eb;
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: background-color 0.2s;
        }
        .button:hover {
            background: #1d4ed8;
        }
        .link-container {
            background: #f3f4f6;
            padding: 16px;
            border-radius: 6px;
            margin: 24px 0;
            word-break: break-all;
        }
        .link-text {
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 14px;
            color: #374151;
        }
        .note {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 24px 0;
            border-radius: 4px;
        }
        .note-title {
            font-weight: 600;
            color: #92400e;
            margin-bottom: 4px;
        }
        .note-text {
            color: #92400e;
            font-size: 14px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .footer-links {
            margin: 16px 0;
        }
        .footer-link {
            color: #2563eb;
            text-decoration: none;
            margin: 0 8px;
        }
        .footer-link:hover {
            text-decoration: underline;
        }
        .signature {
            margin-top: 24px;
            font-style: italic;
        }
        @media (max-width: 640px) {
            .container {
                padding: 24px;
                border-radius: 8px;
            }
            .button {
                padding: 14px 28px;
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">${this.appName}</div>
            <h1 class="title">Verify Your Email Address</h1>
            <p class="subtitle">One last step to complete your registration</p>
        </div>
        
        <p class="greeting">Hello <strong>${name}</strong>,</p>
        
        <div class="content">
            <p>Thank you for creating an account with ${this.appName}! To get started, please verify your email address by clicking the button below:</p>
            
            <div class="button-container">
                <a href="${verificationLink}" class="button">Verify Email Address</a>
            </div>
            
            <div class="note">
                <div class="note-title">Important</div>
                <div class="note-text">This verification link will expire in 24 hours. If you didn't request this email, you can safely ignore it.</div>
            </div>
            
            <p>If the button above doesn't work, copy and paste this link into your browser:</p>
            
            <div class="link-container">
                <code class="link-text">${verificationLink}</code>
            </div>
            
            <p>Having trouble? Make sure you're using a modern web browser and that your internet connection is stable.</p>
        </div>
        
        <div class="footer">
            <div class="footer-links">
                <a href="${this.appUrl}" class="footer-link">Visit Website</a>
                <a href="${this.appUrl}/support" class="footer-link">Get Help</a>
                <a href="mailto:${this.supportEmail}" class="footer-link">Contact Support</a>
            </div>
            
            <p>This email was sent to ${email} because you registered an account on ${this.appName}.</p>
            
            <p class="signature">Best regards,<br>The ${this.appName} Team</p>
            
            <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
                © ${currentYear} ${this.appName}. All rights reserved.<br>
                <small>If you didn't sign up for ${this.appName}, please ignore this email.</small>
            </p>
        </div>
    </div>
</body>
</html>
    `;

    const text = `
Verify Your Email Address - ${this.appName}
===========================================

Hello ${name},

Thank you for creating an account with ${this.appName}! To get started, please verify your email address by clicking the link below:

${verificationLink}

Important:
----------
• This verification link will expire in 24 hours.
• If you didn't request this email, you can safely ignore it.

If the link above doesn't work, copy and paste it directly into your browser.

Having trouble? Make sure you're using a modern web browser and that your internet connection is stable.

---
This email was sent to ${email} because you registered an account on ${this.appName}.

Best regards,
The ${this.appName} Team

© ${currentYear} ${this.appName}. All rights reserved.
If you didn't sign up for ${this.appName}, please ignore this email.
    `;

    return { html, text, subject: `Verify Your Email Address - ${this.appName}` };
  }

  async sendPasswordResetEmail(email: string, name: string, token: string) {
    const resetLink = `${this.appUrl}/auth/reset-password?token=${token}`;
    const currentYear = new Date().getFullYear();
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - ${this.appName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
        }
        .container {
            background: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .header {
            text-align: center;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 1px solid #e5e7eb;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #dc2626;
            margin-bottom: 12px;
            letter-spacing: -0.025em;
        }
        .title {
            font-size: 24px;
            font-weight: 600;
            color: #111827;
            margin: 16px 0 8px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 24px;
        }
        .content {
            margin: 32px 0;
        }
        .button-container {
            text-align: center;
            margin: 32px 0;
        }
        .button {
            display: inline-block;
            background: #dc2626;
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: background-color 0.2s;
        }
        .button:hover {
            background: #b91c1c;
        }
        .link-container {
            background: #fef2f2;
            padding: 16px;
            border-radius: 6px;
            margin: 24px 0;
            word-break: break-all;
        }
        .link-text {
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 14px;
            color: #7f1d1d;
        }
        .note {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 24px 0;
            border-radius: 4px;
        }
        .note-title {
            font-weight: 600;
            color: #92400e;
            margin-bottom: 4px;
        }
        .note-text {
            color: #92400e;
            font-size: 14px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .footer-links {
            margin: 16px 0;
        }
        .footer-link {
            color: #2563eb;
            text-decoration: none;
            margin: 0 8px;
        }
        .footer-link:hover {
            text-decoration: underline;
        }
        .signature {
            margin-top: 24px;
            font-style: italic;
        }
        @media (max-width: 640px) {
            .container {
                padding: 24px;
                border-radius: 8px;
            }
            .button {
                padding: 14px 28px;
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">${this.appName}</div>
            <h1 class="title">Reset Your Password</h1>
            <p class="subtitle">Follow this link to set a new password</p>
        </div>
        
        <p class="greeting">Hello <strong>${name}</strong>,</p>
        
        <div class="content">
            <p>We received a request to reset your password for your ${this.appName} account. Click the button below to set a new password:</p>
            
            <div class="button-container">
                <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            
            <div class="note">
                <div class="note-title">Important</div>
                <div class="note-text">This password reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email and your password will remain unchanged.</div>
            </div>
            
            <p>If the button above doesn't work, copy and paste this link into your browser:</p>
            
            <div class="link-container">
                <code class="link-text">${resetLink}</code>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-links">
                <a href="${this.appUrl}" class="footer-link">Visit Website</a>
                <a href="${this.appUrl}/support" class="footer-link">Get Help</a>
                <a href="mailto:${this.supportEmail}" class="footer-link">Contact Support</a>
            </div>
            
            <p>This email was sent to ${email} because a password reset was requested for your ${this.appName} account.</p>
            
            <p class="signature">Best regards,<br>The ${this.appName} Team</p>
            
            <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
                © ${currentYear} ${this.appName}. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
    `;

    const text = `
Reset Your Password - ${this.appName}
=====================================

Hello ${name},

We received a request to reset your password for your ${this.appName} account. Click the link below to set a new password:

${resetLink}

Important:
----------
• This password reset link will expire in 1 hour.
• If you didn't request a password reset, you can safely ignore this email.

If the link above doesn't work, copy and paste it directly into your browser.

---
This email was sent to ${email} because a password reset was requested for your ${this.appName} account.

Best regards,
The ${this.appName} Team

© ${currentYear} ${this.appName}. All rights reserved.
    `;

    return { html, text, subject: `Reset Your Password - ${this.appName}` };
  }
}