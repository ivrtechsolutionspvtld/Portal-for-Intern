import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('photo') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No photo file provided.' }, { status: 400 });
    }

    // Validate mime type: JPG, JPEG, PNG
    const validMimes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload a passport-size photo in JPG, JPEG, or PNG format.' },
        { status: 400 }
      );
    }

    // Validate size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit. Please upload a photo under 5MB.' },
        { status: 400 }
      );
    }

    // Convert file to Base64 Data URI for permanent database persistence
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    const avatarUrl = `data:${file.type};base64,${base64Data}`;

    // Update user record in database
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: avatarUrl },
    });

    return NextResponse.json({
      success: true,
      message: 'Passport photograph uploaded and saved successfully.',
      avatarUrl,
    });
  } catch (error: any) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload photo.' },
      { status: 500 }
    );
  }
}

