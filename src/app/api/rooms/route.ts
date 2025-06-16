import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { id: 'asc' }
    });
    return NextResponse.json(rooms);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

// создать новую комнату
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, capacity, description } = data;

    if (!name || !capacity) {
        return NextResponse.json({ error: 'Name and capacity are required' }, { status: 400 });
    }

    const newRoom = await prisma.room.create({
      data: {
        name,
        capacity,
        description,
      },
    });

    return NextResponse.json(newRoom, { status: 201 }); // создано
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}