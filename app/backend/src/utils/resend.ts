import { Resend } from 'resend';
import { env } from '@config/env.js';
import { emailLogger } from './logger.js';

const RESEND_API_KEY = env.RESEND_API_KEY;
const resend = new Resend(RESEND_API_KEY);

/** Parameters for sending a transactional email via Resend. */
interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends a transactional email via the Resend API.
 *
 * @param params.to - Recipient email address
 * @param params.subject - Email subject line
 * @param params.html - HTML body content
 * @returns `true` if the email was sent successfully, `false` on any error
 */
export const sendEmail = async ({ to, subject, html }: SendEmailParams): Promise<boolean> => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: to,
      subject: subject,
      html: html,
    });

    if (error) {
      emailLogger.error('Email send error', { error });
      return false;
    }
    emailLogger.info(`Email sent successfully to ${data?.id}`, {
      recipient: data?.id,
    });
    return true;
  } catch (error) {
    if (error instanceof Error) {
      emailLogger.error(error.message);
    }
  }
  return false;
};
