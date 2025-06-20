import { Telegraf, Markup, Scenes, session, Context } from 'telegraf';
import 'dotenv/config';
import { format, parse } from 'date-fns';

// =============================================================================
// 1. ТИПЫ
// =============================================================================

type Room = { id: number; name: string; capacity: number };
type Booking = { id: number; title: string; startTime: string };

// =============================================================================
// 2. ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ АВТОРИЗАЦИИ
// =============================================================================

async function getUserIdByTelegramId(telegramId: number): Promise<number | null> {
    const apiUrl = process.env.API_BASE_URL;
    if (!apiUrl) {
        console.error("API_BASE_URL не определен!");
        return null;
    }
    try {
        const response = await fetch(`${apiUrl}/users/by-telegram/${telegramId}`);
        if (!response.ok) return null;
        const userData = await response.json();
        return userData.id;
    } catch (error) {
        console.error("Ошибка при проверке пользователя:", error);
        return null;
    }
}

// =============================================================================
// 3. ОПРЕДЕЛЕНИЕ СЦЕНЫ
// =============================================================================

const bookingWizard = new Scenes.WizardScene<any>(
  'booking_wizard',

  // Шаг 1: Спрашиваем дату
  async (ctx) => {
    await ctx.reply(
      `Вы бронируете комнату "${ctx.scene.session.roomName}".\n\n` +
      `Введите дату в формате ГГГГ-ММ-ДД (например, ${format(new Date(), 'yyyy-MM-dd')}).\n\n` +
      `Чтобы отменить, введите /cancel.`
    );
    return ctx.wizard.next();
  },

  // Шаг 2: Получаем дату, спрашиваем время
  async (ctx) => {
    if ('text' in ctx.message && /^\d{4}-\d{2}-\d{2}$/.test(ctx.message.text)) {
      ctx.scene.session.date = ctx.message.text;
      await ctx.reply('Отлично! Теперь введите время начала в формате ЧЧ:ММ (например, 14:00).');
      return ctx.wizard.next();
    }
    await ctx.reply('Неверный формат. Пожалуйста, введите дату как ГГГГ-ММ-ДД.');
    return;
  },

  // Шаг 3: Получаем время, спрашиваем название
  async (ctx) => {
    if ('text' in ctx.message && /^\d{2}:\d{2}$/.test(ctx.message.text)) {
      ctx.scene.session.time = ctx.message.text;
      await ctx.reply('Принято. И последнее, введите название для вашей встречи.');
      return ctx.wizard.next();
    }
    await ctx.reply('Неверный формат. Пожалуйста, введите время как ЧЧ:ММ.');
    return;
  },

  // Шаг 4: Получаем название, создаем бронь
  async (ctx) => {
    if (!('text' in ctx.message) || !ctx.message.text) {
      await ctx.reply('Пожалуйста, введите название встречи.');
      return;
    }
    ctx.scene.session.title = ctx.message.text;
    await ctx.reply('Минутку, создаю бронирование...');

    const { roomId, date, time, title, roomName } = ctx.scene.session;
    const userId = await getUserIdByTelegramId(ctx.from.id);

    if (!userId) {
      await ctx.reply('❌ Ошибка авторизации. Ваш Telegram не привязан к аккаунту на сайте.');
      return ctx.scene.leave();
    }

    if (!roomId || !date || !time || !title || !roomName) {
      await ctx.reply('❌ Произошла внутренняя ошибка. Не все данные для бронирования были собраны. Попробуйте снова.');
      return ctx.scene.leave();
    }

    const startTime = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    try {
      const response = await fetch(`${process.env.API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, roomId, userId, startTime: startTime.toISOString(), endTime: endTime.toISOString() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Сервер вернул ошибку.');
      await ctx.reply(`✅ Готово! Комната "${roomName}" успешно забронирована.`);
    } catch (error: any) {
      await ctx.reply(`❌ Не удалось забронировать: ${error.message}`);
    }

    return ctx.scene.leave();
  }
);

bookingWizard.command('cancel', async (ctx) => {
  await ctx.reply('Действие отменено.');
  return ctx.scene.leave();
});

// =============================================================================
// 4. ИНИЦИАЛИЗАЦИЯ БОТА
// =============================================================================

const bot = new Telegraf<Context>(process.env.BOT_TOKEN!);
const stage = new Scenes.Stage<any>([bookingWizard]);

bot.use(session());
bot.use(stage.middleware());

// =============================================================================
// 5. ОСНОВНЫЕ КОМАНДЫ БОТА
// =============================================================================

bot.start((ctx) => {
  ctx.reply(
    'Привет! Я бот для бронирования переговорок. 🤖\n\n' +
    'Доступные команды:\n' +
    '/rooms - Показать и забронировать комнату\n' +
    '/mybookings - Посмотреть или отменить мои брони\n' +
    '/link <code> - Привязать Telegram к аккаунту на сайте\n' +
    '/help - Помощь'
  );
});

bot.help((ctx) => ctx.reply('Используйте команду /rooms, чтобы начать. Если вы "застряли" в диалоге, введите /cancel.'));

bot.command('rooms', async (ctx) => {
  try {
    const response = await fetch(`${process.env.API_BASE_URL}/rooms`);
    if (!response.ok) throw new Error('Не удалось получить список комнат.');
    const rooms: Room[] = await response.json();

    if (rooms.length === 0) return ctx.reply('Свободных комнат пока нет.');

    const buttons = rooms.map((room) =>
      Markup.button.callback(
        `${room.name} (до ${room.capacity} чел.)`,
        `book_room_${room.id}_${room.name}`
      )
    );

    await ctx.reply(
      'Выберите комнату, чтобы начать бронирование:',
      Markup.inlineKeyboard(buttons, { columns: 1 })
    );
  } catch (error: any) {
    await ctx.reply(`❌ Ошибка: ${error.message}`);
  }
});

bot.command('mybookings', async (ctx) => {
  const userId = await getUserIdByTelegramId(ctx.from.id);
  if (!userId) {
    return ctx.reply('Ваш Telegram не привязан к аккаунту. Пожалуйста, привяжите его в профиле на сайте.');
  }

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/bookings/user/${userId}`);
    if (!response.ok) throw new Error('Не удалось получить ваши бронирования.');
    const bookings: Booking[] = await response.json();

    if (bookings.length === 0) return ctx.reply('У вас нет активных бронирований.');

    const buttons = bookings.map((booking) =>
      Markup.button.callback(
        `❌ ${booking.title} (${format(new Date(booking.startTime), 'dd.MM HH:mm')})`,
        `delete_booking_${booking.id}`
      )
    );

    await ctx.reply(
      'Вот ваши бронирования. Нажмите, чтобы отменить:',
      Markup.inlineKeyboard(buttons, { columns: 1 })
    );

  } catch (error: any) {
    await ctx.reply(`❌ Ошибка: ${error.message}`);
  }
});

