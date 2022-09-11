import { initializeApp } from "firebase/app";
import {
  getDatabase,
  onValue,
  ref,
  set,
  update,
  get,
  child,
} from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDqdH62WinFYLG7YBnXPDZgqpl1PxlmlQI",
  authDomain: "doan2-2b14d.firebaseapp.com",
  databaseURL: "https://doan2-2b14d-default-rtdb.firebaseio.com",
  projectId: "doan2-2b14d",
  storageBucket: "doan2-2b14d.appspot.com",
  messagingSenderId: "287768411957",
  appId: "1:287768411957:web:1c64c749d3cd9bb4af567c",
  measurementId: "G-FMGXKQP57H",
};

const firebase = initializeApp(firebaseConfig);
const database = getDatabase(firebase);

export { database, onValue, ref, set, update, get, child };
