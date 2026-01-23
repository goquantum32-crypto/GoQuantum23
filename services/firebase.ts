import * as firebaseApp from "firebase/app";
import { getDatabase } from "firebase/database";
import * as firebaseAuth from "firebase/auth";

// Configuração atualizada do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCxsbgeg-CIG2wNOy33TeGHtuycMLEmRrA",
  authDomain: "goquantum-243a6.firebaseapp.com",
  databaseURL: "https://goquantum-243a6-default-rtdb.firebaseio.com",
  projectId: "goquantum-243a6",
  storageBucket: "goquantum-243a6.firebasestorage.app",
  messagingSenderId: "209723251492",
  appId: "1:209723251492:web:a00ef826c651777d7cf1b1"
};

const app = firebaseApp.initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = firebaseAuth.getAuth(app);
export const googleProvider = new firebaseAuth.GoogleAuthProvider();