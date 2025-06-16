// src/app/api/rooms/[id]/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Параметры для функции, чтобы получить ID из URL
interface RouteParams {
  params: { id: string };
}

// Функция для обработки DELETE-запросов (удалить комнату)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const id = parseInt(params.id, 10);
    await prisma.room.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 }); // 204 No Content - успешное удаление
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
  }
}

// Функция для обработки PUT-запросов (обновить комнату)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const id = parseInt(params.id, 10);
    const data = await request.json();
    const { name, capacity } = data;

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: { name, capacity },
    });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}
