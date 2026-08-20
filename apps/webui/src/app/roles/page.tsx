'use client';

import { useState, useEffect } from 'react';
import { getRoleDefinitions } from '@/lib/playbook';
import type { RoleDefinition } from '@/lib/types';

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setRoles(getRoleDefinitions());
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
          <p className="text-gray-600">Definisi role dan akses berdasarkan Playbook</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Role List</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    className={`w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedRole?.id === role.id ? 'bg-purple-50 border-l-4 border-purple-600' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">{role.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{role.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedRole ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedRole.name}</h2>
                <p className="text-gray-600 mb-6">{selectedRole.description}</p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Trello Access</h3>
                    <div className="space-y-2">
                      {selectedRole.trelloAccess.map((access, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">{access.resource}</span>
                          <span className="text-xs font-semibold px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                            {access.permission}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">GitHub Access</h3>
                    <div className="space-y-2">
                      {selectedRole.githubAccess.map((access, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">{access.resource}</span>
                          <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {access.permission}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">AI Instructions</h3>
                  <ul className="space-y-2">
                    {selectedRole.aiInstructions.map((instruction, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-purple-600 mt-1">•</span>
                        {instruction}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="text-gray-400 text-4xl mb-4">🔐</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Role</h3>
                <p className="text-gray-600">Pilih role dari daftar untuk melihat detail akses</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
