import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MENTOR')) {
      return NextResponse.json({ error: 'Unauthorized: Admin or Mentor access required' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const resourceType = formData.get('type') as string | null; // 'video' | 'pdf'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileType = file.type.toLowerCase();
    const fileName = file.name;
    const fileExt = path.extname(fileName).toLowerCase();

    // Validate resource format
    if (resourceType === 'video' || fileType.startsWith('video/')) {
      const validVideoTypes = ['video/mp4', 'video/webm'];
      const validVideoExts = ['.mp4', '.webm'];
      if (!validVideoTypes.includes(fileType) && !validVideoExts.includes(fileExt)) {
        return NextResponse.json(
          { error: 'Invalid video format. Supported formats: MP4 and WebM.' },
          { status: 400 }
        );
      }
    } else if (resourceType === 'pdf' || fileType === 'application/pdf') {
      if (fileType !== 'application/pdf' && fileExt !== '.pdf') {
        return NextResponse.json(
          { error: 'Invalid document format. Only PDF files are supported.' },
          { status: 400 }
        );
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Try saving to disk in public/uploads/resources
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'resources');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const safeBaseName = path.basename(fileName, fileExt).replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueName = `${safeBaseName}_${Date.now()}${fileExt}`;
      const filePath = path.join(uploadsDir, uniqueName);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/resources/${uniqueName}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename: fileName,
        size: file.size,
      });
    } catch (fsError) {
      // In serverless read-only environment, convert to Base64 Data URI
      console.warn('Filesystem write failed, using base64 data URI fallback:', fsError);
      const mime = fileType || (resourceType === 'pdf' ? 'application/pdf' : 'video/mp4');
      const base64Data = buffer.toString('base64');
      const dataUri = `data:${mime};base64,${base64Data}`;

      return NextResponse.json({
        success: true,
        url: dataUri,
        filename: fileName,
        size: file.size,
      });
    }
  } catch (error: any) {
    console.error('Resource upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload resource file.' },
      { status: 500 }
    );
  }
}

