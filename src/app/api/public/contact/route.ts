import { NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const { name, email, phone, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    console.log(`[CONTACT QUERY RECEIVED] From: ${name} (${email}) - ${subject}: ${message}`);

    await logAuditEvent({
      userEmail: email,
      userRole: 'PUBLIC_VISITOR',
      action: 'CONTACT_FORM_SUBMITTED',
      module: 'CONTACT',
      details: `Contact inquiry from ${name} (${email}): ${subject || 'General Inquiry'}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for reaching out to IVR. An enterprise representative will respond within 24 business hours.',
    });
  } catch (error) {
    console.error('Contact submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
