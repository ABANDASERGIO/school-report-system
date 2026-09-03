import nodemailer, { Transporter } from 'nodemailer';
import type { Attachment } from 'nodemailer/lib/mailer';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { env } from '../config/env';
import { APP_NAME } from '../config/constants';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Attachment[];
}

let transporter: Transporter | null = null;
let verified = false;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  const { host, port, user, pass } = env.mail;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

// Resolve the bundled logo relative to the compiled server. We try a few
// candidate locations so the same asset is found in dev (src/assets) and
// after `tsc` (dist/src/assets).
function resolveLogoPath(): string | null {
  const candidates = [
    join(__dirname, 'assets', 'logo.png'),
    join(__dirname, '..', 'assets', 'logo.png'),
    join(process.cwd(), 'src', 'assets', 'logo.png'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

// HTML email template that wraps the body in a branded layout. The logo
// is inlined via a CID attachment (see brandAttachments) so it renders
// even when the recipient's email client blocks remote images.
export function buildBrandedHtml(opts: {
  preheader: string;
  heading: string;
  bodyHtml: string;
  footerNote?: string;
}): string {
  const { preheader, heading, bodyHtml, footerNote } = opts;
  const safeName = APP_NAME.replace(/[<>&"]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : '&quot;'
  );
  const safePreheader = preheader.replace(/[<>&"]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : '&quot;'
  );
  const safeHeading = heading.replace(/[<>&"]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : '&quot;'
  );
  const safeFooter = (footerNote ?? `You received this email because you have an account on ${APP_NAME}.`)
    .replace(/[<>&"]/g, (c) =>
      c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : '&quot;'
    );
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${safeName}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${safePreheader}</span>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f6f8;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(15,23,42,0.06);">
            <tr>
              <td style="padding:24px 24px 8px 24px;text-align:center;background-color:#ffffff;">
                <img src="cid:edugrade-logo" alt="${safeName} logo" width="64" height="64" style="display:block;margin:0 auto 8px auto;width:64px;height:64px;border-radius:12px;object-fit:contain;background-color:#ffffff;" />
                <div style="font-size:18px;font-weight:700;color:#0f172a;letter-spacing:0.2px;">${safeName}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0 32px;">
                <h1 style="margin:16px 0 8px 0;font-size:20px;line-height:28px;color:#0f172a;">${safeHeading}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 24px 32px;font-size:14px;line-height:22px;color:#334155;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;border-top:1px solid #e2e8f0;background-color:#f8fafc;font-size:12px;line-height:18px;color:#64748b;text-align:center;">
                ${safeFooter}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// Returns the standard attachments (logo as inline CID) so it can be
// passed to send(). Returns [] when the logo file is not present so the
// caller's <img cid:...> simply falls back to broken-image behavior in
// the email client (the text body is still readable).
export function brandAttachments(): Attachment[] {
  const logoPath = resolveLogoPath();
  if (!logoPath) return [];
  return [
    {
      filename: 'logo.png',
      path: logoPath,
      cid: 'edugrade-logo',
      contentType: 'image/png',
    },
  ];
}

export const mailService = {
  /**
   * Whether SMTP is configured. When false, send() falls back to console logging.
   */
  isConfigured(): boolean {
    const { host, user, pass } = env.mail;
    return Boolean(host && user && pass);
  },

  /**
   * Send an email. If SMTP is not configured, the message is logged to the
   * console (dev fallback) including the HTML body. Returns true on success.
   */
  async send(message: MailMessage): Promise<boolean> {
    const t = getTransporter();
    const attachments = message.attachments ?? brandAttachments();

    if (!t) {
      // eslint-disable-next-line no-console
      console.log('\n========== EMAIL (dev fallback) ==========');
      // eslint-disable-next-line no-console
      console.log(`From:    ${env.mail.from}`);
      // eslint-disable-next-line no-console
      console.log(`To:      ${message.to}`);
      // eslint-disable-next-line no-console
      console.log(`Subject: ${message.subject}`);
      // eslint-disable-next-line no-console
      console.log('-------------------------------------------');
      // eslint-disable-next-line no-console
      console.log(message.text);
      // eslint-disable-next-line no-console
      console.log('===========================================\n');
      return true;
    }

    try {
      if (!verified) {
        await t.verify();
        verified = true;
      }
      await t.sendMail({
        from: env.mail.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments,
      });
      return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[MailService] Failed to send email:', err);
      return false;
    }
  },
};
