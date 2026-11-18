import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { APPLICATION_GOOGLE_FORM_URL } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'ivr-global-settings' },
      select: {
        googleFormsUrl: true,
        contactEmail: true,
        contactPhone: true,
        internshipDurationDays: true,
      },
    });

    return NextResponse.json(
      {
        googleFormsUrl: settings?.googleFormsUrl || APPLICATION_GOOGLE_FORM_URL,
        contactEmail: settings?.contactEmail || 'admin@ivrtechsolution.in',
        contactPhone: settings?.contactPhone || '+91 8143177907',
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({
      googleFormsUrl: APPLICATION_GOOGLE_FORM_URL,
    });
  }
}

