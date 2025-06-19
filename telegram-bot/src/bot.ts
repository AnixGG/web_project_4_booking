import { Telegraf, Context } from 'telegraf';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

if (!BOT_TOKEN) {
  throw new Error('"BOT_TOKEN" is not configured!');
}

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx: Context) => {
  ctx.reply('Привет! Я бот для бронирования переговорок. Введи /rooms, чтобы увидеть список доступных комнат.');
});

bot.command('rooms', async (ctx: Context) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rooms`);
    const rooms: any[] = await response.json();

    if (!rooms || rooms.length === 0) {
      return ctx.reply('Свободных переговорок пока нет.');
    }

    const roomList = rooms
      .map((room) => `— ${room.name} (вместимость: ${room.capacity})`)
      .join('\n');

    ctx.reply(`Вот список доступных переговорок:\n${roomList}`);
  } catch (error) {
    console.error('Ошибка получения комнат:', error);
    ctx.reply('Ой, что-то пошло не так. Не могу получить список комнат.');
  }
});

bot.launch();
console.log('Бот запущен!');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
