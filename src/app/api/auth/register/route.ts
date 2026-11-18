import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error:
        'Public self-registration is disabled. Student and Mentor accounts are provisioned exclusively by the Administrator. Please log in with your assigned credentials or submit an application through the official Google Form.',
    },
    { status: 403 }
  );
}
