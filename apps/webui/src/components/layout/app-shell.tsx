import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MenuIcon, GithubIcon } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/teams', label: 'Teams' },
  { href: '/roles', label: 'Roles' },
  { href: '/playbook', label: 'Playbook' },
] as const;

function NavLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={`text-sm font-medium text-muted-foreground transition-colors hover:text-foreground ${className ?? ''}`}
    >
      {children}
    </Link>
  );
}

function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <MenuIcon className="size-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <nav className="flex flex-col gap-4 mt-8">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href} className="text-lg">
              {item.label}
            </NavLink>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                K
              </div>
              <span className="hidden sm:inline">KAEDE</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.href} href={item.href}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <a href="https://github.com/konxc/kaede-powerup" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon">
                <GithubIcon className="size-4" />
                <span className="sr-only">GitHub</span>
              </Button>
            </a>
            <MobileNav />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
