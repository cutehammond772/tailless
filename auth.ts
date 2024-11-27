import NextAuth from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { cert } from "firebase-admin/app";

import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut, unstable_update: update } = NextAuth({
  ...authConfig,
  adapter: FirestoreAdapter({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_AUTH_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_AUTH_PRIVATE_KEY!.replace(/\\n/gm, "\n"),
    }),
  }),
});
