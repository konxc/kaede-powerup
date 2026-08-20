'use client';

import { useState, useEffect } from 'react';
import { getRoleDefinitions, getAccessMatrix } from '@/lib/playbook';
import type { RoleDefinition, AccessMatrixEntry } from '@/lib/types';

export default function DashboardPage() {
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [accessMatrix, setAccessMatrix] = useState<AccessMatrixEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setRoles(getRoleDefinitions());
    setAccessMatrix(getAccessMatrix());
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview team roles dan access matrix</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-3xl font-bold text-purple-600">{roles.length}</div>
            <div className="text-gray-600">Role Definitions</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-3xl font-bold text-blue-600">{accessMatrix.length}</div>
            <div className="text-gray-600">Access Matrix Entries</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-3xl font-bold text-green-600">7</div>
            <div className="text-gray-600">Resource Categories</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Access Matrix</h2>
            <p className="text-sm text-gray-600">Role → Resource permission mapping</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Playbook</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trello Sprint</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trello Roadmap</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staging</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Production</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Database</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {accessMatrix.map((entry) => {
                  const role = roles.find(r => r.id === entry.role);
                  return (
                    <tr key={entry.role} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{role?.name || entry.role}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPermissionColor(entry.resources.sourceCode)}`}>
                          {entry.resources.sourceCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPermissionColor(entry.resources.playbook)}`}>
                          {entry.resources.playbook}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPermissionColor(entry.resources.trelloSprint)}`}>
                          {entry.resources.trelloSprint}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPermissionColor(entry.resources.trelloRoadmap)}`}>
                          {entry.resources.trelloRoadmap}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPermissionColor(entry.resources.staging)}`}>
                          {entry.resources.staging}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPermissionColor(entry.resources.production)}`}>
                          {entry.resources.production}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPermissionColor(entry.resources.database)}`}>
                          {entry.resources.database}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function getPermissionColor(permission: string): string {
  switch (permission) {
    case 'admin':
      return 'bg-red-100 text-red-800';
    case 'write':
      return 'bg-blue-100 text-blue-800';
    case 'edit':
      return 'bg-blue-100 text-blue-800';
    case 'read':
      return 'bg-green-100 text-green-800';
    case 'comment':
      return 'bg-yellow-100 text-yellow-800';
    case 'view':
      return 'bg-yellow-100 text-yellow-800';
    case 'triage':
      return 'bg-orange-100 text-orange-800';
    case 'none':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
