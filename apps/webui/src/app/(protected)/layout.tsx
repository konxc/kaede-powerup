import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ProtectedShell } from '@/components/layout/protected-shell';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <ProtectedShell
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        githubUsername: (session.user as any).githubUsername,
        role: (session.user as any).role,
      }}
    >
      {children}
    </ProtectedShell>
  );
}
