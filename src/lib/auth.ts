/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";

export const sessionTokenCookieName = "next-auth.session-token-sarpongoy-admin";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  cookies: {
    sessionToken: {
      name: sessionTokenCookieName,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "email" },
        password: { label: "Password", type: "password", placeholder: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        try {
          if (!process.env.NEXT_PUBLIC_BACKEND_API_URL) {
            throw new Error("Backend API URL is not configured");
          }

          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          );

          const response = await res.json();

          if (!res.ok) {
            throw new Error(response?.message || "Login failed");
          }

          const user = response.data?.user;
          if (!user) throw new Error("User data not found");

          if (user.role !== "admin") {
            throw new Error("Only admin users can access this dashboard");
          }

          const accessToken = response.data?.accessToken || null;

          return {
            id: user._id,
            name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
            email: user.email,
            phoneNumber: user.phoneNumber || null,
            role: user.role,
            profileImage: user.profilePicture || null,
            accessToken,
          };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Authentication failed";
          throw new Error(message);
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.phoneNumber = user.phoneNumber;
        token.role = user.role;
        token.profileImage = user.profileImage;
        token.accessToken = user.accessToken;
      }
      return token;
    },

    async session({ session, token }: { session: any; token: JWT }) {
      session.user = {
        id: token.id,
        name: token.name,
        email: token.email,
        phoneNumber: token.phoneNumber,
        role: token.role,
        profileImage: token.profileImage,
        accessToken: token.accessToken,
      };
      return session;
    },
  },
};
