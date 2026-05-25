import { sendEmail } from './resend.js';

// ============================================================
// DESIGN TOKENS (mirrors app/frontend/app/_lib/theme.ts)
// ============================================================
//
// Light theme values are used as inline-style baseline.
// Dark theme values are applied via @media (prefers-color-scheme: dark)
// so the email adapts to the recipient's system preference.
//
// Primary  — teal scale
// Neutral  — navy/slate scale

// ============================================================
// SHARED LAYOUT
// ============================================================

function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>ShopCop</title>
  <style>
    /* ── Reset ──────────────────────────────────────────── */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    img { border: 0; display: block; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }

    /* ── Base (light theme) ─────────────────────────────── */
    body {
      background-color: #f8fafc;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                   'Helvetica Neue', Arial, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      margin: 0;
      padding: 0;
    }

    .email-wrapper {
      background-color: #f8fafc;
      padding: 40px 16px;
    }

    .email-card {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      max-width: 580px;
      margin: 0 auto;
      overflow: hidden;
    }

    /* ── Header ─────────────────────────────────────────── */
    .email-header {
      background-color: #0d9488;
      padding: 28px 40px;
    }

    .email-logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }

    .email-logo-icon {
      background-color: rgba(255,255,255,0.15);
      border-radius: 10px;
      width: 36px;
      height: 36px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .email-logo-text {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.3px;
    }

    /* ── Body ───────────────────────────────────────────── */
    .email-body {
      padding: 36px 40px 28px;
    }

    .email-greeting {
      color: #0f172a;
      font-size: 17px;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .email-text {
      color: #334155;
      font-size: 15px;
      line-height: 1.65;
      margin-bottom: 12px;
    }

    .email-text-muted {
      color: #64748b;
      font-size: 13px;
      line-height: 1.6;
    }

    /* ── OTP block ──────────────────────────────────────── */
    .otp-block {
      background-color: #f0fdfa;
      border: 2px solid #99f6e4;
      border-radius: 12px;
      margin: 24px 0;
      padding: 24px;
      text-align: center;
    }

    .otp-label {
      color: #0f766e;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .otp-code {
      color: #0f766e;
      font-size: 40px;
      font-weight: 700;
      letter-spacing: 10px;
      font-variant-numeric: tabular-nums;
    }

    /* ── Button ─────────────────────────────────────────── */
    .email-btn-wrap {
      text-align: center;
      margin: 28px 0;
    }

    .email-btn {
      background-color: #0d9488;
      border-radius: 10px;
      color: #ffffff !important;
      display: inline-block;
      font-size: 15px;
      font-weight: 600;
      padding: 14px 36px;
      text-decoration: none;
    }

    /* ── Divider ────────────────────────────────────────── */
    .email-divider {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 24px 0;
    }

    /* ── Expiry / notice badge ──────────────────────────── */
    .email-notice {
      background-color: #fef3c7;
      border-left: 3px solid #f59e0b;
      border-radius: 6px;
      color: #92400e;
      font-size: 13px;
      font-weight: 500;
      padding: 10px 14px;
      margin: 20px 0;
    }

    /* ── Fallback link ──────────────────────────────────── */
    .email-link-fallback {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin: 16px 0;
      padding: 12px 16px;
      word-break: break-all;
    }

    .email-link-fallback a {
      color: #0d9488;
      font-size: 12px;
      text-decoration: none;
    }

    /* ── Footer ─────────────────────────────────────────── */
    .email-footer {
      border-top: 1px solid #e2e8f0;
      padding: 20px 40px 28px;
      text-align: center;
    }

    .email-footer p {
      color: #94a3b8;
      font-size: 12px;
      line-height: 1.6;
      margin-bottom: 4px;
    }

    /* ── Dark mode ──────────────────────────────────────── */
    @media (prefers-color-scheme: dark) {
      body { background-color: #0f172a !important; color: #f1f5f9 !important; }

      .email-wrapper { background-color: #0f172a !important; }

      .email-card {
        background-color: #1e293b !important;
        border-color: #334155 !important;
      }

      .email-header { background-color: #0f766e !important; }

      .email-greeting { color: #f1f5f9 !important; }

      .email-text { color: #cbd5e1 !important; }

      .email-text-muted { color: #94a3b8 !important; }

      .otp-block {
        background-color: #134e4a !important;
        border-color: #0f766e !important;
      }

      .otp-label { color: #5eead4 !important; }

      .otp-code { color: #5eead4 !important; }

      .email-notice {
        background-color: #1c1a07 !important;
        border-color: #b45309 !important;
        color: #fcd34d !important;
      }

      .email-link-fallback {
        background-color: #0f172a !important;
        border-color: #334155 !important;
      }

      .email-link-fallback a { color: #2dd4bf !important; }

      .email-divider { border-color: #334155 !important; }

      .email-footer { border-color: #334155 !important; }

      .email-footer p { color: #475569 !important; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-card">

      <!-- Header -->
      <div class="email-header">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td>
              <!--[if mso]><table><tr><td><![endif]-->
              <table cellpadding="0" cellspacing="0" role="presentation" style="display:inline-table;vertical-align:middle;">
                <tr>
                  <td style="padding-right:10px;vertical-align:middle;">
                    <div style="background:rgba(255,255,255,0.18);border-radius:9px;width:36px;height:36px;text-align:center;line-height:36px;">
                      <span style="color:#ffffff;font-size:18px;font-weight:700;line-height:36px;">S</span>
                    </div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span class="email-logo-text">ShopCop</span>
                  </td>
                </tr>
              </table>
              <!--[if mso]></td></tr></table><![endif]-->
            </td>
          </tr>
        </table>
      </div>

      <!-- Body -->
      <div class="email-body">
        ${content}
      </div>

      <!-- Footer -->
      <div class="email-footer">
        <p>© ${new Date().getFullYear()} ShopCop. All rights reserved.</p>
        <p>This email was sent to you because an action was performed on your account.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>

    </div>
  </div>
</body>
</html>`;
}

// ============================================================
// OTP EMAIL
// ============================================================

/**
 * Sends an OTP verification email to the user during signup.
 *
 * @param email - Recipient email address
 * @param otp - 6-digit one-time password to embed in the email
 * @param name - Optional display name to personalise the greeting
 * @returns `true` if the email was dispatched successfully, `false` otherwise
 */
export const sendOTPEmail = async (
  email: string,
  otp: string,
  name?: string
): Promise<boolean> => {
  const greeting = name ? `Hi ${name}` : 'Hi there';

  const html = emailShell(`
    <p class="email-greeting">${greeting} 👋</p>

    <p class="email-text">
      Thanks for signing up to ShopCop! To complete your registration, please verify
      your email address using the code below.
    </p>

    <div class="otp-block">
      <p class="otp-label">Verification Code</p>
      <p class="otp-code">${otp}</p>
    </div>

    <div class="email-notice">
      ⏱ This code expires in <strong>5 minutes</strong>. Do not share it with anyone.
    </div>

    <hr class="email-divider" />

    <p class="email-text-muted">
      If you didn't create a ShopCop account, you can safely ignore this email.
      Someone may have entered your address by mistake.
    </p>
  `);

  return sendEmail({
    to: email,
    subject: 'Your ShopCop verification code',
    html,
  });
};

// ============================================================
// MAGIC LINK EMAIL
// ============================================================

/**
 * Sends a magic link login email to the user.
 *
 * @param email - Recipient email address
 * @param magicLink - Fully qualified URL containing the one-time login token
 * @param name - Optional display name to personalise the greeting
 * @returns `true` if the email was dispatched successfully, `false` otherwise
 */
export const sendMagicLinkEmail = async (
  email: string,
  magicLink: string,
  name?: string
): Promise<boolean> => {
  const greeting = name ? `Hi ${name}` : 'Hi there';

  const html = emailShell(`
    <p class="email-greeting">${greeting} 👋</p>

    <p class="email-text">
      You requested a sign-in link for your ShopCop account. Click the button below
      to sign in instantly — no password needed.
    </p>

    <div class="email-btn-wrap">
      <a href="${magicLink}" class="email-btn" target="_blank">
        Sign in to ShopCop
      </a>
    </div>

    <div class="email-notice">
      ⏱ This link expires in <strong>15 minutes</strong> and can only be used once.
    </div>

    <hr class="email-divider" />

    <p class="email-text-muted" style="margin-bottom:8px;">
      Button not working? Copy and paste this link into your browser:
    </p>
    <div class="email-link-fallback">
      <a href="${magicLink}" target="_blank">${magicLink}</a>
    </div>

    <hr class="email-divider" />

    <p class="email-text-muted">
      If you didn't request this sign-in link, you can safely ignore this email.
      Your account remains secure.
    </p>
  `);

  return sendEmail({
    to: email,
    subject: 'Your ShopCop sign-in link',
    html,
  });
};
