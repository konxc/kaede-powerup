'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import { BarChart3, Users, Shield, BookOpen, Plus, ExternalLink, RefreshCw } from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const runCommand = React.useCallback(
    (command: () => void) => {
      onOpenChange(false);
      command();
    },
    [onOpenChange]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
            <BarChart3 className="mr-2 h-4 w-4 text-primary" />
            <span>Dashboard</span>
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push('/teams'))}>
            <Users className="mr-2 h-4 w-4 text-primary" />
            <span>Teams</span>
            <CommandShortcut>⌘T</CommandShortcut>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push('/roles'))}>
            <Shield className="mr-2 h-4 w-4 text-primary" />
            <span>Roles & Access Matrix</span>
            <CommandShortcut>⌘R</CommandShortcut>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push('/playbook'))}>
            <BookOpen className="mr-2 h-4 w-4 text-primary" />
            <span>Playbook Conventions</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => router.push('/teams'))}>
            <Plus className="mr-2 h-4 w-4 text-emerald-400" />
            <span>Add Team Member</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => window.open('https://kaede-powerup.netlify.app', '_blank'))}>
            <ExternalLink className="mr-2 h-4 w-4 text-blue-400" />
            <span>Open Trello Power-Up Live App</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => window.open('https://konxc.github.io/kaede-powerup', '_blank'))}>
            <ExternalLink className="mr-2 h-4 w-4 text-purple-400" />
            <span>Open KAEDE Documentation</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => alert('OpenKB Steering Sync Triggered!'))}>
            <RefreshCw className="mr-2 h-4 w-4 text-amber-400" />
            <span>Sync OpenKB & OpenCode Steering</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
