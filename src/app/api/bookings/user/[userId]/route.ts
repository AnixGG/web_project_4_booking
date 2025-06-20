import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  const userId = parseInt(params.userId, 10);
  if (isNaN(userId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const bookings = await prisma.booking.findMany({
    where: { userId, startTime: { gte: new Date() } },
    orderBy: { startTime: 'asc' },
    select: { id: true, title: true, startTime: true },
  });
  return NextResponse.json(bookings);
}