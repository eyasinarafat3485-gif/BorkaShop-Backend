import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/borkashop";
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || "borkashop_better_auth_secret_key_32_chars_long_2026";
const BETTER_AUTH_URL =
  process.env.BETTER_AUTH_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://borkashop-backend.onrender.com"
    : `http://localhost:${process.env.PORT || 5000}`);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// MongoClient instance
export const mongoClient = new MongoClient(MONGODB_URI);
export const db = mongoClient.db("borkashop");

export const auth = betterAuth({
  baseURL: BETTER_AUTH_URL,
  secret: BETTER_AUTH_SECRET,
  trustedOrigins: [
    CLIENT_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
  database: mongodbAdapter(db, {
    client: mongoClient,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true once SMTP is configured
    minPasswordLength: 6,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false, // Prevents regular user from elevating themselves to admin
      },
      phone: {
        type: "string",
        required: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
});
