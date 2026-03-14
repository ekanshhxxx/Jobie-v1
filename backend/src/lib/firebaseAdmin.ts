import admin from "firebase-admin";
import fs from "fs";
import path from "path";

function loadServiceAccount(): admin.ServiceAccount {
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonEnv) {
    return JSON.parse(jsonEnv) as admin.ServiceAccount;
  }

  const pathEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (pathEnv) {
    const fullPath = path.isAbsolute(pathEnv)
      ? pathEnv
      : path.resolve(__dirname, "../../", pathEnv);
    if (fs.existsSync(fullPath)) {
      return JSON.parse(fs.readFileSync(fullPath, "utf-8")) as admin.ServiceAccount;
    }
  }

  const defaultPath = path.resolve(__dirname, "../../serviceAccountKey.json");
  if (fs.existsSync(defaultPath)) {
    return JSON.parse(fs.readFileSync(defaultPath, "utf-8")) as admin.ServiceAccount;
  }

  throw new Error(
    "Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH, or place serviceAccountKey.json in backend/."
  );
}

if (!admin.apps.length) {
  const serviceAccount = loadServiceAccount();
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export default admin;