bot.command('link', async (ctx) => {
  const code = ctx.payload.trim();
  const telegramId = ctx.from.id;

  if (!code) {
    return ctx.reply(
      'Пожалуйста, укажите код после команды.\n' +
      'Сначала сгенерируйте код в профиле на сайте, а затем отправьте его сюда в формате:\n' +
      '/link ваш_код'
    );
  }

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/telegram/complete-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, telegramId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Произошла неизвестная ошибка.');
    }

    await ctx.reply(`✅ ${data.message} Теперь вы можете пользоваться всеми функциями бота.`);

  } catch (error: any) {
    ctx.reply(`❌ Ошибка привязки: ${error.message}`);
  }
});

// =============================================================================
// 6. ОБРАБОТЧИКИ НАЖАТИЙ НА КНОПКИ (ACTIONS)
// =============================================================================

bot.action(/book_room_(\d+)_([\w\s\-.()]+)/, async (ctx: any) => {
  await ctx.answerCbQuery();
  ctx.scene.session.roomId = parseInt(ctx.match[1], 10);
  ctx.scene.session.roomName = ctx.match[2];
  ctx.scene.enter('booking_wizard');
});

bot.action(/delete_booking_(\d+)/, async (ctx: any) => {
  await ctx.answerCbQuery('Отменяю...');
  const bookingId = parseInt(ctx.match[1], 10);
  const userId = await getUserIdByTelegramId(ctx.from.id);

  if (!userId) {
    await ctx.editMessageText('Ошибка авторизации.');
    return;
  }

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/bookings/${bookingId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Не удалось отменить бронь.');
    }

    await ctx.editMessageText(`✅ Бронирование успешно отменено.`);
  } catch (error: any) {
    await ctx.editMessageText(`❌ Ошибка: ${error.message}`);
  }
});

// =============================================================================
// 7. ЗАПУСК БОТА
// =============================================================================
bot.launch(() => console.log('Бот запущен!'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));