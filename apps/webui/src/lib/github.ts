import { Octokit } from '@octokit/rest';
import type { TeamMember, Project } from './types';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export async function getOrgMembers(org: string) {
  const { data } = await octokit.orgs.listMembers({ org });
  return data;
}

export async function getOrgTeams(org: string) {
  const { data } = await octokit.teams.list({ org });
  return data;
}

export async function getTeamMembers(org: string, teamSlug: string) {
  const { data } = await octokit.teams.listMembersInOrg({ org, team_slug: teamSlug });
  return data;
}

export async function addMemberToTeam(org: string, teamSlug: string, username: string) {
  await octokit.teams.addOrUpdateMembershipForUserInOrg({
    org,
    team_slug: teamSlug,
    username,
  });
}

export async function removeMemberFromTeam(org: string, teamSlug: string, username: string) {
  await octokit.teams.removeMembershipForUserInOrg({
    org,
    team_slug: teamSlug,
    username,
  });
}

export async function getRepoCollaborators(owner: string, repo: string) {
  const { data } = await octokit.repos.listCollaborators({ owner, repo });
  return data;
}

export async function inviteCollaborator(owner: string, repo: string, username: string, permission: 'admin' | 'write' | 'read') {
  await octokit.repos.addCollaborator({
    owner,
    repo,
    username,
    permission,
  });
}

export async function removeCollaborator(owner: string, repo: string, username: string) {
  await octokit.repos.removeCollaborator({
    owner,
    repo,
    username,
  });
}

export async function getFileContent(owner: string, repo: string, path: string, ref?: string) {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path, ref });
    if ('content' in data) {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    return null;
  } catch {
    return null;
  }
}
