import fs from "fs";
import path from "path"; // safe file paths (Windows / Linux)
import crypto from "crypto"; // generate unique request IDs
import archiver from "archiver";
import { execFile } from "child_process";
import util from "util";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import pdfPoppler from "pdf-poppler";//for pdf to image

const execFilePromise = util.promisify(execFile);

/*
====================================================
MERGE PDF
====================================================
- No request ID needed
- Files are isolated by multer
- Files are deleted immediately after use
*/
export const mergePdf = async (req, res) => {
    console.log(`[${req.requestId}] Processing mergePdf...`);
    // IMPROVEMENT: basic validation
    if (!req.files || req.files.length < 2) {
        return res.status(400).json({ error: "At least 2 PDF files required" });
    }

    try {
        const mergedPdf = await PDFDocument.create();

        for (const file of req.files) {
            const pdfBytes = fs.readFileSync(file.path); // read uploaded file
            const pdfDoc = await PDFDocument.load(pdfBytes);

            const copiedPages = await mergedPdf.copyPages(
                pdfDoc,
                pdfDoc.getPageIndices()
            );

            copiedPages.forEach(page => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=merged.pdf"
        });

        res.send(Buffer.from(mergedPdfBytes));

    } catch (error) {
        console.error("Merge PDF error:", error);
        res.status(500).json({ error: "Failed to merge PDFs" });

    } finally {
        // IMPROVEMENT: ensure cleanup happens even if error occurs
        req.files?.forEach(file => {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        });
    }
};


/*
====================================================
SPLIT PDF
====================================================
- No request ID needed
- Single file operation
- File deleted immediately
*/
export const splitPdf = async (req, res) => {
    console.log(`[${req.requestId}] Processing splitPdf...`);
    const file = req.file;

    // IMPROVEMENT: input validation
    if (!file || !req.body.start || !req.body.end) {
        return res.status(400).json({ error: "Missing file or page range" });
    }

    try {
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
            return res.status(400).json({ error: "Invalid page range" });
        }

        // convert to zero-based index
        const startIndex = startPage - 1;
        const endIndex = endPage - 1;

        // create new empty PDF
        const newPdf = await PDFDocument.create();

        // get all pages and slice required range
        const selectedPages = pdfDoc
            .getPageIndices()
            .slice(startIndex, endIndex + 1);

        // copy & add pages
        const copiedPages = await newPdf.copyPages(pdfDoc, selectedPages);
        copiedPages.forEach(page => newPdf.addPage(page));

        const newPdfBytes = await newPdf.save();

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=split.pdf"
        });

        res.send(Buffer.from(newPdfBytes));

    } catch (error) {
        console.error("Split PDF error:", error);
        res.status(500).json({ error: "Failed to split PDF" });

    } finally {
        // IMPROVEMENT: guaranteed cleanup
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
    }
};


/*
====================================================
IMAGE TO PDF
====================================================
- Uses memory storage (file.buffer)
- No filesystem usage
- No request ID required
*/
export const imageToPdf = async (req, res) => {
    console.log(`[${req.requestId}] Processing imageToPdf...`);
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No images uploaded" });
        }

        const pdfDoc = await PDFDocument.create();

        //==================== embed each image ============================
        for (const file of req.files) {

            // IMPROVEMENT: allow images only
            if (!file.mimetype.startsWith("image/")) continue;

            let image;
            if (file.mimetype === "image/png") {
                image = await pdfDoc.embedPng(file.buffer);
            } else {
                image = await pdfDoc.embedJpg(file.buffer);
            }

            // create page same size as image
            const page = pdfDoc.addPage([image.width, image.height]);

            //===== draw image on the page ============
            page.drawImage(image, {
                x: 0,
                y: 0,
                width: image.width,
                height: image.height
            });
        }

        const pdfBytes = await pdfDoc.save();

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=image-to-pdf.pdf"
        });

        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error("Image to PDF error:", error);
        res.status(500).json({ error: "Image to PDF failed" });
    }
};


/*
====================================================
PDF TO IMAGE
====================================================
- Request ID is REQUIRED
- Creates temp folders
- Multiple users supported simultaneously
*/

// helper function (kept outside controller)
// WHY: reusable + cleaner
const cleanupFolder = (folderPath) => {
    fs.rm(folderPath, { recursive: true, force: true }, (err) => {
        if (err) console.error("Cleanup failed:", err);
        else console.log("Cleaned up:", folderPath);
    });
};

