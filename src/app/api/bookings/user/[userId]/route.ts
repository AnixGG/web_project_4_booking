import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId: rawUserId } = await context.params;
  const userId = parseInt(rawUserId, 10);
  if (isNaN(userId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const bookings = await prisma.booking.findMany({
    where: { userId, startTime: { gte: new Date() } },
    orderBy: { startTime: 'asc' },
    select: { id: true, title: true, startTime: true },
  });
  return NextResponse.json(bookings);
}