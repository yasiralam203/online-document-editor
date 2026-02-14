import fs from "fs";
import { PDFDocument } from "pdf-lib";

//merge pdfs...
export const mergePdf = async (req, res) => {
    try {
        const mergedPdf = await PDFDocument.create();

        for (const file of req.files) {
            const pdfBytes = fs.readFileSync(file.path);
            const pdfDoc = await PDFDocument.load(pdfBytes);

            const copiedPages = await mergedPdf.copyPages(
                pdfDoc,
                pdfDoc.getPageIndices()
            );

            copiedPages.forEach(page => mergedPdf.addPage(page));
        }

        // Delete uploaded files after merging
        for (const file of req.files) {
            fs.unlinkSync(file.path);
        }


        const mergedPdfBytes = await mergedPdf.save();

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=merged.pdf"
        });

        res.send(Buffer.from(mergedPdfBytes));

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to merge PDFs" });
    }
};


//split pdf
export const splitPdf = async (req, res) => {
    try {
        const file = req.file;

        // read range from user
        const startPage = parseInt(req.body.start);
        const endPage = parseInt(req.body.end);

        const pdfBytes = fs.readFileSync(file.path);
        const pdfDoc = await PDFDocument.load(pdfBytes);

        const totalPages = pdfDoc.getPageCount();

        // validate page range
        if (
            startPage < 1 ||
            endPage > totalPages ||
            startPage > endPage
        ) {
            fs.unlinkSync(file.path);
            return res.status(400).json({
                error: "Invalid page range"
            });
        }

        // convert to zero-based index
        const startIndex = startPage - 1;
        const endIndex = endPage - 1;

        // create new empty PDF
        const newPdf = await PDFDocument.create();

        // select page indices using helper
        const allPages = pdfDoc.getPageIndices();
        const selectedPages = allPages.slice(startIndex, endIndex + 1);

        // copy & add pages
        const copiedPages = await newPdf.copyPages(pdfDoc, selectedPages);
        copiedPages.forEach(page => newPdf.addPage(page));

        // delete original uploaded file
        fs.unlinkSync(file.path);

        // save & send PDF
        const newPdfBytes = await newPdf.save();

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=split.pdf"
        });

        res.send(Buffer.from(newPdfBytes));

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to split PDF" });
    }
};
