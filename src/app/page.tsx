"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2, Clock as ClockIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';

type Room = { id: number; name: string; capacity: number };
type Booking = {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  user: { name: string | null };
};

export default function BookingPage() {
  const { data: session, status } = useSession();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('10:00');

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch('/api/rooms');
        if (!response.ok) throw new Error('Не удалось загрузить комнаты');
        setRooms(await response.json());
      } catch (error: any) { toast.error(error.message); }
    };
    fetchRooms();
  }, []);

  const fetchBookings = useCallback(async () => {
    if (!selectedRoomId || !selectedDate) return;

    setIsLoadingBookings(true);
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    try {
      const response = await fetch(`/api/bookings?roomId=${selectedRoomId}&date=${dateString}`);
      if (!response.ok) throw new Error('Не удалось загрузить бронирования');
      setBookings(await response.json());
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoadingBookings(false);
    }
  }, [selectedRoomId, selectedDate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleBooking = async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      toast.error('Пожалуйста, войдите в систему, чтобы забронировать комнату.');
      return;
    }
    if (!selectedRoomId || !selectedDate || !title || !time) {
      toast.error('Пожалуйста, заполните все поля.');
      return;
    }

    const [hours, minutes] = time.split(':').map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes, 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1);

    const bookingData = {
      title,
      roomId: parseInt(selectedRoomId, 10),
      userId: session.user.id,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    };

    const promise = async() => {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Произошла неизвестная ошибка сервера');
      }
      return response.json();
    };

    toast.promise(promise, {
      loading: 'Проверяем доступность и бронируем...',
      success: (res) => {
        fetchBookings();
        return 'Переговорка успешно забронирована!';
      },
      error: (err: Error) => {
        return err.message;
      },
    });
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="font-sans container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Левая колонка - Форма */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl mb-4">Новое бронирование</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="title" className="block mb-2">Название встречи</Label>
              <Input id="title" placeholder="Ежедневный синк" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mt-2" />
            </div>
            <div>
              <Label className="block mb-2">Комната</Label>
              <Select onValueChange={setSelectedRoomId} value={selectedRoomId}>
                <SelectTrigger className="w-full mt-2"><SelectValue placeholder="Выберите комнату..." /></SelectTrigger>
                <SelectContent className="w-full">
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={String(room.id)}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="block mb-2">Дата</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal mt-2">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPP', { locale: ru }) : <span>Выберите дату</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-screen max-w-sm sm:w-auto p-0">
                    <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="block mb-2">Время</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal mt-2">
                      <ClockIcon className="mr-2 h-4 w-4" />
                      {time}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-2 w-auto">
                    <Input 
                      type="time" 
                      value={time} 
                      onChange={(e) => setTime(e.target.value)} 
                      className="w-full" 
                      autoFocus 
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <Button onClick={handleBooking} className="w-full mt-4">Забронировать</Button>
          </CardContent>
        </Card>

        {/* Правая колонка - Расписание */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl mb-2">Расписание на выбранную дату</CardTitle>
            <CardDescription className="mb-4">
              {selectedDate ? format(selectedDate, 'd MMMM yyyy', { locale: ru }) : 'Выберите дату'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingBookings ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : bookings.length > 0 ? (
              <ul className="space-y-3">
                {bookings.map((booking) => (
                  <li key={booking.id} className="p-3 bg-gray-100 rounded-md">
                    <p className="font-semibold text-base sm:text-lg">{booking.title}</p>
                    <p className="text-sm sm:text-base text-gray-600">
                      {format(new Date(booking.startTime), 'HH:mm')} – {format(new Date(booking.endTime), 'HH:mm')}
                    </p>
                    <p className="text-sm sm:text-base text-gray-500">Кем: {booking.user?.name || 'Пользователь'}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500 h-40 flex items-center justify-center">На выбранную дату бронирований нет.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
