// ========================================
// PDF MERGE - JAVASCRIPT
// ========================================

// ========== 1. SELECT HTML ELEMENTS ==========
// File input element
const pdfInput = document.getElementById("pdfInput");

// Main container sections
const mergePdfMain = document.querySelector(".merge-pdf");
const uploadSection = document.querySelector(".upload-section");
const toolSection = document.querySelector(".tool-page");
const previewContainer = document.getElementById('previewContainer');

// Buttons
const mergeBtn = document.getElementById("mergeBtn");
const addPdf = document.querySelectorAll(".add-pdf");
const btnMergePdf = document.querySelectorAll(".btn-merge-pdf");

// Form
const mergeForm = document.getElementById("mergeForm");

// ========== 2. GLOBAL VARIABLES ==========
let selectedFiles = [];
let draggedIndex = null;
let mergedFileData = null;

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

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

// ========== 3. UPLOAD BUTTON SETUP ==========
// Allow users to click "Add PDFs" buttons to select files

addPdf.forEach(btn => {
  btn.addEventListener("click", () => {
    pdfInput.click();
  });
});

// ========== 4. HANDLE FILE SELECTION ==========
// When user selects PDFs from file input, add them to our array

pdfInput.addEventListener('change', (e) => {
  // Convert FileList to an array
  const newFiles = Array.from(e.target.files);
  
  // Add each PDF to our selectedFiles array (avoid duplicates)
  newFiles.forEach(file => {
    if (!isDuplicate(file)) {
      selectedFiles.push(file);
    }
  });
  
  // Update the UI to show uploaded PDFs
  updatePreviewContainer();
  renderPdfList();
  
  // Clear the input so user can select more files
  pdfInput.value = '';
});

// ========== 5. UPDATE UI VISIBILITY ==========
// Show/hide different sections based on whether user has uploaded PDFs

const updatePreviewContainer = () => {
  if (selectedFiles.length > 0) {
    // User has PDFs: Show preview and merge button
    uploadSection.classList.add('hidden');
    previewContainer.classList.remove('hidden');
    mergeForm.classList.remove('hidden');
    mergeBtn.removeAttribute("disabled");
  } else {
    // No PDFs: Show upload area, hide merge button
    uploadSection.classList.remove('hidden');
    previewContainer.classList.add('hidden');
    mergeForm.classList.add('hidden');
    mergeBtn.setAttribute("disabled", true);
  }
};

// ========== 6. HELPER FUNCTIONS ==========

const isDuplicate = file => {
  return selectedFiles.some(f => f.name === file.name && f.size === file.size);
};

function updateMergeButtonState() {
  if (selectedFiles.length < 2) {
    mergeBtn.disabled = true;
  } else {
    mergeBtn.disabled = false;
  }
  
  // Hide download button when file configuration changes
  const downloadBtn = document.getElementById("downloadMergedBtn");
  if (downloadBtn) {
    downloadBtn.classList.add("hidden");
  }
}

// ========== 7. RENDER PDF LIST ==========
// Display all selected PDFs in a grid with drag and drop support

function renderPdfList() {
  previewContainer.innerHTML = "";

  selectedFiles.forEach((file, index) => {
    const card = document.createElement("div");
    card.className = "pdf-card";
    card.draggable = true;
    card.dataset.index = index;

    // Remove button
    const removeBtn = document.createElement("button");
    removeBtn.className = "merge-remove-btn";
    removeBtn.type = "button";
    removeBtn.title = "Remove PDF";
    removeBtn.innerHTML = "✖";
    removeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      selectedFiles.splice(index, 1);
      renderPdfList();
      updatePreviewContainer();
      updateMergeButtonState();
    });

    // Thumbnail wrapper
    const imgWrapper = document.createElement("div");
    imgWrapper.className = "pdf-thumbnail";
    imgWrapper.style.pointerEvents = "none";

    const canvas = document.createElement("canvas");
    canvas.style.maxWidth = "100%";
    canvas.style.maxHeight = "100%";
    canvas.style.objectFit = "contain";
    imgWrapper.appendChild(canvas);

    const reader = new FileReader();
    reader.onload = async function() {
        const typedarray = new Uint8Array(this.result);
        try {
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            const page = await pdf.getPage(1);
            
            const viewport = page.getViewport({ scale: 0.5 }); 
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            const context = canvas.getContext("2d");
            await page.render({ canvasContext: context, viewport: viewport }).promise;
        } catch (error) {
            console.error("Error rendering PDF preview:", error);
            imgWrapper.innerHTML = '📄';
        }
    };
    reader.readAsArrayBuffer(file);

    // File name
    const fileName = document.createElement("div");
    fileName.className = "pdf-name";
    fileName.textContent = file.name;
    fileName.style.pointerEvents = "none";

    card.appendChild(imgWrapper);
    card.appendChild(fileName);
    card.appendChild(removeBtn);

    addDragEvents(card);
    previewContainer.appendChild(card);
  });

  updateMergeButtonState();
}


// ========== 8. DRAG & DROP REORDERING ==========
// Allow users to drag PDFs to reorder them

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

    const draggedFile = selectedFiles.splice(draggedIndex, 1)[0];
    selectedFiles.splice(targetIndex, 0, draggedFile);

    draggedIndex = null;
    renderPdfList();
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
    card.style.transform = "";
    card.style.boxShadow = "";
    draggedIndex = null;
  });
}

// ========== 9. MERGE PDFS ==========
// Handle form submission to merge PDFs

mergeForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (selectedFiles.length < 2) return;

  const formData = new FormData();

  // IMPORTANT: order is preserved
  selectedFiles.forEach(file => {
    formData.append("files", file); // 👈 must match multer field
  });

  try {
    mergeBtn.disabled = true;
    mergeBtn.textContent = "Merging…";

    const response = await fetch(`${API_URL}/pdf/merge`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("Merge failed");
    }

    const fileData = await response.blob();
    mergedFileData = fileData;
    const url = window.URL.createObjectURL(fileData);
    
    // Show download button
    const downloadBtn = document.getElementById("downloadMergedBtn");
    if (downloadBtn) downloadBtn.classList.remove("hidden");

  } catch (error) {
    console.error("Error merging PDFs:", error);
    alert("Failed to merge PDFs");
  } finally {
    mergeBtn.disabled = selectedFiles.length < 2;
    mergeBtn.textContent = "Merge PDFs";
  }
});

// ========== DOWNLOAD BUTTON HANDLERS ==========
const downloadMergedBtn = document.getElementById("downloadMergedBtn");

if (downloadMergedBtn) {
  downloadMergedBtn.addEventListener("click", () => {
    if (mergedFileData) {
      downloadFile(mergedFileData, "merged.pdf");
    }
  });
}

// ========== 11. CALL INITIAL SETUP ==========
// Initialize UI on page load
updatePreviewContainer();