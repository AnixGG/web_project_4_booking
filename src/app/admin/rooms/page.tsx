'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Trash2, Edit, X } from 'lucide-react';

type Room = {
  id: number;
  name: string;
  capacity: number;
};

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRoom, setNewRoom] = useState({ name: '', capacity: '' });
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

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

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateRoom = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoom.name,
          capacity: Number(newRoom.capacity),
        }),
      });

      if (!response.ok) {
        throw new Error('Не удалось создать комнату.');
      }

      fetchRooms();
      setNewRoom({ name: '', capacity: '' });
    } catch (err: any) {
      alert(err.message);
    }
  };
  
//   const handleCreateRoom = async (e: FormEvent) => {
//     e.preventDefault();
//     if (!newRoom.name.trim() || !newRoom.capacity.trim()) {
//       toast.error('Пожалуйста, заполните все поля.');
//       return;
//     }
//     try {
//       const response = await fetch('/api/rooms', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           name: newRoom.name,
//           capacity: Number(newRoom.capacity),
//         }),
//       });

//       if (!response.ok) {
//         throw new Error('Не удалось создать комнату.');
//       }

//       fetchRooms();
//       setNewRoom({ name: '', capacity: '' });
//       toast.success('Комната успешно создана.');
//     } catch (err: any) {
//       toast.error(err.message);
//     }
//   };


    const handleUpdateRoom = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingRoom) return;
        if (!newRoom.name.trim() || !newRoom.capacity.trim()) {
        toast.error('Пожалуйста, заполните все поля.');
        return;
        }
        try {
        const response = await fetch(`/api/rooms/${editingRoom.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            name: newRoom.name,
            capacity: Number(newRoom.capacity),
            }),
        });

        if (!response.ok) {
            throw new Error('Не удалось обновить комнату.');
        }

        fetchRooms();
        setNewRoom({ name: '', capacity: '' });
        setEditingRoom(null);
        toast.success('Комната успешно обновлена.');
        } catch (err: any) {
        toast.error(err.message);
        }
    };

    const handleCancelEdit = () => {
        setEditingRoom(null);
        setNewRoom({ name: '', capacity: '' });
    };


  const handleDeleteRoom = (roomId: number) => {
        toast.warning(
            `Вы уверены, что хотите удалить комнату ID: ${roomId}?`,
            {
                action: {
                    label: "Да, удалить",
                    onClick: async () => {
                        const promise = fetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
                        toast.promise(promise, {
                            loading: 'Удаляем комнату...',
                            success: () => {
                                fetchRooms();
                                return 'Комната успешно удалена!';
                            },
                            error: 'Ошибка при удалении',
                        });
                    },
                },
                cancel: {
                    label: "Отмена",
                    onClick: () => {},
                },
            }
        );
    };
    
    const handleEditRoom = (room: Room) => {
        setEditingRoom(room);
        setNewRoom({ name: room.name, capacity: String(room.capacity) });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderTableContent = () => {
    if (isLoading) {
      return <p className="text-center py-4">Загрузка...</p>;
    }

    if (error) {
      return <p className="text-red-500 text-center py-4">Ошибка: {error}</p>;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Название</TableHead>
            <TableHead>Вместимость</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rooms.length > 0 ? (
            rooms.map((room) => (
              <TableRow key={room.id}>
                <TableCell>{room.id}</TableCell>
                <TableCell className="font-medium">{room.name}</TableCell>
                <TableCell>{room.capacity}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEditRoom(room)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteRoom(room.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                Переговорок пока нет. Создайте первую!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6">
      <h1 className="text-3xl font-bold mb-6">Управление переговорками</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>
            {editingRoom ? `Редактировать комнату ID: ${editingRoom.id}` : 'Создать новую комнату'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={editingRoom ? handleUpdateRoom : handleCreateRoom} className="flex flex-col sm:flex-row sm:items-end gap-4">
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
            <Button type="submit"> {editingRoom ? 'Обновить' : 'Создать'} </Button>
            {editingRoom && (
              <Button variant="secondary" type="button" onClick={handleCancelEdit} className="flex items-center gap-1">
              <X className="h-4 w-4" /> Отмена
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список переговорок</CardTitle>
        </CardHeader>
        <CardContent>
          {renderTableContent()}
        </CardContent>
      </Card>
    </div>
  );
}