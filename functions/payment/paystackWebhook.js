import { HttpsError, onRequest } from "firebase-functions/https";
import corsLib from "cors";
import admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();
const cors = corsLib({ origin: true });

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