export const pdfToImage = async (req, res) => {
    console.log(`[${req.requestId}] Processing pdfToImage...`);
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No PDF uploaded" });
        }

        // IMPROVEMENT: allow only PDFs
        req.files.forEach(file => {
            if (file.mimetype !== "application/pdf") {
                throw new Error("Only PDF files allowed");
            }
        });

        // ===== UNIQUE ID FOR EACH REQUEST (CRITICAL) =====
        const requestId = req.requestId;

        const baseDir = path.join(
            process.cwd(),
            "temp",
            "pdf-to-image",
            requestId
        );

        const uploadDir = path.join(baseDir, "uploads");
        const imageDir = path.join(baseDir, "images");

        fs.mkdirSync(uploadDir, { recursive: true });
        fs.mkdirSync(imageDir, { recursive: true });

        // move uploaded pdfs into request folder
        req.files.forEach(file => {
            const newPath = path.join(uploadDir, file.originalname);
            fs.renameSync(file.path, newPath);
        });

        // ================= MERGE PDFs =================
        const mergedPdf = await PDFDocument.create();
        const pdfFiles = fs.readdirSync(uploadDir);

        for (const fileName of pdfFiles) {
            const filePath = path.join(uploadDir, fileName);
            const pdfBytes = fs.readFileSync(filePath);
            const pdfDoc = await PDFDocument.load(pdfBytes);

            const copiedPages = await mergedPdf.copyPages(
                pdfDoc,
                pdfDoc.getPageIndices()
            );

            copiedPages.forEach(page => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();

        const mergedDir = path.join(baseDir, "merged");
        fs.mkdirSync(mergedDir, { recursive: true });

        const mergedPdfPath = path.join(mergedDir, "merged.pdf");
        fs.writeFileSync(mergedPdfPath, mergedPdfBytes);

        // ================= PDF → IMAGE =================
        await pdfPoppler.convert(mergedPdfPath, {
            format: "png",
            out_dir: imageDir,
            out_prefix: "page",
            page: null // null = convert all pages
        });

        // ================= ZIP IMAGES =================
        const zipPath = path.join(baseDir, "images.zip");
        const output = fs.createWriteStream(zipPath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        archive.pipe(output);
        archive.directory(imageDir, false);
        await archive.finalize();

        await new Promise((resolve, reject) => {
            output.on("close", resolve);
            archive.on("error", reject);
        });

        res.set({
            "Content-Type": "application/zip",
            "Content-Disposition": "attachment; filename=pdf-images.zip"
        });

        // IMPROVEMENT: cleanup even if user disconnects
        res.sendFile(zipPath, () => {
            setTimeout(() => cleanupFolder(baseDir), 2 * 60 * 1000);
        });

    } catch (error) {
        console.error("PDF to Image error:", error);
        res.status(500).json({ error: "PDF to Image failed" });
    }
};





// import fs from "fs";
// import { PDFDocument } from "pdf-lib";
// import { degrees } from 'pdf-lib';//used for drawImage on pdf
// import path, { format } from "path";//safe file path(windows/linux)
// import crypto from "crypto";//generate unique ID
// import archiver from "archiver";

// import pdfPoppler from "pdf-poppler";
// import { arch } from "os";
// import { resolve } from "dns";
// import { rejects } from "assert";

// //merge pdfs...
// export const mergePdf = async (req, res) => {
//     try {
//         const mergedPdf = await PDFDocument.create();

//         for (const file of req.files) {
//             const pdfBytes = fs.readFileSync(file.path);
//             const pdfDoc = await PDFDocument.load(pdfBytes);

//             const copiedPages = await mergedPdf.copyPages(
//                 pdfDoc,
//                 pdfDoc.getPageIndices()
//             );

//             copiedPages.forEach(page => mergedPdf.addPage(page));
//         }

//         // Delete uploaded files after merging
//         for (const file of req.files) {
//             fs.unlinkSync(file.path);
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
// };


// //split pdf
// export const splitPdf = async (req, res) => {
//     try {
//         const file = req.file;

//         // read range from user
//         const startPage = parseInt(req.body.start);
//         const endPage = parseInt(req.body.end);

//         const pdfBytes = fs.readFileSync(file.path);
//         const pdfDoc = await PDFDocument.load(pdfBytes);

//         const totalPages = pdfDoc.getPageCount();

//         // validate page range
//         if (
//             startPage < 1 ||
//             endPage > totalPages ||
//             startPage > endPage
//         ) {
//             fs.unlinkSync(file.path);
//             return res.status(400).json({
//                 error: "Invalid page range"
//             });
//         }

//         // convert to zero-based index
//         const startIndex = startPage - 1;
//         const endIndex = endPage - 1;

//         // create new empty PDF
//         const newPdf = await PDFDocument.create();

//         // select page indices using helper
//         const allPages = pdfDoc.getPageIndices();
//         const selectedPages = allPages.slice(startIndex, endIndex + 1);

//         // copy & add pages
//         const copiedPages = await newPdf.copyPages(pdfDoc, selectedPages);
//         copiedPages.forEach(page => newPdf.addPage(page));

//         // delete original uploaded file
//         fs.unlinkSync(file.path);

//         // save & send PDF
//         const newPdfBytes = await newPdf.save();

//         res.set({
//             "Content-Type": "application/pdf",
//             "Content-Disposition": "attachment; filename=split.pdf"
//         });

//         res.send(Buffer.from(newPdfBytes));

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: "Failed to split PDF" });
//     }
// };


