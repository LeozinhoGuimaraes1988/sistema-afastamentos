import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyD-sYVA-o5AO-VpJPM_jvOLK5qmaIzDyyA',
  authDomain: 'gestaoafastamentos.firebaseapp.com',
  projectId: 'gestaoafastamentos',
  storageBucket: 'gestaoafastamentos.appspot.com',
  messagingSenderId: '659167029343',
  appId: '1:659167029343:web:6cac0a85279d270edd13ea',
  measurementId: 'G-XST36V402C',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const db = getFirestore(app);

export { db };
