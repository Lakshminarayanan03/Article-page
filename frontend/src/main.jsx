import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDoFRuOkvDTjDiaJMyYuEgpmfHzPZRRVhQ",
  authDomain: "article-page-5d0a3.firebaseapp.com",
  projectId: "article-page-5d0a3",
  storageBucket: "article-page-5d0a3.firebasestorage.app",
  messagingSenderId: "308818484149",
  appId: "1:308818484149:web:cb2f1617f0e9aca03157fc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
