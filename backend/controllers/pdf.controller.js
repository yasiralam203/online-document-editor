import fs from "fs";
import { PDFDocument } from "pdf-lib";
import { degrees } from 'pdf-lib';//used for drawImage on pdf
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


//image to pdfs
export const imageToPdf = async (req, res) => {
    try {
        // console.log(
        //   req.files.map(f => ({
        //     name: f.originalname,
        //     type: f.mimetype,
        //     size: f.size
        //   }))
        // );

        // res.status(200).json({ message: "Images received" });

        const pdfDoc = await PDFDocument.create();
        //==================== embed each image ============================
        for(const file of req.files) {
            let image;
            if(file.mimetype === "image/png") {
                // Embed the PNG file buffer into the PDF(for pdfDoc) and return an image object
                image = await pdfDoc.embedPng(file.buffer);
            } else {
                image = await pdfDoc.embedJpg(file.buffer);
            }
            const page = pdfDoc.addPage([image.width, image.height]);//page added to pdfDoc
            //===== draw image on the page============
            page.drawImage (image, {
                x: 0,
                y: 0,
                width: image.width,
                height: image.height
            });
        }
        console.log("All images added to pdf");
        const pdfBytes = await pdfDoc.save(); //gives raw pdf bytes

        res.set({
            "content-type": "application/pdf",
            "content-Disposition": "attachment; filename=image-to-pdf.pdf"//later replace inline with attachment
        });

        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Image to PDF failed" });
    }
};