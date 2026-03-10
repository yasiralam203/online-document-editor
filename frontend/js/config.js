// config.js
// This ensures that your app works both locally and on Render.
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocalhost ? "http://localhost:3000" : "https://online-document-editor.onrender.com";
