import { HttpsError, onCall } from "firebase-functions/https";
import axios from "axios";
import { setGlobalOptions } from "firebase-functions/v2";

import { getPrice } from "./getPrice";
import { PAYSTACK_BASE, PAYSTACK_SECRET } from "../config/paystackVariables";

setGlobalOptions({ maxInstances: 10 });

export const initializeTransaction = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login Required");

  try {
    const { plan, currency } = request.data;
    const customerEmail = request.auth.token.email;
    const uid = request.auth.uid;

    const price = getPrice(plan, currency);

    const amountInKobo = Math.round(price * 100);

    const payload = {
      email: customerEmail,
      amount: amountInKobo,
      metadata: { uid, plan },
    };

    await db.collection("payments").doc(reference).set({
      uid,
      plan,
      amount: price,
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
            PAYSTACK_SECRET.value() || process.env.PAYSTACK_SECRET
          }`,
        },
      }
    );

    return { accessCode: data.data.acces_code, reference: data.data.reference };
  } catch (error) {
    throw new HttpsError("internal", "Could not initialize transaction");
  }
});
