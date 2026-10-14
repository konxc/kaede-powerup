import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';

const ADMIN_EMAILS = ['admin@konxc.space', 'konxcid@gmail.com'];
const ADMIN_GITHUB_USERNAMES = ['sandikodev', 'konxc'];

const providers = [
  GitHub({
    clientId: process.env.AUTH_GITHUB_ID,
    clientSecret: process.env.AUTH_GITHUB_SECRET,
    profile(profile) {
      return {
        id: profile.id.toString(),
        name: profile.name || profile.login,
        email: profile.email,
        image: profile.avatar_url,
      };
    },
  }),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: 'jwt' },
  providers,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, profile, account }) {
      const identityToken = token as typeof token & { githubId?: string; githubUsername?: string; role?: string };

      if (user) {
        token.sub = user.id ?? token.sub;
      }

      const profileData = profile && typeof profile === 'object'
        ? profile as { id?: string | number; login?: string }
        : undefined;

      if (profileData?.id) identityToken.githubId = String(profileData.id);
      if (profileData?.login) identityToken.githubUsername = profileData.login;

      if (account?.provider === 'github' && !identityToken.githubId) {
        identityToken.githubId = String(user?.id ?? token.sub ?? '');
      }

      // Check Landlord Super Admin eligibility
      const isEmailAdmin = token.email && ADMIN_EMAILS.includes(token.email.toLowerCase());
      const isUsernameAdmin = identityToken.githubUsername && ADMIN_GITHUB_USERNAMES.includes(identityToken.githubUsername.toLowerCase());
      identityToken.role = isEmailAdmin || isUsernameAdmin ? 'admin' : 'developer';

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const identityToken = token as typeof token & { githubId?: string; githubUsername?: string; role?: string };
        session.user.id = token.sub ?? session.user.id;
        Object.assign(session.user, {
          githubId: identityToken.githubId || '',
          githubUsername: identityToken.githubUsername || '',
          role: identityToken.role || 'developer',
        });
      }
      return session;
    },
  },
});
