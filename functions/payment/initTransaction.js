import { HttpsError, onCall } from "firebase-functions/https";
import axios from "axios";
import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";

import { getPrice } from "./getPrice.js";
import { PAYSTACK_BASE, PAYSTACK_SECRET } from "../config/paystackVariables.js";

admin.initializeApp();
const db = admin.firestore();

export const initializeTransaction = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login Required");

  try {
    const { plan, currency } = request.data;
    const customerEmail = request.auth.token.email;
    const uid = request.auth.uid;

    const price = getPrice(plan, currency);
    if (!price)
      throw new HttpsError("invalid-argument", "Invalid plan or currency");

    const amountInSmallestUnit = Math.round(price * 100);

    const reference = `PS_${crypto.randomBytes(8).toString("hex")}`;

    const payload = {
      email: customerEmail,
      amount: amountInSmallestUnit,
      reference,
      metadata: { uid, plan },
    };

    await db
      .collection("payments")
      .doc(reference)
      .set({
        uid,
        plan,
        amount: price / 100,
        currency,
        provider: "paystack",
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
      });

    const { data } = await axios.post(
      `${PAYSTACK_BASE}/transaction/initialize`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${
            PAYSTACK_SECRET || process.env.PAYSTACK_SECRET
          }`,
        },
      }
    );

    return { accessCode: data.data.acces_code, reference: data.data.reference };
  } catch (error) {
    throw new HttpsError("internal", "Could not initialize transaction");
  }
});