// //image to pdfs
// export const imageToPdf = async (req, res) => {
//     try {
//         // console.log(
//         //   req.files.map(f => ({
//         //     name: f.originalname,
//         //     type: f.mimetype,
//         //     size: f.size
//         //   }))
//         // );

//         // res.status(200).json({ message: "Images received" });

//         const pdfDoc = await PDFDocument.create();
//         //==================== embed each image ============================
//         for(const file of req.files) {
//             let image;
//             if(file.mimetype === "image/png") {
//                 // Embed the PNG file buffer into the PDF(for pdfDoc) and return an image object
//                 image = await pdfDoc.embedPng(file.buffer);
//             } else {
//                 image = await pdfDoc.embedJpg(file.buffer);
//             }
//             const page = pdfDoc.addPage([image.width, image.height]);//page added to pdfDoc
//             //===== draw image on the page============
//             page.drawImage (image, {
//                 x: 0,
//                 y: 0,
//                 width: image.width,
//                 height: image.height
//             });
//         }
//         console.log("All images added to pdf");
//         const pdfBytes = await pdfDoc.save(); //gives raw pdf bytes

//         res.set({
//             "content-type": "application/pdf",
//             "content-Disposition": "attachment; filename=image-to-pdf.pdf"//later replace inline with attachment
//         });

//         res.send(Buffer.from(pdfBytes));

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: "Image to PDF failed" });
//     }
// };





// //========================pdfs - to - image ============================================


// export const pdfToImage = async (req, res) => {
//     try {
//         console.log(
//           req.files.map(f => ({
//             name: f.originalname,
//             type: f.mimetype,
//             size: f.size
//           }))
//         );


//         const cleanupFolder = (folderPath) => {
//         fs.rm(folderPath, { recursive: true, force: true }, (err) => {
//             if (err) {
//             console.error("Cleanup failed:", err);
//             } else {
//             console.log("Cleaned up:", folderPath);
//             }
//         });
//         };
//         // res.status(200).json({ message: "pdf received" });
//         //folder creation for user
//         const requestId = crypto.randomUUID();
//         const baseDir = path.join(
//             process.cwd(),
//             "temp",
//             "pdf-to-image",
//             requestId
//         );
//         const uploadDir = path.join(baseDir, "uploads");
//         const imageDir = path.join(baseDir, "images");

//         fs.mkdirSync(uploadDir, {recursive: true});//create folder recusive:true means if folder not present create it
//         fs.mkdirSync(imageDir, {recursive: true});

//         //move pdf file to new folder
//         req.files.forEach((file) => {
//             const newPath = path.join(uploadDir, file.originalname);
//             fs.renameSync(file.path, newPath);

//             console.log("Moved file to:", newPath);
//         });

        
//         // res.status(200).json({message: "Files recieved and organized" });


//         const pdfFiles = fs.readdirSync(uploadDir);
//         console.log("PDFs to merge:", pdfFiles);
//         //merge logic
//         const mergedPdf = await PDFDocument.create();

