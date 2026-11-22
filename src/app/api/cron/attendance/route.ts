import { NextResponse } from 'next/server';
import { processDailyAbsences } from '@/lib/attendance';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date') || undefined;

    const result = await processDailyAbsences(dateStr);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Attendance cron error:', error);
    return NextResponse.json({ error: error.message || 'Cron job failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}

