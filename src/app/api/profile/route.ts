// src/app/api/profile/route.ts

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]'; // Импортируем наши authOptions
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Обработчик для GET-запросов
export async function GET(request: Request) {
  // 1. Получаем сессию текущего пользователя на сервере.
  // NextAuth безопасно сделает это, посмотрев на cookie в запросе.
  const session = await getServerSession(authOptions);

  // 2. Если сессии нет (пользователь не вошел), возвращаем ошибку 401 Unauthorized.
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Not Authenticated' }, { status: 401 });
  }

  try {
    // 3. Используем ID из сессии, чтобы найти пользователя в базе данных.
    // Это безопасно, так как ID мы берем из доверенного источника - сессии.
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      // 4. Выбираем только те поля, которые хотим вернуть на клиент.
      // Никогда не возвращайте хеш пароля!
      select: {
        name: true,
        email: true,
        telegramId: true,
      },
    });

    // Если по какой-то причине пользователя нет в БД (очень редкий случай)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 5. Отправляем данные профиля в формате JSON с успешным статусом 200.
    return NextResponse.json(user);

  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}