// Check if we are running inside the Android/iOS app via Capacitor
const isCapacitor = typeof window.Capacitor !== 'undefined';

// We are on localhost ONLY if the hostname is localhost AND we are not in the native app
const isLocalhost = !isCapacitor && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const API_URL = isLocalhost ? "http://localhost:3000" : "https://online-document-editor-oa5u.onrender.com";
