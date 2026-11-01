import crypto from 'crypto';
import QRCode from 'qrcode';

const QR_SECRET = process.env.JWT_SECRET || 'ivr_dynamic_qr_signature_secret_2026';

export interface DynamicAttendanceToken {
  sessionId: string;
  batchId: string;
  mentorId: string;
  timestamp: number;
  nonce: string;
  signature: string;
}

// Generate time-limited dynamic token for QR attendance
export function generateAttendanceToken(sessionId: string, batchId: string, mentorId: string): string {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(8).toString('hex');
  const payload = `${sessionId}:${batchId}:${mentorId}:${timestamp}:${nonce}`;
  const signature = crypto.createHmac('sha256', QR_SECRET).update(payload).digest('hex');

  const tokenData = {
    sessionId,
    batchId,
    mentorId,
    timestamp,
    nonce,
    signature,
  };

  return Buffer.from(JSON.stringify(tokenData)).toString('base64');
}

// Validate attendance token
export function verifyAttendanceToken(
  tokenString: string,
  maxAgeMs = 15 * 60 * 1000 // 15 minutes default validity
): { valid: boolean; data?: DynamicAttendanceToken; error?: string } {
  try {
    const raw = Buffer.from(tokenString, 'base64').toString('utf-8');
    const data: DynamicAttendanceToken = JSON.parse(raw);

    const now = Date.now();
    if (now - data.timestamp > maxAgeMs) {
      return { valid: false, error: 'QR Code attendance token has expired. Please ask your mentor for a fresh QR code.' };
    }

    const payload = `${data.sessionId}:${data.batchId}:${data.mentorId}:${data.timestamp}:${data.nonce}`;
    const expectedSignature = crypto.createHmac('sha256', QR_SECRET).update(payload).digest('hex');

    if (data.signature !== expectedSignature) {
      return { valid: false, error: 'Invalid attendance token signature.' };
    }

    return { valid: true, data };
  } catch {
    return { valid: false, error: 'Malformed attendance QR token.' };
  }
}

// Generate Data URL QR code
export async function generateQRCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 256,
      color: {
        dark: '#3B0764',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR code Data URL:', err);
    return '';
  }
}
