import fs from "fs";
import { PDFDocument } from "pdf-lib";
import { degrees } from 'pdf-lib';//used for drawImage on pdf
import path, { format } from "path";//safe file path(windows/linux)
import crypto from "crypto";//generate unique ID
import archiver from "archiver";

import pdfPoppler from "pdf-poppler";
import { arch } from "os";
import { resolve } from "dns";
import { rejects } from "assert";

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





//========================pdfs - to - image ============================================


export const pdfToImage = async (req, res) => {
    try {
        console.log(
          req.files.map(f => ({
            name: f.originalname,
            type: f.mimetype,
            size: f.size
          }))
        );


        const cleanupFolder = (folderPath) => {
        fs.rm(folderPath, { recursive: true, force: true }, (err) => {
            if (err) {
            console.error("Cleanup failed:", err);
            } else {
            console.log("Cleaned up:", folderPath);
            }
        });
        };
        // res.status(200).json({ message: "pdf received" });
        //folder creation for user
        const requestId = crypto.randomUUID();
        const baseDir = path.join(
            process.cwd(),
            "temp",
            "pdf-to-image",
            requestId
        );
        const uploadDir = path.join(baseDir, "uploads");
        const imageDir = path.join(baseDir, "images");

        fs.mkdirSync(uploadDir, {recursive: true});//create folder recusive:true means if folder not present create it
        fs.mkdirSync(imageDir, {recursive: true});

        //move pdf file to new folder
        req.files.forEach((file) => {
            const newPath = path.join(uploadDir, file.originalname);
            fs.renameSync(file.path, newPath);

            console.log("Moved file to:", newPath);
        });

        
        // res.status(200).json({message: "Files recieved and organized" });


        const pdfFiles = fs.readdirSync(uploadDir);
        console.log("PDFs to merge:", pdfFiles);
        //merge logic
        const mergedPdf = await PDFDocument.create();

        for (const fileName of pdfFiles) {
            const filePath = path.join(uploadDir, fileName);
            const pdfBytes = fs.readFileSync(filePath);//convert to binary

            const pdfDoc = await PDFDocument.load(pdfBytes);
            console.log("Loading PDF:", fileName);

            //copy pages
            const copiedPages = await mergedPdf.copyPages(
                pdfDoc,
                pdfDoc.getPageIndices()
            );
            copiedPages.forEach(page => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();
        

        const mergedDir = path.join(baseDir, "merged");
        fs.mkdirSync(mergedDir, {recursive: true});
        const mergedPdfPath = path.join(mergedDir, "merged.pdf");
        fs.writeFileSync(mergedPdfPath, mergedPdfBytes);

        console.log("Merged PDF created at:", mergedPdfPath);
        //merge logic end================//

        // res.status(200).json({message: "merged pdf created successfully"});

        //pdf to image using poppler
        const outputDir = imageDir;
        const options = {
            format: "png",
            out_dir: outputDir,
            out_prefix: "page",
            page: null // null = convert All pages
        };

        await pdfPoppler.convert(mergedPdfPath, options);

        const imageFiles = fs.readdirSync(outputDir);
        console.log("Generated images:", imageFiles);

        //zip images
        const zipPath = path.join(baseDir, "images.zip");//zip path
        const output = fs.createWriteStream(zipPath);
        const archive = archiver("zip", {zlib: {level: 9}});
        archive.pipe(output);
        archive.directory(imageDir, false); //false = dont nest inside another folder
        await archive.finalize();

        //wait until zip is fully written
        await new Promise((resolve, reject) => {
            output.on("close", resolve);
            archive.on("error", reject);
        });



        res.set({
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=pdf-images.zip"
        });
        res.sendFile(zipPath);

        // cleanup after delay (allows multiple downloads)
        setTimeout(() => {
            cleanupFolder(baseDir);
        }, 2 * 60 * 1000);


    } catch (error) {
        console.error("PDF to Image error:", error);
        res.status(500).json({ error: "PDF to Image failed" });
    }
};
