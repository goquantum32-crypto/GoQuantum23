
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

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

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
