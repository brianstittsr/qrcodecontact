import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getToken } from "next-auth/jwt";
import neo4j from 'neo4j-driver';

// Import the getDriver function but also export our own version that uses NEO4J_USER fallback
import { getDriver as baseGetDriver } from '@/lib/neo4j';

// Function to get Neo4j driver with username fallback
const getDriver = () => {
  // Ensure environment variables are set
  const uri = process.env.NEO4J_URI;
  const username = process.env.NEO4J_USERNAME || process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !username || !password) {
    console.error('Neo4j Configuration:', {
      URI: uri ? '***' : 'undefined',
      USERNAME: username ? '***' : 'undefined',
      PASSWORD: password ? '***' : 'undefined',
    });
    throw new Error('Neo4j environment variables are not set. Please check your .env.local file.');
  }

  return neo4j.driver(uri, neo4j.auth.basic(username, password));
};

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uniqueId = user.uniqueId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.uniqueId = token.uniqueId as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If the URL is the base URL or sign-in page, redirect to profile with uniqueId
      if (url === baseUrl || url.startsWith(`${baseUrl}/auth/signin`)) {
        const token = await getToken({ req: { headers: { cookie: url } } });
        if (token?.uniqueId) {
          return `${baseUrl}/profile/${token.uniqueId}`;
        }
      }
      return url;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Please enter both email and password');
        }

        let session;
        try {
          session = getDriver().session();
          // Check for existing user and ensure uniqueId
          const result = await session.run(
            `
            MATCH (u:QRCodeUser {email: $email})
            SET u.uniqueId = CASE 
              WHEN u.uniqueId IS NULL THEN apoc.create.uuid()
              ELSE u.uniqueId
            END
            RETURN u
            `,
            { email: credentials.username }
          );
          
          const userNode = result.records[0]?.get('u');
          const user = userNode?.properties;
          
          if (!user) {
            // Create new user with uniqueId
            const createResult = await session.run(
              `
              CREATE (u:QRCodeUser {
                email: $email,
                uniqueId: apoc.create.uuid(),
                createdAt: datetime(),
                updatedAt: datetime()
              })
              RETURN u.uniqueId as uniqueId, u.email as email, u as user
              `,
              { email: credentials.username }
            );
            
            const newUser = createResult.records[0]?.get('user')?.properties;
            if (!newUser) {
              throw new Error('Failed to create user');
            }
            return {
              id: newUser.uniqueId,
              email: newUser.email,
              uniqueId: newUser.uniqueId,
              name: newUser.name
            };
          }

          if (credentials.password === user.password) { // In production, use proper password hashing
            return {
              id: user.uniqueId,
              email: user.email,
              uniqueId: user.uniqueId,
              name: user.name
            };
          }
          throw new Error('Invalid password');
        } catch (error) {
          if (error instanceof Error) {
            throw error;
          }
          throw new Error('An error occurred during authentication');
        } finally {
          await session?.close();
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uniqueId = user.uniqueId;
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.uniqueId = token.uniqueId as string;
        session.user.id = token.id as string;
        session.user.name = token.name as string;
      }
      return session;
    }
  }
};
