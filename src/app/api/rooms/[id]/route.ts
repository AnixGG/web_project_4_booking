import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: { id: string };
}

// удалить комнату
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = parseInt(url.pathname.split('/').pop() || '', 10);
    
    await prisma.room.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
  }
}

// обновить комнату
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString, 10);

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
