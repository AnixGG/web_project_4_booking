'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';

// Описываем тип для комнаты, чтобы TypeScript нам помогал
type Room = {
  id: number;
  name: string;
  capacity: number;
};

export default function AdminRoomsPage() {
  // Состояние для списка комнат и статусов UI
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Единое состояние для полей формы
  const [newRoom, setNewRoom] = useState({ name: '', capacity: '' });

  // 1. Надёжная функция для загрузки комнат с нашего API
  const fetchRooms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/rooms');
      if (!response.ok) {
        throw new Error('Не удалось получить данные с сервера.');
      }
      const data = await response.json();
      setRooms(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Загружаем комнаты при первом рендере страницы
  useEffect(() => {
    fetchRooms();
  }, []);

  // 2. Исправленная функция для создания новой комнаты
  const handleCreateRoom = async (e: FormEvent) => {
    e.preventDefault(); // Предотвращаем перезагрузку страницы

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoom.name,
          capacity: Number(newRoom.capacity), // Конвертируем вместимость в число
        }),
      });

      if (!response.ok) {
        throw new Error('Не удалось создать комнату.');
      }

      // После успешного создания обновляем список и очищаем форму
      fetchRooms();
      setNewRoom({ name: '', capacity: '' });
    } catch (err: any) {
      alert(err.message); // Показываем ошибку пользователю
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6">
      <h1 className="text-3xl font-bold mb-6">Управление переговорками</h1>
      
      {/* Форма создания комнаты */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Добавить новую переговорку</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateRoom} className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-grow">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                placeholder="Например, 'Сириус'"
                value={newRoom.name}
                onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                required
              />
            </div>
            <div className="w-full sm:w-auto">
              <Label htmlFor="capacity">Вместимость</Label>
              <Input
                id="capacity"
                type="number"
                placeholder="10"
                value={newRoom.capacity}
                onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })}
                required
                min="1"
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto">Создать</Button>
          </form>
        </CardContent>
      </Card>

      {/* Таблица со списком комнат */}
      <Card>
        <CardHeader>
          <CardTitle>Список переговорок</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 3. Отображение состояний загрузки и ошибок */}
          {isLoading && <p>Загрузка...</p>}
          {error && <p className="text-red-500">Ошибка: {error}</p>}
          {!isLoading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead className="text-right">Вместимость</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.length > 0 ? (
                  rooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell>{room.id}</TableCell>
                      <TableCell className="font-medium">{room.name}</TableCell>
                      <TableCell className="text-right">{room.capacity}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      Переговорок пока нет. Создайте первую!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}