//         for (const fileName of pdfFiles) {
//             const filePath = path.join(uploadDir, fileName);
//             const pdfBytes = fs.readFileSync(filePath);//convert to binary

//             const pdfDoc = await PDFDocument.load(pdfBytes);
//             console.log("Loading PDF:", fileName);

//             //copy pages
//             const copiedPages = await mergedPdf.copyPages(
//                 pdfDoc,
//                 pdfDoc.getPageIndices()
//             );
//             copiedPages.forEach(page => mergedPdf.addPage(page));
//         }

//         const mergedPdfBytes = await mergedPdf.save();
        

//         const mergedDir = path.join(baseDir, "merged");
//         fs.mkdirSync(mergedDir, {recursive: true});
//         const mergedPdfPath = path.join(mergedDir, "merged.pdf");
//         fs.writeFileSync(mergedPdfPath, mergedPdfBytes);

//         console.log("Merged PDF created at:", mergedPdfPath);
//         //merge logic end================//

//         // res.status(200).json({message: "merged pdf created successfully"});

//         //pdf to image using poppler
//         const outputDir = imageDir;
//         const options = {
//             format: "png",
//             out_dir: outputDir,
//             out_prefix: "page",
//             page: null // null = convert All pages
//         };

//         await pdfPoppler.convert(mergedPdfPath, options);

//         const imageFiles = fs.readdirSync(outputDir);
//         console.log("Generated images:", imageFiles);

//         //zip images
//         const zipPath = path.join(baseDir, "images.zip");//zip path
//         const output = fs.createWriteStream(zipPath);
//         const archive = archiver("zip", {zlib: {level: 9}});
//         archive.pipe(output);
//         archive.directory(imageDir, false); //false = dont nest inside another folder
//         await archive.finalize();

//         //wait until zip is fully written
//         await new Promise((resolve, reject) => {
//             output.on("close", resolve);
//             archive.on("error", reject);
//         });



//         res.set({
//         "Content-Type": "application/zip",
//         "Content-Disposition": "attachment; filename=pdf-images.zip"
//         });
//         res.sendFile(zipPath);

//         // cleanup after delay (allows multiple downloads)
//         setTimeout(() => {
//             cleanupFolder(baseDir);
//         }, 2 * 60 * 1000);


//     } catch (error) {
//         console.error("PDF to Image error:", error);
//         res.status(500).json({ error: "PDF to Image failed" });
//     }
// };


