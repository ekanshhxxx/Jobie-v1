import admin from "firebase-admin";
import fs from "fs";
import path from "path";

function loadServiceAccount(): admin.ServiceAccount | null {
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonEnv) {
    try {
      return JSON.parse(jsonEnv) as admin.ServiceAccount;
    } catch {
      console.error("[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", jsonEnv.slice(0, 60));
      return null;
    }
  }

  const pathEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (pathEnv) {
    const fullPath = path.isAbsolute(pathEnv)
      ? pathEnv
      : path.resolve(__dirname, "../../", pathEnv);
    if (fs.existsSync(fullPath)) {
      try {
        return JSON.parse(fs.readFileSync(fullPath, "utf-8")) as admin.ServiceAccount;
      } catch {
        console.error("[Firebase] Failed to parse service account at path:", fullPath);
        return null;
      }
    }
    console.warn("[Firebase] FIREBASE_SERVICE_ACCOUNT_PATH set but file not found:", fullPath);
  }

  const defaultPath = path.resolve(__dirname, "../../serviceAccountKey.json");
  if (fs.existsSync(defaultPath)) {
    try {
      const sa = JSON.parse(fs.readFileSync(defaultPath, "utf-8")) as admin.ServiceAccount;
      console.log("[Firebase] Loaded serviceAccountKey.json — project:", (sa as unknown as Record<string, string>).project_id);
      return sa;
    } catch {
      console.error("[Firebase] Failed to parse serviceAccountKey.json");
      return null;
    }
  }

  console.warn(
    "[Firebase] No service account found. Firebase OAuth will be disabled.\n" +
    "  Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH,\n" +
    "  or place serviceAccountKey.json in backend/."
  );
  return null;
}

let firebaseReady = false;

if (!admin.apps.length) {
  const serviceAccount = loadServiceAccount();
  if (serviceAccount) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseReady = true;
      console.log("[Firebase] Admin SDK initialized successfully.");
    } catch (err) {
      console.error("[Firebase] Failed to initialize Admin SDK:", err);
    }
  }
}

export { firebaseReady };
export default admin;
