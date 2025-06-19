"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const node_fetch_1 = __importDefault(require("node-fetch"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const BOT_TOKEN = process.env.BOT_TOKEN;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
if (!BOT_TOKEN) {
    throw new Error('"BOT_TOKEN" is not configured!');
}
const bot = new telegraf_1.Telegraf(BOT_TOKEN);
bot.start((ctx) => {
    ctx.reply('Привет! Я бот для бронирования переговорок. Введи /rooms, чтобы увидеть список доступных комнат.');
});
bot.command('rooms', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield (0, node_fetch_1.default)(`${API_BASE_URL}/rooms`);
        const rooms = yield response.json();
        if (!rooms || rooms.length === 0) {
            return ctx.reply('Свободных переговорок пока нет.');
        }
        const roomList = rooms
            .map((room) => `— ${room.name} (вместимость: ${room.capacity})`)
            .join('\n');
        ctx.reply(`Вот список доступных переговорок:\n${roomList}`);
    }
    catch (error) {
        console.error('Ошибка получения комнат:', error);
        ctx.reply('Ой, что-то пошло не так. Не могу получить список комнат.');
    }
}));
bot.launch();
console.log('Бот запущен!');
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
