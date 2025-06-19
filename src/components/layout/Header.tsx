'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-gray-800">
          BookingApp
        </Link>

        <div className="flex items-center gap-4">
          {status === 'loading' && (
            <Loader2 className="h-6 w-6 animate-spin" />
          )}

          {status === 'unauthenticated' && (
            <Button asChild>
              <Link href="/auth/login">Войти</Link>
            </Button>
          )}

          {status === 'authenticated' && session.user && (
            <>
              <span className="text-sm text-gray-600">
                Привет, {session.user.name}!
              </span>
              {}
              {session.user.role === 'ADMIN' && (
                <Link href="/admin/rooms" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                  Админка
                </Link>
              )}
              <Button variant="outline" onClick={() => signOut()}>
                Выйти
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}