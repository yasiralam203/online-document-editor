# Doc Editor - PDF Tools Web App

A modern, fast, and simple web application for managing PDF files. Built with Node.js/Express on the backend and Vanilla JS/HTML/CSS on the frontend.

## Features
- **Merge PDF**: Combine multiple PDFs into one.
- **Split PDF**: Extract specific pages.
- **Image to PDF**: Convert JPG/PNG to PDF.
- **PDF to Image**: Export PDF pages as images.
- **Compress PDF**: Reduce file size.
- **Add Page Numbers**: Professional page numbering.

## Local Setup

1. **Install Dependencies**:
   Navigate to the `backend` folder and run:
   ```bash
   npm install
   ```

2. **Run the App**:
   From the `backend` folder, run:
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

3. **Open in Browser**:
   Visit `http://localhost:3000`

## Deployment

This app is ready to be published to services like **Render**, **Railway**, or **Heroku**.

- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`
- **Environment Variables**: The app uses `PORT` (defaults to 3000).

## Project Structure
- `/frontend`: All HTML, CSS, and client-side JavaScript.
- `/backend`: Node.js server, API routes, and PDF processing logic.
- `/backend/temp`: Temporary folder for processing files (auto-cleaned every 10 mins).
