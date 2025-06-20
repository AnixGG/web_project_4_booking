// src/app/api/telegram/generate-link-code/route.ts
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not Authenticated' }, { status: 401 });
  }

  // Генерируем простой, но уникальный код
  const code = `link-${randomBytes(4).toString('hex')}`;
  const expires = new Date(new Date().getTime() + 5 * 60 * 1000); // Код действителен 5 минут

  // Создаем или обновляем код для текущего пользователя
  await prisma.linkToken.upsert({
    where: { userId: session.user.id },
    update: { id: code, expires },
    create: { id: code, userId: session.user.id, expires },
  });

  return NextResponse.json({ code });
}
