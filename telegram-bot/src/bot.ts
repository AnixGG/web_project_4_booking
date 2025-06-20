import { Telegraf, Context } from 'telegraf';
import LocalSession from 'telegraf-session-local';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { format, parseISO, isValid } from 'date-fns';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN!;
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api';

if (!BOT_TOKEN) {
  throw new Error('Не задан BOT_TOKEN в .env');
}

// --- Типы контекста с сессией ---
interface AuthSession {
  step?: 'email' | 'password';
  email?: string;
  cookies?: string[];
}
interface BookingSession {
  step?: 'room' | 'date' | 'time' | 'title';
  roomId?: number;
  date?: string;
  startTime?: string;
  endTime?: string;
}
interface MyContext extends Context {
  session: { auth?: AuthSession; booking?: BookingSession };
}

// --- Инициализация бота и сессии ---
const bot = new Telegraf<MyContext>(BOT_TOKEN);
bot.use(new LocalSession({ database: 'sessions.json' }).middleware());

// --- /start ---
bot.start(ctx =>
  ctx.reply('Привет! Я бот бронирования.\n' +
            'Команды:\n' +
            '/login — войти\n' +
            '/rooms — доступные комнаты\n' +
            '/book — забронировать\n' +
            '/mybookings — мои бронирования\n' +
            '/cancel <ID> — отменить бронь')
);

// --- /login ---
bot.command('login', ctx => {
  ctx.session.auth = { step: 'email' };
  ctx.reply('Введите ваш email для входа:');
});

// --- /rooms ---
bot.command('rooms', async ctx => {
  try {
    // Авторизованный запрос
    const headers: any = {};
    if (ctx.session.auth?.cookies) {
      headers['Cookie'] = ctx.session.auth.cookies.join('; ');
    }
    const res = await fetch(`${API_BASE}/rooms`, { headers });
    const rooms = await res.json();
    if (!rooms.length) return ctx.reply('Нет комнат.');
    ctx.reply(rooms.map((r: any) => `ID ${r.id}: ${r.name} (${r.capacity})`).join('\n'));
  } catch {
    ctx.reply('Ошибка получения комнат.');
  }
});

// --- /book ---
bot.command('book', ctx => {
  ctx.session.booking = { step: 'room' };
  ctx.reply('Введите ID комнаты (покажите /rooms):');
});

// --- /mybookings ---
bot.command('mybookings', async ctx => {
  try {
    const headers: any = {};
    if (ctx.session.auth?.cookies) {
      headers['Cookie'] = ctx.session.auth.cookies.join('; ');
    }
    const res = await fetch(`${API_BASE}/bookings?date=${new Date().toISOString()}&roomId=0`, { headers });
    const all = await res.json();
    const userId = await fetchUserId(ctx);
    const mine = all.filter((b: any) => b.userId === userId);
    if (!mine.length) return ctx.reply('У вас нет броней.');
    ctx.reply(mine.map((b: any) => `ID ${b.id}: ${b.title} в ${b.roomId} c ${new Date(b.startTime).toLocaleString()}`).join('\n\n'));
  } catch {
    ctx.reply('Ошибка загрузки броней.');
  }
});

// --- /cancel ---
bot.command('cancel', async ctx => {
  const parts = ctx.message.text.split(' ');
  const id = Number(parts[1]);
  if (!id) return ctx.reply('Использование: /cancel <ID>');
  try {
    const headers: any = {};
    if (ctx.session.auth?.cookies) {
      headers['Cookie'] = ctx.session.auth.cookies.join('; ');
    }
    const res = await fetch(`${API_BASE}/bookings/${id}`, { method: 'DELETE', headers });
    if (res.status === 204) ctx.reply(`Бронь ${id} отменена`);
    else {
      const err = await res.json();
      ctx.reply(`Ошибка: ${err.error}`);
    }
  } catch {
    ctx.reply('Не удалось отменить.');
  }
});

// --- Обработка текстовых ответов ---
bot.on('text', async ctx => {
  // 1) логин
  if (ctx.session.auth) {
    const a = ctx.session.auth;
    if (a.step === 'email') {
      a.email = ctx.message.text.trim();
      a.step = 'password';
      return ctx.reply('Введите пароль:');
    }
    if (a.step === 'password') {
      const pwd = ctx.message.text.trim();
      try {
        // Получаем CSRF токен
        const csrfRes = await fetch(`${API_BASE}/auth/csrf`);
        const { csrfToken } = await csrfRes.json();
        // Логинимся
        const form = new URLSearchParams();
        form.append('csrfToken', csrfToken);
        form.append('email', a.email!);
        form.append('password', pwd);
        form.append('json', 'true');

        const loginRes = await fetch(`${API_BASE}/auth/callback/credentials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: form.toString(),
        });
        const data = await loginRes.json();
        if (data.error) {
          ctx.reply(`Ошибка входа: ${data.error}`);
        } else {
          // Сохраняем куки
          const setCookie = loginRes.headers.raw()['set-cookie'];
          a.cookies = setCookie;
          ctx.reply('Успешно вошли! Теперь можно бронировать.');
        }
      } catch (e) {
        ctx.reply('Ошибка при входе.');
      }
      delete ctx.session.auth;
      return;
    }
  }

  // 2) бронирование
  const bs = ctx.session.booking;
  if (!bs) return;
  try {
    if (bs.step === 'room') {
      const id = Number(ctx.message.text);
      if (!id) return ctx.reply('Нужен ID.');
      bs.roomId = id; bs.step = 'date';
      return ctx.reply('Дата YYYY-MM-DD');
    }
    if (bs.step === 'date') {
      const d = parseISO(ctx.message.text);
      if (!isValid(d)) return ctx.reply('Неверный формат');
      bs.date = format(d, 'yyyy-MM-dd'); bs.step = 'time';
      return ctx.reply('Время HH:mm-HH:mm');
    }
    if (bs.step === 'time') {
      const [s, e] = ctx.message.text.split('-');
      if (!/^\d{2}:\d{2}$/.test(s) || !/^\d{2}:\d{2}$/.test(e)) {
        return ctx.reply('Неверный формат');
      }
      bs.startTime = s; bs.endTime = e; bs.step = 'title';
      return ctx.reply('Заголовок брони');
    }
    if (bs.step === 'title') {
      const title = ctx.message.text.trim();
      // payload
      const payload = {
        roomId: bs.roomId!, title,
        startTime: `${bs.date}T${bs.startTime}:00.000Z`,
        endTime:   `${bs.date}T${bs.endTime}:00.000Z`,
      };
      // запрос
      const headers: any = { 'Content-Type': 'application/json' };
      if (ctx.session.auth?.cookies) headers['Cookie'] = ctx.session.auth.cookies.join('; ');
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST', headers, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) ctx.reply(`Ошибка: ${data.error}`);
      else ctx.reply(`Забронировано ID ${data.id}`);
      delete ctx.session.booking;
    }
  } catch (e) {
    ctx.reply('Ошибка бронирования.');
    delete ctx.session.booking;
  }
});

// --- Запуск ---
bot.launch();
console.log('Bot started');
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// --- Помощник получения ID пользователя ---
async function fetchUserId(ctx: MyContext): Promise<number> {
  // Можно получить сессию через /api/auth/session
  const headers: any = {};
  if (ctx.session.auth?.cookies) headers['Cookie'] = ctx.session.auth.cookies.join('; ');
  const res = await fetch(`${API_BASE}/auth/session`, { headers });
  const sess = await res.json();
  return sess.user.id;
}
