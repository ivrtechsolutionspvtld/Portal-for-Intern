import prisma from './prisma';

export async function logAuditEvent({
  userId,
  userEmail,
  userRole,
  action,
  module,
  details,
  ipAddress = '127.0.0.1',
}: {
  userId?: string;
  userEmail: string;
  userRole: string;
  action: string;
  module: string;
  details: string | object;
  ipAddress?: string;
}) {
  try {
    const detailString = typeof details === 'string' ? details : JSON.stringify(details);
    return await prisma.auditLog.create({
      data: {
        userId: userId || null,
        userEmail,
        userRole,
        action,
        module,
        details: detailString,
        ipAddress,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
    return null;
  }
}
