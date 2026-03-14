// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAQMeZcXLADZcZLdhB2aWH_Db1DIOvVh2g",
  authDomain: "jobie-auth.firebaseapp.com",
  projectId: "jobie-auth",
  storageBucket: "jobie-auth.appspot.com",
  messagingSenderId: "590113480160",
  appId: "1:590113480160:web:40a36cf25d4302c1be9f85",
  measurementId: "G-HQXSC50RV4"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();