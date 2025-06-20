'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { data: session, status } = useSession();

  const router = useRouter();
  const handleSignOut = async () => {
    // отмена автоматический редирект
    await signOut({ redirect: false });
    router.push('/');
  };

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
              {session.user.role === 'ADMIN' && (
                <Link
                  href="/admin/rooms"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Админ
                </Link>
              )}

              <Button variant="ghost" size="sm" asChild>
                <Link href="/profile">Профиль</Link>
              </Button>

              <Button variant="outline" onClick={handleSignOut}>
                Выйти
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
