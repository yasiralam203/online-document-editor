# Doc Editor - PDF Tools Web App

A modern, fast, and secure web application for managing PDF files. Built with Node.js/Express on the backend and Vanilla JS/HTML/CSS on the frontend, featuring a responsive, mobile-friendly design.

## ✨ Features
- **Merge PDF**: Combine multiple PDF files into one.
- **Split PDF**: Extract specific pages or a range of pages from a PDF.
- **Image to PDF**: Convert JPG/PNG images into a single PDF document.
- **PDF to Image**: Export PDF pages as separate, high-quality images.
- **Compress PDF**: Reduce file size while maintaining readability.
- **Add Page Numbers**: Add page numbers to PDFs with professional positioning options.

## 🔒 Privacy & Security
- **Local Processing**: No database used. Files are stored only temporarily during processing.
- **Auto Cleanup**: The system automatically cleans up all uploaded and generated files older than 1 hour every 10 minutes to save server space and protect user privacy.

## 🛠 Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (Mobile-Responsive UI with CSS Grid/Flexbox).
- **Backend**: Node.js, Express.js.
- **Key Libraries**: 
  - `pdf-lib`: For core PDF manipulation (Merge, Split, Image-to-PDF, Add Pages).
  - `multer`: For handling file uploads.
  - `pdf-poppler`: For converting PDFs to Images.
  - `ghostscript` (CLI): For compressing PDFs natively.

## 🚀 Local Setup

### Prerequisites
Before running the application, ensure you have the following installed:
1. **Node.js**: Download and install Node.js (v18+) from [nodejs.org](https://nodejs.org/).
2. **Poppler**: Required for the **PDF to Image** functionality.
   - **Windows**: Download [Poppler for Windows](https://github.com/oschwartz10612/poppler-windows/releases/), extract the folder, and add the `Library\bin` or `bin` folder to your system's Environment Variables `PATH`.
   - **macOS**: Run `brew install poppler` in your terminal.
   - **Linux**: Run `sudo apt-get install poppler-utils` in your terminal.
3. **Ghostscript**: Required for the **Compress PDF** functionality.
   - **Windows**: Download and install [Ghostscript](https://ghostscript.com/releases/gsdnld.html) (Make sure the 64-bit version `gswin64c.exe` is in your `PATH` or installed in `C:\Program Files\gs\`).
   - **macOS**: Run `brew install ghostscript` in your terminal.
   - **Linux**: Run `sudo apt-get install ghostscript` in your terminal.

### Step-by-Step Guide

1. **Clone & Navigate into the project**:
   Open a terminal and navigate to the root directory, then into the `backend` folder:
   ```bash
   cd backend
   ```

2. **Install Dependencies**:
   This will install all required Node.js packages:
   ```bash
   npm install
   ```

3. **Run the Server**:
   Start the backend server by running:
   ```bash
   npm start
   ```
   *(For development with auto-reload, you can alternately run `npm run dev`)*

4. **Open the Application**:
   Open your web browser and visit `http://localhost:3000`

## ☁️ Deployment

This app is production-ready for services like **Render**, **Railway**, or **Heroku**.

- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`
- **Environment Variables**: The app leverages `PORT` (defaults to 3000).

## 📁 Project Structure
- `/frontend`: All HTML, CSS, and client-side JavaScript. Served automatically by the Node.js backend as static assets.
- `/backend`: Node.js Express server, API routes, and PDF processing controllers.
- `/backend/temp`: Temporary directory for processing uploads and downloads (auto-cleaned).
