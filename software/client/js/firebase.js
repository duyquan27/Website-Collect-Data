import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.3/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.8.3/firebase-database.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { app, database };
