// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

/**
 * Transactional email via Mailgun HTTP API.
 * Falls back to console.log when MAILGUN_API_KEY is not configured.
 */

import { logger } from "./logger";

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const MAIL_FROM = process.env.MAIL_FROM || `noreply@${MAILGUN_DOMAIN}`;

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<void> {
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    logger.info("email_dev_fallback", { to, subject });
    console.log("━━━ EMAIL (dev) ━━━━━━━━━━━━━━━━━━━━━");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text || html);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return;
  }

  const form = new FormData();
  form.append("from", MAIL_FROM);
  form.append("to", to);
  form.append("subject", subject);
  form.append("html", html);
  if (text) form.append("text", text);

  const res = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString("base64")}`,
    },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text();
    logger.error("email_send_failed", { to, subject, status: res.status, body });
    throw new Error(`Mailgun error ${res.status}: ${body}`);
  }

  logger.info("email_sent", { to, subject });
}

// ============================================================
// Email templates
// ============================================================

function emailLayout(body: string): string {
  return `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">${body}</div>`;
}

function emailButton(href: string, label: string): string {
  return `<a href="${href}" style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px;">${label}</a>`;
}

function emailHeading(text: string): string {
  return `<h2 style="color: #111; font-size: 20px; margin-bottom: 16px;">${text}</h2>`;
}

function emailParagraph(text: string): string {
  return `<p style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">${text}</p>`;
}

function emailFootnote(text: string): string {
  return `<p style="color: #999; font-size: 12px; margin-top: 32px;">${text}</p>`;
}

export function passwordResetEmail(resetUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: "Reset your unfol.de password",
    html: emailLayout(`
        ${emailHeading("Password reset")}
        ${emailParagraph("Click the button below to reset your password. This link expires in 1 hour.")}
        ${emailButton(resetUrl, "Reset password")}
        ${emailFootnote("If you didn't request this, you can safely ignore this email.")}
    `),
    text: `Reset your unfol.de password\n\nClick here to reset your password (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, ignore this email.`,
  };
}

export function welcomeEmail(adminUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: "Welcome to unfol.de",
    html: emailLayout(`
        ${emailHeading("Welcome to unfol.de")}
        ${emailParagraph("Your portfolio site is live. Here's how to get started:")}
        <ul style="color: #555; font-size: 14px; line-height: 1.8; margin-bottom: 24px; padding-left: 20px;">
          <li>Upload your first project</li>
          <li>Customize colors and layout</li>
          <li>Share your link with the world</li>
        </ul>
        ${emailButton(adminUrl, "Go to your dashboard")}
        ${emailFootnote("Reply to this email if you need help getting started.")}
    `),
    text: `Welcome to unfol.de\n\nYour portfolio site is live. Here's how to get started:\n\n- Upload your first project\n- Customize colors and layout\n- Share your link with the world\n\nGo to your dashboard: ${adminUrl}`,
  };
}

export function paymentFailedEmail(portalUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: "Action needed: payment failed",
    html: emailLayout(`
        ${emailHeading("Payment failed")}
        ${emailParagraph("Your latest payment could not be processed. Please update your payment method to keep your Pro features active.")}
        ${emailButton(portalUrl, "Update payment method")}
        ${emailFootnote("Your Pro features remain active for now, but may be suspended if not resolved.")}
    `),
    text: `Payment failed\n\nYour latest payment could not be processed. Please update your payment method to keep your Pro features active.\n\nUpdate payment method: ${portalUrl}`,
  };
}

export function emailVerificationEmail(verifyUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: "Verify your email — unfol.de",
    html: emailLayout(`
        ${emailHeading("Verify your email")}
        ${emailParagraph("Click the button below to verify your email address. This link expires in 24 hours.")}
        ${emailButton(verifyUrl, "Verify email")}
        <ul style="color: #555; font-size: 14px; line-height: 1.8; margin-top: 24px; margin-bottom: 24px; padding-left: 20px;">
          <li>Upload your first project</li>
          <li>Customize colors and layout</li>
          <li>Share your link with the world</li>
        </ul>
        ${emailFootnote("If you didn't create this account, you can safely ignore this email.")}
    `),
    text: `Verify your email\n\nClick here to verify your email (expires in 24 hours):\n${verifyUrl}\n\nQuick start:\n- Upload your first project\n- Customize colors and layout\n- Share your link with the world`,
  };
}

export function subscriptionConfirmedEmail(adminUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: "You're on unfol.de Pro!",
    html: emailLayout(`
        ${emailHeading("Welcome to Pro")}
        <p style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
          Your upgrade is confirmed. Here's what's now unlocked:
        </p>
        <ul style="color: #555; font-size: 14px; line-height: 1.8; margin-bottom: 24px; padding-left: 20px;">
          <li>Custom domain</li>
          <li>Unlimited projects &amp; pages</li>
          <li>Remove unfol.de branding</li>
          <li>2 GB storage</li>
        </ul>
        ${emailButton(adminUrl, "Go to your dashboard")}
    `),
    text: `You're on unfol.de Pro!\n\nYour upgrade is confirmed. Here's what's now unlocked:\n\n- Custom domain\n- Unlimited projects & pages\n- Remove unfol.de branding\n- 2 GB storage\n\nGo to your dashboard: ${adminUrl}`,
  };
}
