import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, Shield, BookOpen } from 'lucide-react';

const FEATURES = [
  {
    href: '/dashboard',
    icon: BarChart3,
    title: 'Dashboard',
    description: 'Overview tim, project, dan access matrix',
  },
  {
    href: '/teams',
    icon: Users,
    title: 'Teams',
    description: 'Kelola anggota tim dan role assignments',
  },
  {
    href: '/roles',
    icon: Shield,
    title: 'Roles',
    description: 'Definisi role dan permission matrix',
  },
  {
    href: '/playbook',
    icon: BookOpen,
    title: 'Playbook',
    description: 'Konvensi dan workflow tim',
  },
] as const;

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground">
          KAEDE Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Team & Role Management berdasarkan OpenKB/Playbook steering.
          Kelola akses GitHub, Trello, dan AI Agent untuk tim Anda.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
        {FEATURES.map((feature) => (
          <Link key={feature.href} href={feature.href}>
            <Card className="h-full border border-border/60 bg-card/60 backdrop-blur transition-all hover:bg-accent/40 hover:border-primary/50 cursor-pointer shadow-md hover:shadow-lg">
              <CardHeader>
                <div className="mb-2 text-primary">
                  <feature.icon className="size-8" />
                </div>
                <CardTitle className="text-lg text-foreground font-semibold">{feature.title}</CardTitle>
                <CardDescription className="text-muted-foreground">{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-16 text-center">
        <p className="text-sm text-muted-foreground">
          Powered by{' '}
          <a
            href="https://kaede-powerup.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            KAEDE
          </a>{' '}
          — Koneksi Automated Environment DE
        </p>
      </div>
    </div>
  );
}
