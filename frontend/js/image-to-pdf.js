// ========================================
// IMAGE TO PDF CONVERTER - JAVASCRIPT
// ========================================

// ========== 1. SELECT HTML ELEMENTS ==========
// These variables store references to HTML elements we want to control

// File input element (hidden, but triggered by buttons)
const imgInput = document.getElementById("imgInput");

// Main container sections
const imgMainSection = document.querySelector(".image-to-pdf");
const uploadSection = document.querySelector(".upload-section");
const toolSection = document.querySelector(".tool-page");
const previewContainer = document.getElementById('previewContainer');

// Buttons
const imgToPdfBtn = document.getElementById("imgToPdfBtn");
const addImage = document.querySelectorAll(".add-image");
const btnConvertPdf = document.querySelectorAll(".btn-convert-pdf");
const convertToPdfMobile = document.getElementById("ConvertToPdfMobile");
const buttonOnMobile = document.querySelector(".mobile-view-btn");

// ========== 2. GLOBAL VARIABLES ==========
// These store data used across the entire application

// Array to store all selected image files
const filesArray = [];

// Track which card is being dragged (for rearranging)
let draggedIndex = undefined;
let touchStartY = 0;
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
// Allow users to click "Add Images" buttons to select files

addImage.forEach(btn => {
    btn.addEventListener("click", () => {
        // When user clicks "Add Images" button, trigger file input
        imgInput.click();
    });
});

// ========== 4. HANDLE FILE SELECTION ==========
// When user selects images from file input, add them to our array

imgInput.addEventListener('change', (e) => {
    // Convert FileList to an array
    const newImages = Array.from(e.target.files);
    
    // Add each image to our filesArray
    newImages.forEach(image => {
        filesArray.push(image);
    });
    
    // Update the UI to show uploaded images
    updatePreviewContainer();
    renderPreviews();
    
    // Clear the input so user can select more files
    imgInput.value = '';
});

// ========== 5. UPDATE UI VISIBILITY ==========
// Show/hide different sections based on whether user has uploaded images

const updatePreviewContainer = () => {
    if (filesArray.length > 0) {
        // User has images: Show preview and convert button
        imgMainSection.classList.add("image-pdf-main-section");
        uploadSection.classList.add("hidden");
        toolSection.classList.remove("hidden");
        imgToPdfBtn.removeAttribute("disabled");
        
        // Mobile: Show mobile buttons
        buttonOnMobile.classList.remove("hidden-on-mobile");
        convertToPdfMobile.removeAttribute("disabled");
    } else {
        // No images: Show upload area, hide convert button
        imgMainSection.classList.remove("image-pdf-main-section");
        uploadSection.classList.remove("hidden");
        toolSection.classList.add("hidden");
        imgToPdfBtn.setAttribute("disabled", true);
        
        // Mobile: Hide mobile buttons
        buttonOnMobile?.classList.add("hidden-on-mobile");
        convertToPdfMobile?.setAttribute("disabled", true);
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
    
    // Filter to only image files
    const imageFiles = droppedFiles.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
        // Add images to our array
        filesArray.concat(imageFiles).forEach(img => filesArray.push(img));
        updatePreviewContainer();
        renderPreviews();
    }
}

// Setup drag and drop on multiple areas
const dragZones = [uploadSection, previewContainer, imgMainSection];

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

// ========== 7. CREATE IMAGE PREVIEW CARDS ==========
// This is the main function that creates and displays all image cards