/*
====================================================
COMPRESS PDF (USING GHOSTSCRIPT)
====================================================
- Requires Ghostscript installed (`gswin64c` on Windows, or `gs` on Linux).
*/
export const compressPdf = async (req, res) => {
    console.log(`[${req.requestId}] Processing compressPdf...`);
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
    }

    try {
        const level = req.body.level || "recommended";
        console.log(`[${req.requestId}] Received compression request for level: ${level}`);
        
        // Define specific ghostscript parameters based on level
        let gsQualityArgs = [];
        
        if (level === "extreme") {
            // Extreme: 72 dpi, aggressive image downsampling, lower quality JPEG
            gsQualityArgs = [
                "-dPDFSETTINGS=/screen",
                "-dColorImageDownsampleType=/Average",
                "-dColorImageResolution=72",
                "-dGrayImageDownsampleType=/Average",
                "-dGrayImageResolution=72",
                "-dMonoImageDownsampleType=/Average",
                "-dMonoImageResolution=72"
            ];
        } else if (level === "less") {
            // Less: 300 dpi, high quality
            gsQualityArgs = [
                "-dPDFSETTINGS=/printer",
                "-dColorImageResolution=300",
                "-dGrayImageResolution=300",
                "-dMonoImageResolution=300"
            ];
        } else {
            // Recommended: 150 dpi (default ebook setting)
            gsQualityArgs = [
                "-dPDFSETTINGS=/ebook",
                "-dColorImageResolution=150",
                "-dGrayImageResolution=150",
                "-dMonoImageResolution=150"
            ];
        }

        const tempDir = path.join(process.cwd(), "temp", "compress", req.requestId);
        fs.mkdirSync(tempDir, { recursive: true });

        const inputPath = path.join(tempDir, file.originalname || "input.pdf");
        const outputPath = path.join(tempDir, "compressed.pdf");

        // Move uploaded file to temp dir
        fs.renameSync(file.path, inputPath);

        // Determine ghostscript command name (gswin64c on Windows, gs on Linux/Mac)
        let gsCmd = process.platform === "win32" ? "gswin64c" : "gs";
        
        // Dynamically resolve Ghostscript on Windows if it's not in PATH
        if (process.platform === "win32") {
            try {
                // If it fails to run 'gswin64c -v', we know it's not in the PATH.
                // It throws an ENOENT error if it's missing.
                const gsPaths = [
                    "gswin64c", 
                    "C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe",
                    "C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe",
                    "C:\\Program Files\\gs\\gs10.03.1\\bin\\gswin64c.exe",
                    "C:\\Program Files\\gs\\gs10.02.1\\bin\\gswin64c.exe"
                ];

                for (const p of gsPaths) {
                    if (p === "gswin64c") continue; // We'll try the others instead
                    if (fs.existsSync(p)) {
                        gsCmd = p;
                        console.log("Found Ghostscript at:", gsCmd);
                        break;
                    }
                }
            } catch (err) {
                console.error("Path resolution error", err);
            }
        }
        
        const gsArgs = [
            "-sDEVICE=pdfwrite",
            "-dCompatibilityLevel=1.4",
            ...gsQualityArgs,
            "-dNOPAUSE",
            "-dQUIET",
            "-dBATCH",
            `-sOutputFile=${outputPath}`,
            inputPath
        ];

        console.log("Running Ghostscript with args:", gsArgs.slice(0, -2)); // Don't log full paths

        try {
            await execFilePromise(gsCmd, gsArgs);
            
            res.download(outputPath, "compressed.pdf", (err) => {
                if (err) console.error("Error sending compressed file:", err);
                
                // Cleanup temp folder
                setTimeout(() => {
                    fs.rm(tempDir, { recursive: true, force: true }, () => {});
                }, 2 * 60 * 1000);
            });
        } catch (gsError) {
            console.error("Ghostscript error:", gsError);
            return res.status(500).json({ error: "Compression failed. Ensure Ghostscript is installed." });
        }

    } catch (error) {
        console.error("Compress PDF error:", error);
        res.status(500).json({ error: "Failed to compress PDF" });
    } finally {
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
    }
};

/*
====================================================
ADD PAGE NUMBER
====================================================
- No request ID needed
- Single file operation
- File deleted immediately
*/
export const addPageNumber = async (req, res) => {
    console.log(`[${req.requestId}] Processing addPageNumber...`);
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: "Missing PDF file" });
    }

    try {
        const position = req.body.position || "Bottom-Center";
        
        const pdfBytes = fs.readFileSync(file.path);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const pages = pdfDoc.getPages();
        
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const { width, height } = page.getSize();
            const text = `${i + 1}`;
            const textSize = 12;
            const textWidth = helveticaFont.widthOfTextAtSize(text, textSize);
            const textHeight = helveticaFont.heightAtSize(textSize);
            
            let x = 0;
            let y = 0;
            
            const margin = 30; // standard margin
            
            switch(position) {
                case "Bottom-Center":
                    x = (width / 2) - (textWidth / 2);
                    y = margin;
                    break;
                case "Bottom-Left":
                    x = margin;
                    y = margin;
                    break;
                case "Bottom-Right":
                    x = width - margin - textWidth;
                    y = margin;
                    break;
                case "Top-Center":
                    x = (width / 2) - (textWidth / 2);
                    y = height - margin - textHeight;
                    break;
                case "Top-Left":
                    x = margin;
                    y = height - margin - textHeight;
                    break;
                case "Top-Right":
                    x = width - margin - textWidth;
                    y = height - margin - textHeight;
                    break;
                default:
                    x = (width / 2) - (textWidth / 2);
                    y = margin;
            }
            
            // Draw text
            page.drawText(text, {
                x: x,
                y: y,
                size: textSize,
                font: helveticaFont,
                color: rgb(0, 0, 0)
            });
        }
        
        const modifiedPdfBytes = await pdfDoc.save();
        
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=numbered.pdf"
        });
        
        res.send(Buffer.from(modifiedPdfBytes));

    } catch (error) {
        console.error("Add Page Number error:", error);
        res.status(500).json({ error: "Failed to add page numbers" });
    } finally {
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
    }
};
