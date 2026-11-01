import { NextResponse } from 'next/server';
import { DOMAINS, COMPANY_INFO } from '@/lib/constants';

export async function GET() {
  return NextResponse.json({
    domains: DOMAINS,
    company: COMPANY_INFO,
  });
}
