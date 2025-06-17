import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

// получение всех бронирований
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');
  const date = searchParams.get('date');

  if (!roomId || !date) {
    return NextResponse.json({ error: 'Room ID and date are required' }, { status: 400 });
  }

  try {
    const selectedDate = new Date(date);

    if (isNaN(selectedDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);

    const bookings = await prisma.booking.findMany({
      where: {
        roomId: parseInt(roomId, 10),
        startTime: {
          lt: dayEnd,
        },
        endTime: {
          gt: dayStart,
        }
      },
      // включаем связанные данные о комнате и пользователе
      include: {
        user: {
          select: {name: true},
        },
      },
      orderBy: {
        startTime: 'asc',
      }
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

    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        roomId: roomId,
        AND:[
          {
            startTime: {
              lt: newEndTime,
            },
          },
          {
            endTime: {
              gt: newStartTime,
            },
          },
        ],
      },
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { error: 'Это время уже занято. Пожалуйста, выберите другой слот.' },
        { status: 409 }
      );
    }

    const newBooking = await prisma.booking.create({
      data: {
        title,
        startTime: newStartTime,
        endTime: newEndTime,
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