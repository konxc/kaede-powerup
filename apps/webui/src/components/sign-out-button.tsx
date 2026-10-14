'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function SignOutButton({ label }: { label: string }) {
  return (
    <Button type="button" variant="outline" onClick={() => void signOut({ redirectTo: '/' })}>
      {label}
    </Button>
  );
}