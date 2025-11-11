import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: any;
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Email templates
const getEmailTemplate = (template: string, data: any): string => {
  switch (template) {
    case 'verification':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c3e50; margin: 0;">
                <i style="margin-right: 10px;">⚖️</i>
                Jury AI
              </h1>
              <p style="color: #7f8c8d; margin: 5px 0 0 0;">Legal Assistant</p>
            </div>
            
            <h2 style="color: #2c3e50; text-align: center; margin-bottom: 20px;">
              Welcome to Jury AI, ${data.name}!
            </h2>
            
            <p style="color: #34495e; line-height: 1.6; margin-bottom: 25px;">
              Thank you for registering with Jury AI. To complete your account setup and access all our legal assistance features, please verify your email address.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.verificationUrl}" 
                 style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #7f8c8d; font-size: 14px; line-height: 1.5;">
              If you didn't create an account with Jury AI, please ignore this email.
              <br><br>
              If the button above doesn't work, copy and paste this link into your browser:
              <br>
              <a href="${data.verificationUrl}" style="color: #3498db; word-break: break-all;">${data.verificationUrl}</a>
            </p>
            
            <div style="border-top: 1px solid #ecf0f1; margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="color: #95a5a6; font-size: 12px; margin: 0;">
                © 2024 Jury AI. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `;

    case 'password-reset':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c3e50; margin: 0;">
                <i style="margin-right: 10px;">⚖️</i>
                Jury AI
              </h1>
              <p style="color: #7f8c8d; margin: 5px 0 0 0;">Legal Assistant</p>
            </div>
            
            <h2 style="color: #2c3e50; text-align: center; margin-bottom: 20px;">
              Password Reset Request
            </h2>
            
            <p style="color: #34495e; line-height: 1.6; margin-bottom: 25px;">
              Hello ${data.name},
              <br><br>
              We received a request to reset the password for your Jury AI account. If you made this request, click the button below to reset your password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.resetUrl}" 
                 style="background-color: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #7f8c8d; font-size: 14px; line-height: 1.5;">
              This password reset link will expire in 1 hour for security reasons.
              <br><br>
              If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
              <br><br>
              If the button above doesn't work, copy and paste this link into your browser:
              <br>
              <a href="${data.resetUrl}" style="color: #e74c3c; word-break: break-all;">${data.resetUrl}</a>
            </p>
            
            <div style="border-top: 1px solid #ecf0f1; margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="color: #95a5a6; font-size: 12px; margin: 0;">
                © 2024 Jury AI. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `;

    case 'welcome':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c3e50; margin: 0;">
                <i style="margin-right: 10px;">⚖️</i>
                Jury AI
              </h1>
              <p style="color: #7f8c8d; margin: 5px 0 0 0;">Legal Assistant</p>
            </div>
            
            <h2 style="color: #2c3e50; text-align: center; margin-bottom: 20px;">
              Welcome to Jury AI!
            </h2>
            
            <p style="color: #34495e; line-height: 1.6; margin-bottom: 25px;">
              Hello ${data.name},
              <br><br>
              Congratulations! Your email has been verified and your Jury AI account is now active. You can now access all our features:
            </p>
            
            <ul style="color: #34495e; line-height: 1.8; margin-bottom: 25px;">
              <li>🤖 AI-powered legal consultation</li>
              <li>📄 Document analysis and review</li>
              <li>📋 Legal template library</li>
              <li>👥 Community discussions</li>
              <li>💬 Connect with verified lawyers</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}" 
                 style="background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Get Started
              </a>
            </div>
            
            <p style="color: #7f8c8d; font-size: 14px; line-height: 1.5;">
              If you have any questions or need assistance, feel free to reach out to our support team.
            </p>
            
            <div style="border-top: 1px solid #ecf0f1; margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="color: #95a5a6; font-size: 12px; margin: 0;">
                © 2024 Jury AI. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `;

    default:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>Jury AI</h1>
          <p>Thank you for using our service.</p>
        </div>
      `;
  }
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const html = getEmailTemplate(options.template, options.data);
    
    const mailOptions = {
      from: `"Jury AI" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
};

// Verify transporter configuration
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service configuration error:', error);
    return false;
  }
};
