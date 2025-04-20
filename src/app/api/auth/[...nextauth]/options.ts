import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnects";
import UserModel from "@/model/User";

// use next-auth to authenticate users with credentials
export const authOptions: NextAuthOptions = {
    // Configure one or more authentication providers
    providers: [
        // Credentials provider for email and password authentication
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            //   authorize function is called when user submits the form
            async authorize(credentials: any): Promise<any> {
                await dbConnect();
                try {
                    //   check if credentials are provided
                    const user = await UserModel.findOne({
                        $or: [
                            { email: credentials.identifier },
                            { username: credentials.identifier },
                        ],
                    });
                    //   if user not found then throw error
                    if (!user) {
                        throw new Error("No user found with this email");
                    }
                    //   if uset is not verified then throw error
                    if (!user.isVerified) {
                        throw new Error("Please verify your account before logging in");
                    }
                    //   if user is found then check if password is correct
                    const isPasswordCorrect = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );
                    //   if password is correct then return user else throw error
                    if (isPasswordCorrect) {
                        return user;
                    } else {
                        throw new Error("Incorrect password");
                    }
                } catch (err: any) {
                    throw new Error(err);
                }
            },
        }),
    ],

    // callbacks are used to customize the behavior of next-auth
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                // If user is authenticated, add user properties to the token object
                token._id = user._id?.toString(); // Convert ObjectId to string
                token.isVerified = user.isVerified;
                token.isAcceptingMessages = user.isAcceptingMessages;
                token.username = user.username;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                // If token is available, add token properties to the session object
                session.user._id = token._id;
                session.user.isVerified = token.isVerified;
                session.user.isAcceptingMessages = token.isAcceptingMessages;
                session.user.username = token.username;
            }
            return session;
        },
    },

    // session is used to configure the session behavior
    session: {
        // Use JSON Web Tokens for session instead of database sessions
        strategy: "jwt",
    },

    // secret is used to encrypt the session token
    secret: process.env.NEXTAUTH_SECRET,

    // pages is used to configure the pages for next-auth
    pages: {
        signIn: "/sign-in",
    },
};