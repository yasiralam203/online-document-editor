// ========================================
// PDF TO IMAGE CONVERTER - JAVASCRIPT
// ========================================

// ========== 1. SELECT HTML ELEMENTS ==========
// These variables store references to HTML elements we want to control

// File input element (hidden, but triggered by buttons)
const pdfInput = document.getElementById("pdfInput");

// Main container sections
const pdfMainSection = document.querySelector(".pdf-to-image");
const uploadSection = document.querySelector(".upload-section");
const toolSection = document.querySelector(".tool-page");
const previewContainer = document.getElementById('previewContainer');

// Buttons
const pdfToImageBtn = document.getElementById("pdfToImageBtn");
const addPdf = document.querySelectorAll(".add-pdf");
const btnConvertImage = document.querySelectorAll(".btn-convert-image");

// ========== 2. GLOBAL VARIABLES ==========
// These store data used across the entire application

// Array to store all selected PDF files
const filesArray = [];

// Store converted file data for download
let convertedFileData = null;

// ========== 2.5. DOWNLOAD HELPER FUNCTION ==========
const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
};

// ========== 3. UPLOAD AREA SETUP ==========
// Allow users to click "Add PDFs" buttons to select files

addPdf.forEach(btn => {
    btn.addEventListener("click", (e) => {
        // Prevent double-triggering if the user clicked the input itself
        if (e.target.id !== "pdfInput") {
            // When user clicks "Add PDFs" button, trigger file input
            pdfInput.click();
        }
    });
});

// ========== 4. HANDLE FILE SELECTION ==========
// When user selects PDFs from file input, add them to our array

pdfInput.addEventListener('change', (e) => {
    // Convert FileList to an array
    const newPdfs = Array.from(e.target.files);
    
    // Add each PDF to our filesArray
    newPdfs.forEach(pdf => {
        filesArray.push(pdf);
    });
    
    // Update the UI to show uploaded PDFs
    updatePreviewContainer();
    renderPreviews();
    
    // Clear the input so user can select more files
    pdfInput.value = '';
});

// ========== 5. UPDATE UI VISIBILITY ==========
// This function toggles elements based on whether we have PDFs or not
const updatePreviewContainer = () => {
    // Hide download button when file configuration changes
    const downloadBtn = document.getElementById("downloadPdfImageBtn");
    if (downloadBtn) {
        downloadBtn.classList.add("hidden");
    }

    if (filesArray.length > 0) {
        // User has PDFs: Show preview and convert button, hide upload area
        uploadSection.classList.add('hidden');
        previewContainer.classList.remove('hidden');
        toolSection.classList.remove('hidden'); // Ensure toolSection is visible
        pdfToImageBtn.removeAttribute("disabled"); // Enable convert button
    } else {
        // No PDFs: Show upload area, hide preview, tool section, and convert button
        uploadSection.classList.remove('hidden');
        previewContainer.classList.add('hidden');
        toolSection.classList.add('hidden'); // Hide toolSection
        pdfToImageBtn.setAttribute("disabled", true); // Disable convert button
    }
};

// ========== 6. DRAG & DROP FOR FILE UPLOAD ==========
// Allow users to drag files onto the page to upload them

// These functions prevent browser's default drag behavior
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop zones when user drags over them
function highlight(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadSection.style.backgroundColor = '#cfe0ff';
    uploadSection.style.borderColor = '#1d4ed8';
    previewContainer.classList.add('drag-over');
}

// Remove highlight when user drags out
function unhighlight(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadSection.style.backgroundColor = '#f0f4ff';
    uploadSection.style.borderColor = '#2563eb';
    previewContainer.classList.remove('drag-over');
}

// Handle files dropped on the page
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    unhighlight(e);
    
    // Get dropped files
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    // Filter to only PDF files
    const pdfFiles = droppedFiles.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length > 0) {
        // Add PDFs to our array
        filesArray.concat(pdfFiles).forEach(pdf => filesArray.push(pdf));
        updatePreviewContainer();
        renderPreviews();
    }
}

// Setup drag and drop on multiple areas
const dragZones = [uploadSection, previewContainer, pdfMainSection];

