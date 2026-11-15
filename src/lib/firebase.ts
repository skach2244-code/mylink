import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAjo_pEUhfHSKJEvma5ns4S8gjlUCNROig",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mylink-f7f70.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mylink-f7f70",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mylink-f7f70.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "585064021431",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:585064021431:web:eaee4a20760620d34efc32",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-9M6XPC8JWK",
};

// Initialize Firebase App (Singleton Pattern for Next.js SSR/Hot Reload)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore & Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// Initialize Analytics (Safe for SSR - runs only on client browser when supported)
let analyticsInstance: Analytics | null = null;
export const getFirebaseAnalytics = async (): Promise<Analytics | null> => {
  if (typeof window !== "undefined" && !analyticsInstance) {
    const supported = await isSupported().catch(() => false);
    if (supported) {
      analyticsInstance = getAnalytics(app);
    }
  }
  return analyticsInstance;
};
