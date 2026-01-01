import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const SubscriptionContext = createContext(null);

export function useSubscription() {
  return useContext(SubscriptionContext);
}

export function SubscriptionProvider({ children }) {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const ref = doc(db, "users", auth.currentUser.uid);

    const unSub = onSnapshot(ref, (snapshot) => {
      setUserData(snapshot.data());
    });

    return unSub;
  }, []);

  return (
    <SubscriptionContext.Provider value={userData}>
      {children}
    </SubscriptionContext.Provider>
  );
}
