import type { FirebaseApp } from "firebase/app";

// firebase web config is public by design, access is controlled by database.rules.json
export const firebaseConfig = {
  apiKey: "AIzaSyClGFfM4OL0-D0bZtfExKquORCU-AlmVaY",
  authDomain: "chat-f6735.firebaseapp.com",
  databaseURL: "https://chat-f6735-default-rtdb.firebaseio.com",
  projectId: "chat-f6735",
  storageBucket: "chat-f6735.firebasestorage.app",
  messagingSenderId: "1024241873712",
  appId: "1:1024241873712:web:04ade842c36ad3d6c08ef5",
  measurementId: "G-7YJVG2TDWQ",
};

let appPromise: Promise<FirebaseApp> | null = null;

/** lazily loads and starts firebase in the browser so it stays out of the server bundle */
export function getFirebaseApp(): Promise<FirebaseApp> {
  if (!appPromise) {
    appPromise = import("firebase/app").then(({ initializeApp, getApps }) => getApps()[0] ?? initializeApp(firebaseConfig));
    appPromise.then(async (app) => {
      const { getAnalytics, isSupported } = await import("firebase/analytics");
      if (await isSupported()) getAnalytics(app);
    }).catch(() => {});
  }
  return appPromise;
}
