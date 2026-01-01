import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { PLAN_RULES } from "../shared/planRules";
import { Tier } from "../shared/enums";

const SubscriptionContext = createContext(null);

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);

  if (!ctx) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }

  return ctx;
}

export function SubscriptionProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const ref = doc(db, "users", auth.currentUser.uid);

    const unSub = onSnapshot(ref, (snapshot) => {
      setUserData(snapshot.exists() ? snapshot.data() : null);
      setLoading(false);
    });

    return unSub;
  }, []);

  const tier = userData?.tier ?? Tier.GUEST;
  const effectiveTier = userDoc?.teamId ? Tier.TEAM : tier;
  const capabilities = PLAN_RULES[effectiveTier];
  const usage = userData?.usage ?? { forms: 0, responses: 0 };

  const isGuest = tier === Tier.GUEST;
  const isPaid = tier === Tier.INDIVIDUAL || tier === Tier.TEAM;

  const can = (feature) => {
    return Boolean(capabilities?.[feature]);
  };

  const remaining = (type) => {
    const limitKey = `${type}Limit`;
    const limit = capabilities?.[limitKey];

    if (limit === Infinity) return Infinity;
    return Math.max(limit - (usage[type] ?? 0), 0);
  };

  const value = {
    user: auth.currentUser,
    tier,
    effectiveTier,
    capabilities,
    usage,
    loading,
    isGuest,
    isPaid,
    can,
    remaining,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}
