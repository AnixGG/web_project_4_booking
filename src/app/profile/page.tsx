'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

type ProfileData = {
  name: string | null;
  email: string | null;
  telegramId: string | null;
};

type LinkCodeData = {
  code: string;
};

export default function ProfilePage() {
  const { data: session, status: sessionStatus } = useSession();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const [linkCodeData, setLinkCodeData] = useState<LinkCodeData | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (sessionStatus !== 'authenticated') {
      setIsLoadingProfile(false);
      return;
    }

    try {
      setIsLoadingProfile(true);
      const response = await fetch('/api/profile');
      if (!response.ok) {
        throw new Error('Не удалось загрузить данные профиля.');
      }
      const data: ProfileData = await response.json();
      setProfile(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [sessionStatus]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleGenerateCode = async () => {
    setIsGeneratingCode(true);
    try {
      const response = await fetch('/api/telegram/generate-link-code', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Не удалось сгенерировать код. Попробуйте снова.');
      }
      const data: LinkCodeData = await response.json();
      setLinkCodeData(data);
      toast.success('Код для привязки сгенерирован!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  if (sessionStatus === 'loading' || isLoadingProfile) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-80px)]">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="text-center mt-20">
        <p>Пожалуйста, <Link href="/auth/login" className="font-semibold text-blue-600 hover:underline">войдите в систему</Link>, чтобы увидеть ваш профиль.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Ваш профиль</CardTitle>
          <CardDescription>Здесь вы можете управлять настройками вашего аккаунта.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold">Основная информация</h3>
            <p><strong>Имя:</strong> {profile?.name || 'Не указано'}</p>
            <p><strong>Email:</strong> {profile?.email || 'Не указан'}</p>
          </div>
          <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
            <h3 className="font-semibold">Привязка Telegram</h3>
            {profile?.telegramId ? (
              <p className="text-green-600 font-medium">✅ Ваш Telegram аккаунт успешно привязан.</p>
            ) : (
              <div>
                <p className="text-yellow-700 mb-4">⚠️ Ваш Telegram аккаунт еще не привязан.</p>
                <Button onClick={handleGenerateCode} disabled={isGeneratingCode}>
                  {isGeneratingCode ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Сгенерировать код для привязки
                </Button>
                {linkCodeData && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-md animate-in fade-in-50">
                    <p>Отлично! Теперь отправьте нашему боту в Telegram следующую команду:</p>
                    <code className="block bg-gray-200 p-2 my-2 rounded text-center font-mono select-all">
                      /link {linkCodeData.code}
                    </code>
                    <p className="text-xs text-gray-500">Этот код действителен в течение 5 минут.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}