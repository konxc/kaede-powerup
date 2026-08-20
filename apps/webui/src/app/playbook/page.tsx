'use client';

import { useState } from 'react';

const PLAYBOOK_SECTIONS = [
  {
    id: 'workflow',
    title: 'Sprint Workflow',
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
    content: `Red (critical), Yellow (medium), Green (low), Blue (docs/research), Purple (internal/admin)`,
  },
  {
    id: 'testing',
    title: 'Testing Strategy',
    content: `Unit >70%, Feature (critical path), E2E (main flow), Manual UAT (100% AC)`,
  },
  {
    id: 'communication',
    title: 'Communication',
    content: `Daily standup (15min), Sprint Planning (1-2hr), Sprint Review (1hr), Retrospective (1hr)`,
  },
];

export default function PlaybookPage() {
  const [sections] = useState(PLAYBOOK_SECTIONS);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Playbook</h1>
          <p className="text-gray-600">Konvensi dan workflow tim berdasarkan Playbook</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-purple-50">
                <h2 className="font-semibold text-gray-900">Playbook Sections</h2>
                <p className="text-sm text-gray-600">Klik section untuk melihat detail</p>
              </div>
              <div className="divide-y divide-gray-200">
                {sections.map((section) => (
                  <div key={section.id}>
                    <button
                      onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                      className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{section.title}</div>
                      </div>
                      <span className="text-gray-400">
                        {expandedSection === section.id ? '−' : '+'}
                      </span>
                    </button>
                    {expandedSection === section.id && (
                      <div className="px-6 pb-4">
                        <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{section.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Reference</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Sprint Duration</div>
                  <div className="text-sm text-gray-600">2 minggu (Scrum)</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Team Size</div>
                  <div className="text-sm text-gray-600">5 roles defined</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Board Lists</div>
                  <div className="text-sm text-gray-600">6 lists (Backlog → Done)</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Access Matrix</div>
                  <div className="text-sm text-gray-600">7 resource categories</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Source of Truth</h3>
              <p className="text-sm text-gray-600 mb-4">
                Playbook ini dirancang sebagai rujukan untuk agent yang tim gunakan.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-purple-600">•</span>
                  GitHub repo sebagai source of truth
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-600">•</span>
                  OpenKB untuk knowledge base
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-600">•</span>
                  OpenCode untuk agent config
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
