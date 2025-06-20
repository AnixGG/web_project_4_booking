// src/app/api/users/by-telegram/[telegramId]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { telegramId: string } }
) {
  try {
    const { telegramId } = params;
    const user = await prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ id: user.id, name: user.name });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
