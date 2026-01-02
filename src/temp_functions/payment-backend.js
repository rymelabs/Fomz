import { HttpsError, onCall, onRequest } from "firebase-functions/https";
import axios from "axios";
import { PRICING } from "./config/pricing";
import corsLib from "cors";
import admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions";

setGlobalOptions({ maxInstances: 10 });

admin.initializeApp();
const db = admin.firestore();
const cors = corsLib({ origin: true });

const PAYSTACK_SECRET =
  process.env.PAYSTACK_SECRET || defineSecret("PAYSTACK_SECRET");
const PAYSTACK_BASE = "https://api.paystack.co";

function getPrice(plan, currency) {
  const currencyPricing = PRICING[currency];

  if (!currencyPricing) {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  const price = currencyPricing[plan];

  if (!price) {
    throw new Error(`Invalid plan: ${plan}`);
  }

  return price;
}

export const initializeTransaction = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login Required");

  try {
    const { total, plan, currency } = request.data;
    const customerEmail = request.auth.token.email;
    const uid = request.auth.uid;

    const price = getPrice(plan, currency);

    // const numericTotal = Number(total);
    // if (isNaN(numericTotal) || numericTotal <= 0) {
    //   throw new HttpsError("invalid-argument", `Invalid total amoun: ${total}`);
    // }

    const amountInKobo = Math.round(price * 100);
    // if (amountInKobo < 10000) {
    //   throw new HttpsError(
    //     "invalid-argument",
    //     "Minimum amount for transaction is 100 naira"
    //   );
    // }

    const payload = {
      email: customerEmail,
      amount: amountInKobo,
      metadata: { uid, plan },
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

export const paystackWebhook = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const event = req.body;

    if (event.event === "charge.success") {
      const { uid, plan } = event.data.metadata;
      const userRef = db.doc(`users/${uid}`);
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      await userRef.update({
        tier: plan,
        subscriptionStatus: "active",
        subscriptionEnd: new Date(Date.now() + thirtyDays),
      });

      await db.collection("subscriptions").add({
        uid,
        plan,
        amount: event.data.amount / 100,
        currency: event.data.currency,
        provider: "paystack",
        status: "success",
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + thirtyDays),
      });
    }

    res.sendStatus(200);
  });
});
