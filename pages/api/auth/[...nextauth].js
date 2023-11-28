import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export default NextAuth({
  providers: [
    CredentialsProvider({
      async authorize(credentials, req) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/checkAdmin`,
          {
            method: 'POST',
            body: JSON.stringify(credentials),
            headers: { 'Content-Type': 'application/json' },
          }
        );
        const user = await res.json();

        if (res.ok && user) {
          return user;
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/',
    signOut: '/',
  },
  session: {
    jwt: true,
  },
});