dragZones.forEach(zone => {
    // Prevent browser default behavior
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        zone.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight zone on drag enter/over
    ['dragenter', 'dragover'].forEach(eventName => {
        zone.addEventListener(eventName, highlight, false);
    });
    
    // Remove highlight on drag leave
    ['dragleave'].forEach(eventName => {
        zone.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle drop
    zone.addEventListener('drop', handleDrop, false);
});

// ========== 7. CREATE PDF PREVIEW CARDS ==========

// Add this near your GLOBAL VARIABLES at the top of the file
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ========== 7. CREATE PDF PREVIEW CARDS ==========
const renderPreviews = () => {
    // Clear previous cards from the container
    previewContainer.innerHTML = '';
    
    // Create a card for each PDF in our filesArray
    filesArray.forEach((file, index) => {
        // ===== Create the card's HTML structure =====
        const card = document.createElement('div');
        card.className = 'image-card';
        card.dataset.index = index;  // Store which PDF this card represents
        
        // Create remove button (X)
        const removeBtn = document.createElement('button');
        removeBtn.className = 'image-remove-btn';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = () => removeFile(index);
        
        // Create PDF image wrapper
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'img-wrapper';
        imgWrapper.style.backgroundColor = '#FFF3E0';

        // --- PDF.JS REAL THUMBNAIL LOGIC ---
        // Create a canvas element instead of an icon
        const canvas = document.createElement('canvas');
        canvas.style.maxWidth = '100%';
        canvas.style.maxHeight = '100%';
        canvas.style.objectFit = 'contain';
        imgWrapper.appendChild(canvas);

        // Read the file and render the first page
        const reader = new FileReader();
        reader.onload = async function() {
            const typedarray = new Uint8Array(this.result);
            try {
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                const page = await pdf.getPage(1);
                
                // Keep the scale small to generate the thumbnail quickly
                const viewport = page.getViewport({ scale: 0.5 }); 
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                const context = canvas.getContext('2d');
                await page.render({ canvasContext: context, viewport: viewport }).promise;
            } catch (error) {
                console.error("Error rendering PDF preview:", error);
                // Fallback to text if PDF preview fails
                imgWrapper.innerHTML = '<span style="color:#e74c3c; font-weight:bold;">PDF</span>';
            }
        };
        reader.readAsArrayBuffer(file);
        // -----------------------------------
        
        // Create filename text
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = file.name;
        
        // Assemble all parts into the card
        card.appendChild(removeBtn);
        card.appendChild(imgWrapper);
        card.appendChild(fileName);
        
        // ===== APPEND TO CONTAINER (Typo fixed!) =====
        previewContainer.appendChild(card);
    });
    
    // Update UI showing convert button, etc.
    updatePreviewContainer();
};
// ========== 8. REMOVE PDF ==========
// When user clicks the X button on a card, remove that PDF

const removeFile = (index) => {
    // Remove PDF at specified index from our array
    filesArray.splice(index, 1);
    // Refresh the preview display
    renderPreviews();
};

//backend integration
btnConvertImage.forEach(btn => {
    btn.addEventListener("click", async (e) => {
        e.preventDefault();//prevent reload event(e)
        console.log("convert button clicked");

        if (filesArray.length === 0) return;

        const formData = new FormData;

          // IMPORTANT: order is preserved
        filesArray.forEach(file => {
            formData.append("files", file); // 👈 must match multer field
        });

       try {
        btn.disabled = true;
        // btn.textContent = "Converting…";
        btn.classList.add("btn-loading");

        const response = await fetch(`${API_URL}/pdf/pdf-to-image`, {
            method: "POST",
            body: formData
        });

        if (!response.ok){
            throw new Error("Failed to generate images");
        } 
        const fileData = await response.blob();
        convertedFileData = fileData;
        const url = window.URL.createObjectURL(fileData);
        
        // Show download buttons
        const downloadBtn = document.getElementById("downloadPdfImageBtn");
        if (downloadBtn) downloadBtn.classList.remove("hidden");
        
        // Open in new tab
        // window.open(url, "_blank");
       
       } catch (err) {
            console.log(err);
            alert("PDF to Image failed");
       } finally {
        btn.disabled = false;
        // btn.textContent = "Convert to Image";
        btn.classList.remove("btn-loading");
       }
        

    });
});

// ========== DOWNLOAD BUTTON HANDLERS ==========
const downloadPdfImageBtn = document.getElementById("downloadPdfImageBtn");

if (downloadPdfImageBtn) {
  downloadPdfImageBtn.addEventListener("click", () => {
    if (convertedFileData) {
      downloadFile(convertedFileData, "pdf-to-images.zip");
    }
  });
}
