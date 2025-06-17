import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// получение всех бронирований
export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      // включаем связанные данные о комнате и пользователе
      include: {
        room: true,
        user: true,
      },
    });
    return NextResponse.json(bookings);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

// создание нового бронирования
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { title, startTime, endTime, roomId, userId } = data;

    const newBooking = await prisma.booking.create({
      data: {
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        roomId,
        userId,
      },
    });

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}