import { defineSecret } from "firebase-functions/params";

export const PAYSTACK_SECRET =
  process.env.PAYSTACK_SECRET || defineSecret("PAYSTACK_SECRET");

export const PAYSTACK_BASE = "https://api.paystack.co";
