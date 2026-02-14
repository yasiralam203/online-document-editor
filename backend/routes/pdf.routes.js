import express from "express";
import multer from "multer";
import { mergePdf, splitPdf } from "../controllers/pdf.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// route definition ONLY
router.post("/merge", upload.array("files", 15), mergePdf);
router.post("/split", upload.single("file"), splitPdf);

export default router;
