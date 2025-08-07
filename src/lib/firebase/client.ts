import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDbRYpRkDqKld_wWS5WV1S3E9iFtbE_rCg",
  authDomain: "repli-b4f74.firebaseapp.com",
  projectId: "repli-b4f74",
  storageBucket: "repli-b4f74.firebasestorage.app",
  messagingSenderId: "441210613134",
  appId: "1:441210613134:web:297b96b7a42d58f15648df",
  measurementId: "G-TYEDC3PDTV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app; 