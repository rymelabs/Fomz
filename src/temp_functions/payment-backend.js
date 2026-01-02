import { HttpsError, onCall } from "firebase-functions/https";
import axios from "axios";

const PAYSTACK_SECRET =
  process.env.PAYSTACK_SECRET || defineSecret("PAYSTACK_SECRET");
const PAYSTACK_BASE = "https://api.paystack.co";

export const initializeTransaction = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login Required");

  try {
    const { total } = request.data;
    const customerEmail = request.auth.token.email;

    const numericTotal = Number(total);
    if (isNaN(numericTotal) || numericTotal <= 0) {
      throw new HttpsError("invalid-argument", `Invalid total amoun: ${total}`);
    }

    const amountInKobo = Math.round(numericTotal * 100);
    if (amountInKobo < 10000) {
      throw new HttpsError(
        "invalid-argument",
        "Minimum amount for transaction is 100 naira"
      );
    }

    const payload = {
      email: customerEmail,
      amount: amountInKobo,
    };

    const { data } = await axios.post(
      `${PAYSTACK_BASE}/transaction/initialize`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${
            process.env.PAYSTACK_SECRET || PAYSTACK_SECRET.value()
          }`,
        },
      }
    );

    return { accessCode: data.data.acces_code, reference: data.data.reference };
  } catch (error) {
    throw new HttpsError("internal", "Could not initialize transaction");
  }
});
