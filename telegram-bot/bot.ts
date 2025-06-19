import { Telegraf } from 'telegraf';
    import fetch from 'node-fetch'; // Установите, если нужно: npm install node-fetch@2

    
    const BOT_TOKEN = '7389803693:AAFNRN41uGwbjlimqS63ChlsquEMfMRJx-0';
    if (!BOT_TOKEN || BOT_TOKEN === '7389803693:AAFNRN41uGwbjlimqS63ChlsquEMfMRJx-0') {
      throw new Error('"BOT_TOKEN" is not configured!');
    }

    // API нашего основного приложения
    const API_BASE_URL = 'http://localhost:3000/api';

    const bot = new Telegraf(BOT_TOKEN);

    bot.start((ctx) => {
      ctx.reply('Привет! Я бот для бронирования переговорок. Введи /rooms, чтобы увидеть список доступных комнат.');
    });

    bot.command('rooms', async (ctx) => {
      try {
        // Бот обращается к API нашего Next.js приложения
        const response = await fetch(`${API_BASE_URL}/rooms`);
        const rooms: any[] = await response.json();

        if (!rooms || rooms.length === 0) {
          return ctx.reply('Свободных переговорок пока нет.');
        }

        const roomList = rooms.map(room => `— ${room.name} (вместимость: ${room.capacity})`).join('\n');
        ctx.reply(`Вот список доступных переговорок:\n${roomList}`);

      } catch (error) {
        console.error('Failed to fetch rooms for bot:', error);
        ctx.reply('Ой, что-то пошло не так. Не могу получить список комнат.');
      }
    });

    bot.launch();
    console.log('Бот запущен!');

  
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));