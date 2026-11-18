import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { COMPANY_INFO } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function parseCommaOrList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function GET() {
  try {
    // 1. Fetch all active courses directly from database
    const activeCourses = await prisma.course.findMany({
      where: { status: 'ACTIVE' },
      include: {
        modules: {
          orderBy: { orderIndex: 'asc' },
        },
        programs: {
          where: { status: 'ACTIVE' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch all active internship programs from database
    const activePrograms = await prisma.internshipProgram.findMany({
      where: { status: 'ACTIVE' },
      include: {
        course: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Synthesize dynamic domain tracks from courses and programs
    // Database is the single source of truth - NO hardcoded lists
    const domains = activeCourses.map((course, idx) => {
      // Find linked active program if available to enhance metadata
      const linkedProg = course.programs?.[0] || null;

      let techList = linkedProg?.techStack ? parseCommaOrList(linkedProg.techStack) : [];
      if (techList.length === 0) {
        // Extract from syllabus or provide contextual tags from title/department
        techList = [course.department || 'Engineering', course.level || 'Practical', `${course.durationWeeks} Weeks`];
      }

      let projectList = linkedProg?.projects ? parseCommaOrList(linkedProg.projects) : [];
      if (projectList.length === 0 && course.modules.length > 0) {
        projectList = course.modules.slice(0, 3).map((m) => m.title);
      }
      if (projectList.length === 0) {
        projectList = ['Capstone Industry Project', 'Hands-on Verification Testbench', 'Final System Evaluation'];
      }

      return {
        id: course.id,
        code: course.code,
        name: course.title,
        domain: course.domain || course.title,
        department: course.department || 'Software Development',
        duration: `${course.durationWeeks} Weeks`,
        level: course.level || 'Intermediate',
        description: course.description,
        techStack: techList,
        projects: projectList,
        syllabus: course.syllabus,
        modulesCount: course.modules.length,
        status: course.status,
        index: idx + 1,
      };
    });

    return NextResponse.json(
      {
        success: true,
        domains,
        courses: activeCourses,
        programs: activePrograms,
        company: COMPANY_INFO,
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
    console.error('Failed to fetch public programs/domains:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch domain tracks and programs',
        domains: [],
        courses: [],
        programs: [],
        company: COMPANY_INFO,
      },
      { status: 500 }
    );
  }
}
