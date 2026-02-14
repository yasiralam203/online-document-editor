import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pdfRoutes from "./routes/pdf.routes.js";

const app = express();
const port = 3000;

/* 🔹 ES module dirname fix */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


//middleware
app.use(express.json());

/* ✅ SERVE FRONTEND CORRECTLY */
app.use(express.static(path.join(__dirname, "..", "frontend")));


// connect PDF routes API routes
app.use("/pdf", pdfRoutes);

app.get("/", (req, res) => {
    res.send("Hello from ES6 backend 🚀");
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


// import express from "express";
// import multer from "multer";
// import fs from "fs";
// import { PDFDocument } from "pdf-lib";


// const app = express();
// const port = 3000;

// app.use(express.json());//backend now understand json
// const upload = multer({dest: "uploads/"});

// app.get("/", (req, res) => {
//     res.send("Hello from ES6 backend 🚀");
// });

// app.get("/test", (req, res) => {
//     res.json({
//         success: true,
//         message: "My first API is working 🎉"
//     });
// });

// app.post("/echo", (req, res) => {
//      res.json({
//         youSent: req.body
//      });
// });

// app.post("/upload-multiple", upload.array("files", 15), (req, res) => {
//     // console.log(req.file);
//     const fileNames = req.files.map(file => file.originalname);
//     res.json({
//         message: "File uploaded successfully",
//         fileName: fileNames
//     });
// });


// //merge
// app.post("/merge", upload.array("files", 15), async (req, res) => {
//     try {
//         const mergedPdf = await PDFDocument.create();

//         for (const file of req.files) {
//             const pdfBytes = fs.readFileSync(file.path);
//             const pdf = await PDFDocument.load(pdfBytes);

//             const copiedPages = await mergedPdf.copyPages(
//                 pdf,
//                 pdf.getPageIndices()
//             );

//             copiedPages.forEach(page => mergedPdf.addPage(page));
//         }

//         const mergedPdfBytes = await mergedPdf.save();

//         res.set({
//             "Content-Type": "application/pdf",
//             "Content-Disposition": "attachment; filename=merged.pdf"
//         });

//         res.send(Buffer.from(mergedPdfBytes));
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: "Failed to merge PDFs" });
//     }
// });


// app.listen(port, () => {
//     console.log("Server running at http://localhost:3000");
// });