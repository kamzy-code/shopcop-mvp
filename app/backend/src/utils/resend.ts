import { Resend } from 'resend';
import { env } from '@config/env.js';
import { emailLogger } from './logger.js';

const RESEND_API_KEY = env.RESEND_API_KEY;
const resend = new Resend(RESEND_API_KEY);

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

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
