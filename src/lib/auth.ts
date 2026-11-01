import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'ivr_enterprise_secret_key_2026_default_fallback';
const COOKIE_NAME = 'ivr_auth_token';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        studentProfile: {
          include: {
            batch: true,
            mentor: {
              include: { user: true },
            },
          },
        },
        mentorProfile: {
          include: {
            assignedStudents: {
              include: { user: true, batch: true },
            },
            batches: true,
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      studentProfile: user.studentProfile,
      mentorProfile: user.mentorProfile,
    };
  } catch (err) {
    console.error('Error getting session user:', err);
    return null;
  }
}

export async function getAuthFromRequest(req: Request) {
  // Check cookie header first
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(^|;\\s*)${COOKIE_NAME}=([^;]*)`));
  let token = match ? decodeURIComponent(match[2]) : null;

  // Fallback to Authorization Bearer header
  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: {
      studentProfile: true,
      mentorProfile: true,
    },
  });

  if (!user || user.status !== 'ACTIVE') return null;

  return user;
}

export { COOKIE_NAME };
