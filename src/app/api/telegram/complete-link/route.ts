// src/app/api/telegram/complete-link/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const { code, telegramId } = await request.json();

  if (!code || !telegramId) {
    return NextResponse.json({ error: 'Code and Telegram ID are required' }, { status: 400 });
  }

  const linkToken = await prisma.linkToken.findUnique({ where: { id: code } });

  if (!linkToken || linkToken.expires < new Date()) {
    return NextResponse.json({ error: 'Код недействителен или срок его действия истек' }, { status: 404 });
  }

  // Привязываем Telegram ID к пользователю и удаляем токен
  await prisma.user.update({
    where: { id: linkToken.userId },
    data: { telegramId: String(telegramId) },
  });
  await prisma.linkToken.delete({ where: { id: code } });

  return NextResponse.json({ message: 'Аккаунт успешно привязан!' });
}