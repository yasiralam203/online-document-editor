import express from "express";
import multer from "multer";
import { mergePdf, splitPdf, imageToPdf } from "../controllers/pdf.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

//for imageToPdf
const imageUpload = multer({
    storage: multer.memoryStorage()
});

// route definition ONLY
router.post("/merge", upload.array("files", 15), mergePdf);
router.post("/split", upload.single("file"), splitPdf);
router.post("/image-to-pdf", imageUpload.array("images", 20), imageToPdf);

export default router;
