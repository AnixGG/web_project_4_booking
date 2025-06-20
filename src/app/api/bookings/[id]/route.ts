import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: { id: string };
}

// Удаление бронирования по ID
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
    }
    // Удаляем
    await prisma.booking.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Booking deleted' });
  } catch (error) {
    console.error('Failed to delete booking:', error);
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
}
