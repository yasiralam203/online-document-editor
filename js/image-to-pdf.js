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

// ========== 2. GLOBAL VARIABLES ==========
// These store data used across the entire application

// Array to store all selected image files
const filesArray = [];

// Store converted file data for download
let convertedFileData = null;

// ========== 2.5. DOWNLOAD HELPER FUNCTION ==========
const downloadFile = async (blob, filename) => {
  const isCapacitor = typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform();

  if (isCapacitor) {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64data = reader.result.split(',')[1];

      try {
        const Filesystem = window.Capacitor.Plugins.Filesystem;

        await Filesystem.writeFile({
          path: filename,
          data: base64data,
          directory: 'DOCUMENTS'
        });

        alert(`Successfully saved ${filename} to your Documents folder!`);
      } catch (err) {
        alert("Failed to save file natively: " + err.message);
      }
    };
  } else {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  }
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
// Show/hide// This function toggles elements based on whether we have images or not
const updatePreviewContainer = () => {
    // Hide download button when file configuration changes
    const downloadBtn = document.getElementById("downloadImagePdfBtn");
    if (downloadBtn) {
        downloadBtn.classList.add("hidden");
    }

    if (filesArray.length > 0) {
        uploadSection.classList.add('hidden');
        previewContainer.classList.remove('hidden');
        toolSection.classList.remove('hidden'); // Assuming toolSection should be shown
        imgToPdfBtn.removeAttribute("disabled");
    } else {
        uploadSection.classList.remove('hidden');
        previewContainer.classList.add('hidden');
        toolSection.classList.add('hidden'); // Assuming toolSection should be hidden
        imgToPdfBtn.setAttribute("disabled", true);
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

let draggedIndex = null;

const renderPreviews = () => {
    // Clear previous cards from the container
    previewContainer.innerHTML = '';
    
    // Create a card for each image in our filesArray
    filesArray.forEach((file, index) => {
        // ===== Create the card's HTML structure =====
        const card = document.createElement('div');
        card.className = 'image-card';
        card.draggable = true;
        card.dataset.index = index;  // Store which image this card represents
        
        // Create remove button (X)
        const removeBtn = document.createElement('button');
        removeBtn.className = 'image-remove-btn';
        removeBtn.type = 'button';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = (e) => {
            e.preventDefault();
            removeFile(index);
        };
        
        // Create image container
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'img-wrapper';
        imgWrapper.style.pointerEvents = 'none';
        
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
        fileName.style.pointerEvents = 'none';
        
        // Assemble all parts into the card
        card.appendChild(removeBtn);
        card.appendChild(imgWrapper);
        card.appendChild(fileName);
        
        addDragEvents(card);
        // Add the completed card to the page
        previewContainer.appendChild(card);
    });
    
    // Update UI showing convert button, etc.
    updatePreviewContainer();
};

// ========== 7.5 DRAG & DROP REORDERING ==========
// Allow users to drag images to reorder them
function addDragEvents(card) {
  card.addEventListener("dragstart", (e) => {
    draggedIndex = Number(card.dataset.index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", draggedIndex.toString());
    
    // Defer visual change so drag image isn't affected
    setTimeout(() => {
        card.classList.add("dragging");
    }, 0);
  });

  card.addEventListener("dragenter", (e) => {
    e.preventDefault();
    if (draggedIndex !== null && Number(card.dataset.index) !== draggedIndex) {
        card.style.transform = "scale(1.02)";
        card.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
    }
  });

  card.addEventListener("dragleave", (e) => {
    e.preventDefault();
    card.style.transform = "";
    card.style.boxShadow = "";
  });

  card.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  });

  card.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    card.style.transform = "";
    card.style.boxShadow = "";

    const targetIndex = Number(card.dataset.index);

    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const draggedFile = filesArray.splice(draggedIndex, 1)[0];
    filesArray.splice(targetIndex, 0, draggedFile);

    draggedIndex = null;
    renderPreviews();
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
    card.style.transform = "";
    card.style.boxShadow = "";
    draggedIndex = null;
  });
}

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
        
        const response = await fetch(`${API_URL}/pdf/image-to-pdf`, {
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
        if (downloadBtn) downloadBtn.classList.remove("hidden");
       
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

if (downloadImagePdfBtn) {
  downloadImagePdfBtn.addEventListener("click", () => {
    if (convertedFileData) {
      downloadFile(convertedFileData, "images-to-pdf.pdf");
    }
  });
}
