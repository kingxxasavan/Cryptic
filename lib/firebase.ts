import type { FirebaseApp } from "firebase/app";

// The Firebase web config is public by design; access is controlled by
// database.rules.json (the "parts" block).
export const firebaseConfig = {
  apiKey: "AIzaSyClGFfM4OL0-D0bZtfExKquORCU-AlmVaY",
  authDomain: "chat-f6735.firebaseapp.com",
  databaseURL: "https://chat-f6735-default-rtdb.firebaseio.com",
  projectId: "chat-f6735",
  storageBucket: "chat-f6735.firebasestorage.app",
  messagingSenderId: "1024241873712",
  appId: "1:1024241873712:web:04ade842c36ad3d6c08ef5",
};

let appPromise: Promise<FirebaseApp> | null = null;

/** Starts Firebase in the browser on first use, so it stays out of the server bundle. */
export function getFirebaseApp(): Promise<FirebaseApp> {
  if (!appPromise) {
    appPromise = import("firebase/app").then(async ({ initializeApp, getApps }) => {
      const app = getApps()[0] ?? initializeApp(firebaseConfig);
      // Local test rig only: ?emulators=1 on localhost.
      if (typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && (new URLSearchParams(location.search).has("emulators") || sessionStorage.getItem("emulators") === "1")) {
        sessionStorage.setItem("emulators", "1");
        const [{ getAuth, connectAuthEmulator }, { getDatabase, connectDatabaseEmulator }] = await Promise.all([import("firebase/auth"), import("firebase/database")]);
        try { connectAuthEmulator(getAuth(app), "http://127.0.0.1:9099", { disableWarnings: true }); connectDatabaseEmulator(getDatabase(app), "127.0.0.1", 9000); } catch { /* already connected */ }
      }
      return app;
    });
  }
  return appPromise;
}
