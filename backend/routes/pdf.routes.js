import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { mergePdf, splitPdf, imageToPdf, pdfToImage, compressPdf, addPageNumber } from "../controllers/pdf.controller.js";

const router = express.Router();

const tempUploadsDir = path.join(process.cwd(), "temp", "uploads");
if (!fs.existsSync(tempUploadsDir)) {
    fs.mkdirSync(tempUploadsDir, { recursive: true });
}

const upload = multer({ dest: tempUploadsDir });

//for imageToPdf
const imageUpload = multer({
    storage: multer.memoryStorage()
});

// route definition ONLY
router.post("/merge", upload.array("files", 15), mergePdf);
router.post("/split", upload.single("file"), splitPdf);
router.post("/image-to-pdf", imageUpload.array("images", 20), imageToPdf);
router.post("/compress", upload.single("file"), compressPdf);
router.post("/pdf-to-image", upload.array("files", 15), pdfToImage);
router.post("/add-page-number", upload.single("file"), addPageNumber);

export default router;
