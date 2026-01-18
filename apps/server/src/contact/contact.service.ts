// contact/contact.service.ts
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../tools/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { Config } from '@/server/config/schema';
import { ContactSubject } from '@prisma/client';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  private readonly appName: string;
  private readonly supportEmail: string;
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService<Config>,
  ) {
    this.appName = this.configService.get('APP_NAME') || 'Inlirah';
    this.supportEmail = this.configService.get('SUPPORT_EMAIL') || 'support@inlirah.com';
    this.appUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
  }

  async createContact(
    createContactDto: CreateContactDto,
    ipAddress?: string,
    userAgent?: string,
    userId?: string,
  ) {
    try {
      // Rate limiting: 5 requests per hour per email
      const lastHour = new Date(Date.now() - 60 * 60 * 1000);
      
      // Check if contact table exists
      const recentCount = await this.prisma.contact.count({
        where: {
          email: createContactDto.email,
          createdAt: { gte: lastHour },
        },
      });

      if (recentCount >= 5) {
        throw new HttpException(
          'Too many requests. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Validate subject is valid enum value
      const validSubjects = ['SUPPORT', 'BILLING', 'FEEDBACK', 'BUSINESS', 'OTHER'];
      const subject = createContactDto.subject.toUpperCase();
      if (!validSubjects.includes(subject)) {
        throw new HttpException(
          'Invalid subject value',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Create contact record
      const contact = await this.prisma.contact.create({
        data: {
          name: createContactDto.name,
          email: createContactDto.email,
          subject: subject as ContactSubject,
          message: createContactDto.message,
          userId,
          ipAddress,
          userAgent,
          metadata: {
            source: createContactDto.source || 'contact-page',
            sourceUrl: createContactDto.sourceUrl,
            timestamp: new Date().toISOString(),
          },
        },
      });

      // Send notifications
      await this.sendNotifications(contact);

      return {
        success: true,
        message: 'Message sent successfully',
        data: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          subject: contact.subject,
          createdAt: contact.createdAt,
        },
      };

    } catch (error) {
      this.logger.error(`Create contact error: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        'Failed to send message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async sendNotifications(contact: any) {
    try {
      // Send to support team
      await this.sendToSupport(contact);
      
      // Send auto-reply to user
      await this.sendAutoReply(contact);
      
    } catch (error) {
      this.logger.warn(`Notifications failed: ${error.message}`);
    }
  }

  private async sendToSupport(contact: any) {
    const subject = `New Contact: ${contact.subject} - ${contact.name}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Contact Form Submission</h2>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
          <p><strong>Name:</strong> ${contact.name}</p>
          <p><strong>Email:</strong> ${contact.email}</p>
          <p><strong>Subject:</strong> ${contact.subject}</p>
          <p><strong>Time:</strong> ${new Date(contact.createdAt).toLocaleString()}</p>
          <p><strong>Message:</strong></p>
          <div style="background: white; padding: 15px; border-radius: 4px;">
            ${contact.message.replace(/\n/g, '<br>')}
          </div>
        </div>
      </div>
    `;

    const text = `
New Contact Form Submission
===========================
Name: ${contact.name}
Email: ${contact.email}
Subject: ${contact.subject}
Time: ${new Date(contact.createdAt).toLocaleString()}

Message:
${contact.message}
    `;

    await this.mailService.sendEmail({
      to: this.supportEmail,
      subject,
      html,
      text,
    });
  }

  private async sendAutoReply(contact: any) {
  const subject = `Thank You for Contacting Inlirah - We've Received Your Message`;
  
  // Social media links (update with your actual URLs)
  const socialLinks = {
    facebook: 'https://facebook.com/inlirah',
    twitter: 'https://twitter.com/inlirah',
    instagram: 'https://instagram.com/inlirah',
    linkedin: 'https://linkedin.com/company/inlirah',
    docs: 'https://docs.inlirah.com',
    helpCenter: 'https://help.inlirah.com'
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You for Contacting Inlirah</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            color: #334155;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            padding: 40px 0;
            text-align: center;
            border-radius: 0 0 20px 20px;
        }
        .logo {
            color: white;
            font-size: 28px;
            font-weight: 700;
            text-decoration: none;
            display: inline-block;
            margin-bottom: 20px;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 24px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            line-height: 1.6;
            color: #475569;
            margin-bottom: 25px;
        }
        .ticket-box {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border: 1px solid #bae6fd;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
        }
        .ticket-title {
            font-size: 18px;
            font-weight: 600;
            color: #0369a1;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .ticket-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .detail-item {
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .detail-label {
            font-weight: 500;
            color: #64748b;
            font-size: 14px;
            margin-bottom: 5px;
        }
        .detail-value {
            font-weight: 600;
            color: #1e293b;
            font-size: 16px;
        }
        .next-steps {
            background-color: #f1f5f9;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
        }
        .next-steps-title {
            font-size: 18px;
            font-weight: 600;
            color: #334155;
            margin-bottom: 15px;
        }
        .steps-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .steps-list li {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e2e8f0;
        }
        .steps-list li:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }
        .step-number {
            width: 28px;
            height: 28px;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 14px;
            flex-shrink: 0;
        }
        .step-text {
            flex: 1;
        }
        .social-section {
            text-align: center;
            padding: 30px 0;
            border-top: 1px solid #e2e8f0;
        }
        .social-title {
            font-size: 16px;
            font-weight: 500;
            color: #64748b;
            margin-bottom: 20px;
        }
        .social-icons {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 25px;
        }
        .social-icon {
            width: 40px;
            height: 40px;
            background-color: #f1f5f9;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748b;
            text-decoration: none;
            transition: all 0.3s ease;
        }
        .social-icon:hover {
            background-color: #3b82f6;
            color: white;
            transform: translateY(-2px);
        }
        .footer {
            background-color: #1e293b;
            color: #cbd5e1;
            padding: 40px 30px;
            border-radius: 20px 20px 0 0;
            text-align: center;
        }
        .footer-links {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 25px;
            margin-bottom: 25px;
        }
        .footer-link {
            color: #94a3b8;
            text-decoration: none;
            font-size: 14px;
            transition: color 0.3s ease;
        }
        .footer-link:hover {
            color: #ffffff;
        }
        .copyright {
            font-size: 14px;
            color: #64748b;
            margin-top: 20px;
        }
        .highlight {
            color: #3b82f6;
            font-weight: 600;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            margin: 20px 0;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
        }
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <a href="${this.appUrl}" class="logo">INLIRAH</a>
            <h1 style="color: white; font-size: 32px; font-weight: 700; margin: 0;">We've Got Your Message!</h1>
        </div>

        <!-- Content -->
        <div class="content">
            <h2 class="greeting">Hello ${contact.name},</h2>
            
            <p class="message">
                Thank you for reaching out to Inlirah! We truly appreciate you taking the time to contact us. 
                Your message has been received and is now in our queue for review.
            </p>

            <!-- Ticket Information -->
            <div class="ticket-box">
                <div class="ticket-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 11.5C21.2812 11.5 21.55 11.609 21.75 11.803C21.94 12.005 22.045 12.274 22.045 12.555C22.045 12.836 21.94 13.105 21.75 13.307L13.5 21.557C13.098 21.959 12.562 22.183 12 22.183C11.438 22.183 10.902 21.959 10.5 21.557L2.25 13.307C2.06 13.105 1.955 12.836 1.955 12.555C1.955 12.274 2.06 12.005 2.25 11.803C2.45 11.609 2.719 11.5 3 11.5H21Z" fill="#0ea5e9"/>
                        <path d="M21 7.5C21.2812 7.5 21.55 7.609 21.75 7.803C21.94 8.005 22.045 8.274 22.045 8.555C22.045 8.836 21.94 9.105 21.75 9.307L13.5 17.557C13.098 17.959 12.562 18.183 12 18.183C11.438 18.183 10.902 17.959 10.5 17.557L2.25 9.307C2.06 9.105 1.955 8.836 1.955 8.555C1.955 8.274 2.06 8.005 2.25 7.803C2.45 7.609 2.719 7.5 3 7.5H21Z" fill="#3b82f6"/>
                        <path d="M21 3.5C21.2812 3.5 21.55 3.609 21.75 3.803C21.94 4.005 22.045 4.274 22.045 4.555C22.045 4.836 21.94 5.105 21.75 5.307L13.5 13.557C13.098 13.959 12.562 14.183 12 14.183C11.438 14.183 10.902 13.959 10.5 13.557L2.25 5.307C2.06 5.105 1.955 4.836 1.955 4.555C1.955 4.274 2.06 4.005 2.25 3.803C2.45 3.609 2.719 3.5 3 3.5H21Z" fill="#8b5cf6"/>
                    </svg>
                    Your Support Ticket Details
                </div>
                <div class="ticket-details">
                    <div class="detail-item">
                        <div class="detail-label">Ticket Reference</div>
                        <div class="detail-value">${contact.id}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Subject</div>
                        <div class="detail-value">${contact.subject}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Submitted On</div>
                        <div class="detail-value">${new Date(contact.createdAt).toLocaleString()}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Status</div>
                        <div class="detail-value"><span style="color: #059669; font-weight: 600;">✓ Received</span></div>
                    </div>
                </div>
            </div>

            <!-- What Happens Next -->
            <div class="next-steps">
                <h3 class="next-steps-title">Here's What Happens Next:</h3>
                <ul class="steps-list">
                    <li>
                        <div class="step-number">1</div>
                        <div class="step-text">
                            <strong>Initial Review:</strong> Our support team will review your inquiry within <span class="highlight">24 hours</span> (during business days).
                        </div>
                    </li>
                    <li>
                        <div class="step-number">2</div>
                        <div class="step-text">
                            <strong>Expert Assistance:</strong> A dedicated specialist will be assigned to provide you with the most accurate and helpful response.
                        </div>
                    </li>
                    <li>
                        <div class="step-number">3</div>
                        <div class="step-text">
                            <strong>Personalized Response:</strong> You'll receive a detailed reply directly to this email address with specific guidance for your situation.
                        </div>
                    </li>
                    <li>
                        <div class="step-number">4</div>
                        <div class="step-text">
                            <strong>Follow-up if Needed:</strong> We'll work with you until your inquiry is fully resolved to your satisfaction.
                        </div>
                    </li>
                </ul>
            </div>

            <!-- Important Notes -->
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 8px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                    <strong>📌 Important:</strong> Please add <span style="font-weight: 600;">support@inlirah.com</span> to your contacts to ensure you receive our response. 
                    Sometimes, our emails can end up in spam or promotions folders.
                </p>
            </div>

            <div class="divider"></div>

            <!-- Self-Help Resources -->
            <div style="text-align: center; margin: 40px 0;">
                <h3 style="font-size: 20px; color: #1e293b; margin-bottom: 20px;">💡 While You Wait...</h3>
                <p style="color: #475569; margin-bottom: 25px; line-height: 1.6;">
                    Many questions can be answered immediately through our comprehensive documentation and resources:
                </p>
                
                <a href="${socialLinks.docs}" class="cta-button">Browse Documentation</a>
                <br>
                <a href="${socialLinks.helpCenter}" class="cta-button" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">Visit Help Center</a>
            </div>
        </div>

        <!-- Social Media Section -->
        <div class="social-section">
            <p class="social-title">Stay Connected With Us</p>
            <div class="social-icons">
                <a href="${socialLinks.facebook}" class="social-icon" target="_blank">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                </a>
                <a href="${socialLinks.twitter}" class="social-icon" target="_blank">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.213c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                </a>
                <a href="${socialLinks.instagram}" class="social-icon" target="_blank">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                </a>
                <a href="${socialLinks.linkedin}" class="social-icon" target="_blank">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                </a>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-links">
                <a href="${this.appUrl}" class="footer-link">Home</a>
                <a href="${this.appUrl}/about" class="footer-link">About</a>
                <a href="${socialLinks.docs}" class="footer-link">Documentation</a>
                <a href="${socialLinks.helpCenter}" class="footer-link">Help Center</a>
                <a href="${this.appUrl}/privacy" class="footer-link">Privacy Policy</a>
                <a href="${this.appUrl}/terms" class="footer-link">Terms of Service</a>
                <a href="${this.appUrl}/contact" class="footer-link">Contact</a>
            </div>
            
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
                Inlirah Technologies • Empowering Career Development Worldwide<br>
                <span style="font-size: 12px; color: #64748b;">This is an automated message. Please do not reply directly to this email.</span>
            </p>
            
            <p class="copyright">
                © ${new Date().getFullYear()} Inlirah. All rights reserved.<br>
                You're receiving this email because you contacted Inlirah support.
            </p>
        </div>
    </div>
</body>
</html>
  `;

  const text = `
THANK YOU FOR CONTACTING INLIRAH
=================================

Hello ${contact.name},

Thank you for reaching out to Inlirah! We truly appreciate you taking the time to contact us. 
Your message has been received and is now in our queue for review.

YOUR SUPPORT TICKET DETAILS:
-----------------------------
Ticket Reference: ${contact.id}
Subject: ${contact.subject}
Submitted On: ${new Date(contact.createdAt).toLocaleString()}
Status: ✓ Received

WHAT HAPPENS NEXT:
------------------
1. Initial Review: Our support team will review your inquiry within 24 hours (during business days).
2. Expert Assistance: A dedicated specialist will be assigned to provide you with the most accurate and helpful response.
3. Personalized Response: You'll receive a detailed reply directly to this email address with specific guidance for your situation.
4. Follow-up if Needed: We'll work with you until your inquiry is fully resolved to your satisfaction.

IMPORTANT NOTE:
---------------
Please add support@inlirah.com to your contacts to ensure you receive our response. 
Sometimes, our emails can end up in spam or promotions folders.

WHILE YOU WAIT:
---------------
Many questions can be answered immediately through our comprehensive documentation and resources:

• Browse Documentation: ${socialLinks.docs}
• Visit Help Center: ${socialLinks.helpCenter}

STAY CONNECTED:
---------------
Follow us for updates, tips, and career development resources:

• Facebook: ${socialLinks.facebook}
• Twitter: ${socialLinks.twitter}
• Instagram: ${socialLinks.instagram}
• LinkedIn: ${socialLinks.linkedin}

NEED IMMEDIATE HELP?
--------------------
Visit our help center for instant answers to common questions: ${socialLinks.helpCenter}

Best regards,

The Inlirah Team
🎯 Empowering Career Development Worldwide

---

© ${new Date().getFullYear()} Inlirah. All rights reserved.
This is an automated message. Please do not reply directly to this email.
You're receiving this email because you contacted Inlirah support.

  `;

  await this.mailService.sendEmail({
    to: contact.email,
    subject,
    html,
    text,
  });
}


// contact/contact.service.ts - Add this property
private readonly socialLinks = {
  facebook: 'https://facebook.com/inlirah',
  twitter: 'https://twitter.com/inlirah',
  instagram: 'https://instagram.com/inlirah',
  linkedin: 'https://linkedin.com/company/inlirah',
  docs: 'https://docs.inlirah.com',
  helpCenter: 'https://help.inlirah.com',
  youtube: 'https://youtube.com/inlirah',
  github: 'https://github.com/inlirah'
};

  async findAll(filters?: {
    status?: string;
    subject?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.subject) {
      where.subject = filters.subject;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    return this.prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            picture: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            picture: true,
          },
        },
      },
    });

    if (!contact) {
      throw new HttpException('Contact not found', HttpStatus.NOT_FOUND);
    }

    return contact;
  }

  async updateStatus(id: string, status: string, notes?: string) {
    const contact = await this.findOne(id);

    // Validate status is valid
    const validStatuses = ['NEW', 'IN_PROGRESS', 'RESPONDED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      throw new HttpException('Invalid status value', HttpStatus.BAD_REQUEST);
    }

    const updateData: any = {
      status: status,
      updatedAt: new Date(),
    };

    if (status === 'RESPONDED' && !contact.respondedAt) {
      updateData.respondedAt = new Date();
    }

    if (notes) {
      updateData.metadata = {
        ...(contact.metadata as any || {}),
        adminNotes: notes,
      };
    }

    return this.prisma.contact.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    // First check if contact exists
    const contact = await this.findOne(id);
    
    return this.prisma.contact.delete({
      where: { id },
    });
  }

  async getStatistics() {
    const [total, byStatus, bySubject, todayCount] = await Promise.all([
      this.prisma.contact.count(),
      this.prisma.contact.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.contact.groupBy({
        by: ['subject'],
        _count: true,
      }),
      this.prisma.contact.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      total,
      byStatus: byStatus || [],
      bySubject: bySubject || [],
      todayCount,
    };
  }
}