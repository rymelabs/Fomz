import { getFunctions, httpsCallable } from "firebase/functions";
import PaystackPop from "@paystack/inline-js";

const functions = getFunctions();

async function sendPayment(total) {
  try {
    const initializeTransaction = httpsCallable(
      functions,
      "initializeTransaction"
    );
    const response = await initializeTransaction({ total });
    const { accessCode } = response.data;

    return new Promise((resolve, reject) => {
      const popup = new PaystackPop();
      popup.resumeTransaction(accessCode, {
        onSuccess: () => {
          resolve({ status: "success", message: "Payment successful" });
        },
        onCancel: () => {
          resolve({ status: "fail", message: "Payment cancelled" });
        },
        onError: () => {
          resolve({
            status: "fail",
            message: "An error occurred, Payment cancelled",
          });
        },
      });
    });
  } catch (error) {
    throw new Error("Failed to start payment process");
  }
}

async function verifyPayment(reference) {}

export { sendPayment, verifyPayment };
