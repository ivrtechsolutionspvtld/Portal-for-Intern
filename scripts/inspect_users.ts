import prisma from '../src/lib/prisma';

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      studentProfile: { select: { id: true, studentId: true, mentorId: true, domain: true } },
      mentorProfile: { select: { id: true, mentorId: true, designation: true } },
    },
  });
  console.log('Total users:', users.length);
  console.log(JSON.stringify(users, null, 2));
}

main().finally(() => prisma.$disconnect());

