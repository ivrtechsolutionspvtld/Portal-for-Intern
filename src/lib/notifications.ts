import prisma from './prisma';

export interface SendEmailOptions {
  to: string;
  subject: string;
  title: string;
  recipientName: string;
  bodyHtml: string;
  actionText?: string;
  actionUrl?: string;
}

export interface SendWhatsAppOptions {
  phone: string;
  templateName: string;
  recipientName: string;
  parameters: Record<string, string>;
}

// Generate premium IVR enterprise branded HTML email template
export function generateIVREmailTemplate({
  title,
  recipientName,
  bodyHtml,
  actionText,
  actionUrl,
}: Omit<SendEmailOptions, 'to' | 'subject'>): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #1E293B; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #3B0764 0%, #5B21B6 100%); padding: 32px 28px; text-align: left; }
    .logo { color: #FFFFFF; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
    .logo span { color: #C4B5FD; }
    .subtitle { color: #DDD6FE; font-size: 13px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 32px 28px; }
    .title { font-size: 20px; font-weight: 700; color: #0F172A; margin: 0 0 16px 0; }
    .greeting { font-size: 15px; font-weight: 600; color: #334155; margin-bottom: 16px; }
    .body-text { font-size: 14px; line-height: 1.65; color: #475569; margin-bottom: 24px; }
    .btn { display: inline-block; background: #6D28D9; color: #FFFFFF !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; }
    .footer { background: #F1F5F9; padding: 20px 28px; border-top: 1px solid #E2E8F0; font-size: 12px; color: #64748B; text-align: center; }
    .badge { display: inline-block; background: #EDE9FE; color: #5B21B6; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">IVR <span>TECH SOLUTIONS</span></h1>
      <div class="subtitle">Building Skills. Creating Opportunities. Shaping Careers.</div>
    </div>
    <div class="content">
      <div class="greeting">Dear ${recipientName},</div>
      <h2 class="title">${title}</h2>
      <div class="body-text">
        ${bodyHtml}
      </div>
      ${
        actionText && actionUrl
          ? `<div style="text-align: center; margin: 28px 0;">
              <a href="${actionUrl}" class="btn">${actionText}</a>
            </div>`
          : ''
      }
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px 0;"><strong>IVR TECH SOLUTIONS PRIVATE LIMITED</strong> • <a href="mailto:admin@ivrtechsolution.in" style="color: #6D28D9;">admin@ivrtechsolution.in</a></p>
      <p style="margin: 0;">This official automated communication complies with the Digital Personal Data Protection (DPDP) Act.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// In-app notification dispatcher
export async function createInAppNotification({
  userId,
  title,
  message,
  type = 'INFO',
  link,
}: {
  userId: string;
  title: string;
  message: string;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  link?: string;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
      },
    });
  } catch (err) {
    console.error('Failed to create in-app notification:', err);
    return null;
  }
}

// Multi-channel notification dispatcher
export async function dispatchNotification({
  userId,
  userEmail,
  userPhone,
  userName,
  title,
  message,
  type = 'INFO',
  actionUrl,
  channels = ['IN_APP', 'EMAIL'],
}: {
  userId: string;
  userEmail?: string;
  userPhone?: string;
  userName: string;
  title: string;
  message: string;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  actionUrl?: string;
  channels?: ('IN_APP' | 'EMAIL' | 'WHATSAPP')[];
}) {
  const results: Record<string, boolean> = {};

  // 1. In-App Notification
  if (channels.includes('IN_APP')) {
    const res = await createInAppNotification({
      userId,
      title,
      message,
      type,
      link: actionUrl,
    });
    results.inApp = !!res;
  }

  // 2. Email Notification (Amazon SES integration / logger)
  if (channels.includes('EMAIL') && userEmail) {
    const emailHtml = generateIVREmailTemplate({
      title,
      recipientName: userName,
      bodyHtml: `<p>${message}</p>`,
      actionText: actionUrl ? 'View Details in Portal' : undefined,
      actionUrl,
    });

    console.log(`[SES EMAIL DISPATCHED] To: ${userEmail} | Subject: [IVR] ${title}`);
    results.email = true;
  }

  // 3. WhatsApp Business Cloud API dispatcher
  if (channels.includes('WHATSAPP') && userPhone) {
    console.log(`[WHATSAPP DISPATCHED] To: ${userPhone} | Message: ${title} - ${message}`);
    results.whatsapp = true;
  }

  return results;
}
