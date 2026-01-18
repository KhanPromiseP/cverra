// import { Injectable, Logger } from "@nestjs/common";
// import { ConfigService } from "@nestjs/config";
// import { ISendMailOptions, MailerService } from "@nestjs-modules/mailer";

// import { Config } from "@/server/config/schema";

// @Injectable()
// export class MailService {
//   constructor(
//     private readonly configService: ConfigService<Config>,
//     private readonly mailerService: MailerService,
//   ) {}

//   async sendEmail(options: ISendMailOptions) {
//     const smtpUrl = this.configService.get("SMTP_URL");

//     // If `SMTP_URL` is not set, log the email to the console
//     if (!smtpUrl) {
//       Logger.log(options, "MailService#sendEmail");
//       return;
//     }

//     return this.mailerService.sendMail(options);
//   }
// }

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ISendMailOptions, MailerService } from "@nestjs-modules/mailer";

import { Config } from "@/server/config/schema";
import { MailTemplatesService } from "./mail-templates.service";

@Injectable()
export class MailService {
  constructor(
    private readonly configService: ConfigService<Config>,
    private readonly mailerService: MailerService,
    private readonly mailTemplatesService: MailTemplatesService,
  ) {}

  async sendVerificationEmail(email: string, name: string, token: string) {
    const emailContent = await this.mailTemplatesService.sendVerificationEmail(email, name, token);
    
    await this.sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });
  }

  async sendPasswordResetEmail(email: string, name: string, token: string) {
    const emailContent = await this.mailTemplatesService.sendPasswordResetEmail(email, name, token);
    
    await this.sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });
  }

  async sendEmail(options: ISendMailOptions) {
    const smtpUrl = this.configService.get("SMTP_URL") as string;
    const mailFrom = this.configService.get("MAIL_FROM") as string;

    // If `SMTP_URL` is not set, log the email to the console
    if (!smtpUrl) {
      Logger.log(`📧 Email would be sent (SMTP_URL not set):
          From: ${mailFrom || 'Not set'}
          To: ${options.to}
          Subject: ${options.subject}
          HTML Preview: ${options.html ? 'Yes' : 'No'}
          Text Preview: ${options.text ? 'Yes' : 'No'}
      `, "MailService#sendEmail");
      
      // Also log the actual content for debugging
      if (options.text) {
        Logger.log(`Email Text Content:\n${options.text}`, "MailService#sendEmail");
      }
      
      // Return a mock response for development
      return {
        messageId: `mock-${Date.now()}@development.local`,
        response: "Email logged to console (SMTP_URL not configured)",
      };
    }

    // Ensure from address is set
    const emailOptions: ISendMailOptions = {
      from: mailFrom,
      ...options,
    };

    try {
      return await this.mailerService.sendMail(emailOptions);
    } catch (error) {
      Logger.error(`Failed to send email: ${error.message}`, error.stack, "MailService#sendEmail");
      throw error;
    }
  }
}