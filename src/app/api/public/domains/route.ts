import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        code: true,
        title: true,
        domain: true,
        durationWeeks: true,
        level: true,
        department: true,
      },
      orderBy: { title: 'asc' },
    });

    const programs = await prisma.internshipProgram.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        title: true,
        domain: true,
        duration: true,
        level: true,
        courseId: true,
      },
      orderBy: { title: 'asc' },
    });

    // Unique list of domains
    const domainNames = Array.from(
      new Set([
        ...courses.map((c) => c.domain || c.title),
        ...courses.map((c) => c.title),
        ...programs.map((p) => p.domain),
      ])
    ).filter(Boolean);

    return NextResponse.json(
      {
        success: true,
        courses,
        programs,
        domains: domainNames,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: any) {
    console.error('Failed to fetch public domains list:', error);
    return NextResponse.json({ error: 'Failed to fetch domains', courses: [], programs: [], domains: [] }, { status: 500 });
  }
}

