// OTP Email Template
import { sendEmail } from "./resend.js";

export const sendOTPEmail = async (email: string, otp: string, name?: string): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin: 20px 0; }
        .otp { font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; 
               background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SHOPCOP - Verify Your Email</h1>
        </div>
        <div class="content">
          <p>Hi${name ? ' ' + name : ''},</p>
          <p>Welcome to SHOPCOP! Please use this code to verify your email address:</p>
          <div class="otp">${otp}</div>
          <p><strong>This code expires in 5 minutes.</strong></p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2026 SHOPCOP. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify your SHOPCOP account',
    html,
  });
};

// Magic Link Email Template
export const sendMagicLinkEmail = async (
  email: string,
  magicLink: string,
  name?: string
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 15px 40px;
                  text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SHOPCOP - Sign In</h1>
        </div>
        <div class="content">
          <p>Hi${name ? ' ' + name : ''},</p>
          <p>Click the button below to sign in to your SHOPCOP account:</p>
          <div style="text-align: center;">
            <a href="${magicLink}" class="button">Sign In to SHOPCOP</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Or copy this link: <br/>
            <a href="${magicLink}">${magicLink}</a>
          </p>
          <p><strong>This link expires in 15 minutes.</strong></p>
          <p>If you didn't request this link, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2026 SHOPCOP. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Sign in to SHOPCOP',
    html,
  });
};