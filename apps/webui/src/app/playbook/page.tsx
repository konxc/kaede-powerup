'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { GitBranch, Tag, MessageSquare, TestTube, Calendar } from 'lucide-react';

const PLAYBOOK_SECTIONS = [
  {
    id: 'workflow',
    title: 'Sprint Workflow',
    icon: Calendar,
    content: `Product Backlog → Ready for Dev → In Progress → Code Review → UAT/Testing → Done`,
  },
  {
    id: 'dor',
    title: 'Definition of Ready (DoR)',
    content: `User story format, AC requirements, dependency resolution, story points, technical breakdown`,
  },
  {
    id: 'dod',
    title: 'Definition of Done (DoD)',
    content: `Code complete, unit test >70% coverage, code review approved, PR merged, UAT passed, docs updated`,
  },
  {
    id: 'naming',
    title: 'Card Naming Convention',
    content: `<type>: <description> — feat, fix, docs, refactor, test, chore`,
  },
  {
    id: 'branches',
    title: 'Branch Naming',
    icon: GitBranch,
    content: `feature/ISSUE-12-description, bugfix/ISSUE-15-description`,
  },
  {
    id: 'commits',
    title: 'Commit Convention',
    content: `<type>(<scope>): <description> — Conventional Commits`,
  },
  {
    id: 'labels',
    title: 'Label Colors',
    icon: Tag,
    content: `Red (critical), Yellow (medium), Green (low), Blue (docs/research), Purple (internal/admin)`,
  },
  {
    id: 'testing',
    title: 'Testing Strategy',
    icon: TestTube,
    content: `Unit >70%, Feature (critical path), E2E (main flow), Manual UAT (100% AC)`,
  },
  {
    id: 'communication',
    title: 'Communication',
    icon: MessageSquare,
    content: `Daily standup (15min), Sprint Planning (1-2hr), Sprint Review (1hr), Retrospective (1hr)`,
  },
];

const QUICK_REFERENCE = [
  { label: 'Sprint Duration', value: '2 minggu (Scrum)' },
  { label: 'Team Size', value: '5 roles defined' },
  { label: 'Board Lists', value: '6 lists (Backlog → Done)' },
  { label: 'Access Matrix', value: '7 resource categories' },
];

const SOURCE_OF_TRUTH = [
  'GitHub repo sebagai source of truth',
  'OpenKB untuk knowledge base',
  'OpenCode untuk agent config',
];

export default function PlaybookPage() {
  return (
    <div className="container mx-auto px-4">
      <PageHeader
        title="Playbook"
        description="Konvensi dan workflow tim berdasarkan Playbook"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Playbook Sections</CardTitle>
              <p className="text-sm text-muted-foreground">
                Klik section untuk melihat detail
              </p>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {PLAYBOOK_SECTIONS.map((section) => (
                  <AccordionItem key={section.id} value={section.id}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        {section.icon && <section.icon className="size-4 text-muted-foreground" />}
                        {section.title}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                        {section.content}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Reference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {QUICK_REFERENCE.map((item) => (
                <div key={item.label}>
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-sm text-muted-foreground">{item.value}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Source of Truth</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Playbook ini dirancang sebagai rujukan untuk agent yang tim gunakan.
              </p>
              <ul className="space-y-2">
                {SOURCE_OF_TRUTH.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-primary">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
