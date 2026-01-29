import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                // Check for Admin Override from .env
                const adminEmail = process.env.ADMIN_EMAIL;
                const adminPassword = process.env.ADMIN_PASSWORD;

                if (adminEmail && adminPassword &&
                    credentials.email === adminEmail &&
                    credentials.password === adminPassword) {

                    // Upsert admin user in DB
                    let adminUser = await prisma.user.findUnique({
                        where: { email: adminEmail }
                    });

                    if (!adminUser) {
                        const { hash } = await import('bcryptjs');
                        const hashedPassword = await hash(adminPassword, 12);
                        adminUser = await prisma.user.create({
                            data: {
                                email: adminEmail,
                                password: hashedPassword,
                                role: 'ADMIN',
                                name: 'System Admin',
                                emailVerified: new Date(),
                            }
                        });
                    } else if (adminUser.role !== 'ADMIN') {
                        adminUser = await prisma.user.update({
                            where: { email: adminEmail },
                            data: { role: 'ADMIN', emailVerified: new Date() }
                        });
                    }

                    return {
                        id: adminUser.id,
                        email: adminUser.email,
                        name: adminUser.name,
                        image: adminUser.image,
                        role: adminUser.role,
                    }
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                })

                if (!user || !user.password) {
                    throw new Error("No user found");
                }

                const isPasswordValid = await compare(credentials.password, user.password)

                if (!isPasswordValid) {
                    throw new Error("Invalid password");
                }

                // Check if email is verified
                if (!user.emailVerified) {
                    throw new Error("Email not verified");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    role: user.role,
                }
            }
        })
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            // Allow all sign-ins (both credentials and OAuth)
            if (account?.provider === "google") {
                // For Google OAuth, ensure user exists in database
                try {
                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email! }
                    });

                    if (!existingUser) {
                        // Create new user from Google OAuth
                        await prisma.user.create({
                            data: {
                                email: user.email!,
                                name: user.name || "",
                                image: user.image,
                                emailVerified: new Date(),
                                password: null, // Google users don't have password
                                role: "USER",
                            }
                        });
                    }
                    return true;
                } catch (error) {
                    console.error("Error creating Google user:", error);
                    return false;
                }
            }
            return true;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
            }
            return session
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
            }

            // For Google OAuth, fetch user role from database
            if (account?.provider === "google" && token.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: token.email }
                });
                if (dbUser) {
                    token.id = dbUser.id;
                    token.role = dbUser.role;
                }
            }

            return token;
        }
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
}