const renderPreviews = () => {
    // Clear previous cards from the container
    previewContainer.innerHTML = '';
    
    // Create a card for each image in our filesArray
    filesArray.forEach((file, index) => {
        // ===== Create the card's HTML structure =====
        const card = document.createElement('div');
        card.className = 'image-card';
        card.draggable = true;  // Allow dragging on desktop
        card.dataset.index = index;  // Store which image this card represents
        
        // Create remove button (X)
        const removeBtn = document.createElement('button');
        removeBtn.className = 'image-remove-btn';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = () => removeFile(index);
        
        // Create image container
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'img-wrapper';
        
        // Read the file and convert it to display-able format (Base64)
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;  // Set image source
            img.alt = file.name;
            imgWrapper.appendChild(img);
        };
        reader.readAsDataURL(file);  // Convert file to Base64
        
        // Create filename text
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = file.name;
        
        // Assemble all parts into the card
        card.appendChild(removeBtn);
        card.appendChild(imgWrapper);
        card.appendChild(fileName);
        
        // ===== ADD DRAG-TO-REARRANGE (DESKTOP) =====
        card.addEventListener('dragstart', (e) => {
            const sourceIndex = parseInt(card.dataset.index);
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', sourceIndex.toString());
            card.classList.add('dragging');
            draggedIndex = sourceIndex;
        });
        
        card.addEventListener('dragend', (e) => {
            card.classList.remove('dragging');
            // Reset all cards
            document.querySelectorAll('.image-card').forEach(c => {
                c.classList.remove('drag-over-card');
            });
            draggedIndex = undefined;
        });
        
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const currentIndex = parseInt(card.dataset.index);
            // Highlight this card if we're dragging a different card over it
            if (draggedIndex !== currentIndex && draggedIndex !== undefined) {
                card.classList.add('drag-over-card');
            }
        });
        
        card.addEventListener('dragleave', (e) => {
            const currentIndex = parseInt(card.dataset.index);
            if (draggedIndex !== currentIndex) {
                card.classList.remove('drag-over-card');
            }
        });
        
        card.addEventListener('drop', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            const targetIndex = parseInt(card.dataset.index);
            const sourceIndex = draggedIndex;
            
            // Swap the two images in our array
            if (sourceIndex !== undefined && sourceIndex !== targetIndex) {
                [filesArray[sourceIndex], filesArray[targetIndex]] = 
                [filesArray[targetIndex], filesArray[sourceIndex]];
                draggedIndex = undefined;
                renderPreviews();
            }
        });
        
        // ===== ADD DRAG-TO-REARRANGE (MOBILE/TOUCH) =====
        card.addEventListener('touchstart', (e) => {
            const sourceIndex = parseInt(card.dataset.index);
            card.classList.add('dragging');
            draggedIndex = sourceIndex;
            touchStartY = e.touches[0].clientY;
        });
        
        card.addEventListener('touchmove', (e) => {
            if (draggedIndex !== undefined) {
                e.preventDefault();
                const touch = e.touches[0];
                // Find what element is under the user's finger
                const element = document.elementFromPoint(touch.clientX, touch.clientY);
                
                // Check if that element is an image card
                const targetCard = element?.closest('.image-card');
                if (targetCard) {
                    const targetIndex = parseInt(targetCard.dataset.index);
                    // Remove highlight from all cards
                    document.querySelectorAll('.image-card').forEach(c => {
                        c.classList.remove('drag-over-card');
                    });
                    // Highlight the target card
                    if (targetIndex !== draggedIndex) {
                        targetCard.classList.add('drag-over-card');
                    }
                }
            }
        });
        
        card.addEventListener('touchend', (e) => {
            if (draggedIndex !== undefined) {
                const touch = e.changedTouches[0];
                // Find what element the finger was over when released
                const element = document.elementFromPoint(touch.clientX, touch.clientY);
                const targetCard = element?.closest('.image-card');
                
                if (targetCard) {
                    const targetIndex = parseInt(targetCard.dataset.index);
                    
                    // Swap if different cards
                    if (draggedIndex !== targetIndex) {
                        [filesArray[draggedIndex], filesArray[targetIndex]] = 
                        [filesArray[targetIndex], filesArray[draggedIndex]];
                        renderPreviews();
                    }
                }
            }
            
            // Reset all cards
            card.classList.remove('dragging');
            document.querySelectorAll('.image-card').forEach(c => {
                c.classList.remove('drag-over-card');
            });
            draggedIndex = undefined;
        });
        
        // Add the completed card to the page
        previewContainer.appendChild(card);
    });
    
    // Update UI showing convert button, etc.
    updatePreviewContainer();
};

// ========== 8. REMOVE IMAGE ==========
// When user clicks the X button on a card, remove that image

const removeFile = (index) => {
    // Remove image at specified index from our array
    filesArray.splice(index, 1);
    // Refresh the preview display
    renderPreviews();
};

//backend integration
btnConvertPdf.forEach(btn => {
    btn.addEventListener("click", async (e) => {
        e.preventDefault();//prevent reload event(e)
        console.log("convert button clicked");

        if (filesArray.length === 0) return;

        const formData = new FormData;

          // IMPORTANT: order is preserved
        filesArray.forEach(file => {
            formData.append("images", file); // 👈 must match multer field
        });

       try {
        btn.disabled = true;
        btn.textContent = "Converting…";
        
        const response = await fetch("/pdf/image-to-pdf", {
            method: "POST",
            body: formData
        });

        if (!response.ok){
            throw new Error("Failed to generate PDF");
        } 
        const fileData = await response.blob();
        convertedFileData = fileData;
        const url = window.URL.createObjectURL(fileData);
        
        // Show download buttons
        const downloadBtn = document.getElementById("downloadImagePdfBtn");
        const downloadBtnMobile = document.getElementById("downloadImagePdfBtnMobile");
        if (downloadBtn) downloadBtn.classList.remove("hidden");
        if (downloadBtnMobile) downloadBtnMobile.classList.remove("hidden");
        
        // Open in new tab
        window.open(url, "_blank");
       
       } catch (err) {
            console.log(err);
            alert("Image to PDF failed");
       } finally {
        btn.disabled = false;
        btn.textContent = "Convert to PDF";
       }
        

    });
});

// ========== DOWNLOAD BUTTON HANDLERS ==========
const downloadImagePdfBtn = document.getElementById("downloadImagePdfBtn");
const downloadImagePdfBtnMobile = document.getElementById("downloadImagePdfBtnMobile");

if (downloadImagePdfBtn) {
  downloadImagePdfBtn.addEventListener("click", () => {
    if (convertedFileData) {
      downloadFile(convertedFileData, "images-to-pdf.pdf");
    }
  });
}

if (downloadImagePdfBtnMobile) {
  downloadImagePdfBtnMobile.addEventListener("click", () => {
    if (convertedFileData) {
      downloadFile(convertedFileData, "images-to-pdf.pdf");
    }
  });
}
