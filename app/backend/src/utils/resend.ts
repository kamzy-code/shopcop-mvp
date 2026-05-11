import { Resend } from 'resend';
import { env } from '@config/env.js';
import logger from './logger.js';
import { timeStamp } from 'node:console';

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
      html: html
    });

    if (error) {
      logger.error('Email send error', { error, timeStamp: new Date().toISOString() });
      return false;
    }
    logger.info(`Email sent successfully to ${data?.id}`, {
      recipient: data?.id,
      timeStamp: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    }
  }
  return false;
};
