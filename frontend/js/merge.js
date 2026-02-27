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
const mergePdfMobile = document.getElementById("mergePdfMobile");
const buttonOnMobile = document.querySelector(".mobile-view-btn");

// Form
const mergeForm = document.getElementById("mergeForm");

// ========== 2. GLOBAL VARIABLES ==========
let selectedFiles = [];
let draggedIndex = null;
let mergedFileData = null;

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
    mergePdfMain.classList.add("merge-pdf-main-section");
    uploadSection.classList.add("hidden");
    toolSection.classList.remove("hidden");
    mergeBtn.removeAttribute("disabled");
    
    // Mobile: Show mobile buttons
    buttonOnMobile.classList.remove("hidden-on-mobile");
    mergePdfMobile.removeAttribute("disabled");
  } else {
    // No PDFs: Show upload area, hide merge button
    mergePdfMain.classList.remove("merge-pdf-main-section");
    uploadSection.classList.remove("hidden");
    toolSection.classList.add("hidden");
    mergeBtn.setAttribute("disabled", true);
    
    // Mobile: Hide mobile buttons
    buttonOnMobile?.classList.add("hidden-on-mobile");
    mergePdfMobile?.setAttribute("disabled", true);
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

    card.innerHTML = `
      <div class="pdf-thumbnail">📄</div>
      <div class="pdf-name">${file.name}</div>
      <button class="merge-remove-btn" type="button" title="Remove PDF">✖</button>
    `;

    addDragEvents(card);

    // Remove logic
    card.querySelector(".merge-remove-btn").addEventListener("click", (e) => {
      e.preventDefault();
      selectedFiles.splice(index, 1);
      renderPdfList();
      updatePreviewContainer();
      updateMergeButtonState();
    });

    previewContainer.appendChild(card);
  });

  updateMergeButtonState();
}


// ========== 8. DRAG & DROP REORDERING ==========
// Allow users to drag PDFs to reorder them

function addDragEvents(card) {
  card.addEventListener("dragstart", (e) => {
    draggedIndex = Number(card.dataset.index);
    card.classList.add("dragging");
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
    draggedIndex = null;
  });

  card.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  card.addEventListener("drop", (e) => {
    e.preventDefault();
    const targetIndex = Number(card.dataset.index);

    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const draggedFile = selectedFiles.splice(draggedIndex, 1)[0];
    selectedFiles.splice(targetIndex, 0, draggedFile);

    renderPdfList();
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
    mergePdfMobile.disabled = true;
    mergePdfMobile.textContent = "Merging…";

    const response = await fetch("/pdf/merge", {
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
    const downloadBtnMobile = document.getElementById("downloadMergedBtnMobile");
    if (downloadBtn) downloadBtn.classList.remove("hidden");
    if (downloadBtnMobile) downloadBtnMobile.classList.remove("hidden");
    
    // Open in new tab
    window.open(url, "_blank");

  } catch (error) {
    console.error("Error merging PDFs:", error);
    alert("Failed to merge PDFs");
  } finally {
    mergeBtn.disabled = selectedFiles.length < 2;
    mergeBtn.textContent = "Merge PDFs";
    mergePdfMobile.disabled = selectedFiles.length < 2;
    mergePdfMobile.textContent = "Merge PDFs";
  }
});

// ========== 10. MOBILE MERGE BUTTON ==========
// Handle mobile mDOWNLOAD BUTTON HANDLERS ==========
const downloadMergedBtn = document.getElementById("downloadMergedBtn");
const downloadMergedBtnMobile = document.getElementById("downloadMergedBtnMobile");

if (downloadMergedBtn) {
  downloadMergedBtn.addEventListener("click", () => {
    if (mergedFileData) {
      downloadFile(mergedFileData, "merged.pdf");
    }
  });
}

if (downloadMergedBtnMobile) {
  downloadMergedBtnMobile.addEventListener("click", () => {
    if (mergedFileData) {
      downloadFile(mergedFileData, "merged.pdf");
    }
  });
}

// ========== 12. erge button submit
mergePdfMobile?.addEventListener("click", (e) => {
  e.preventDefault();
  mergeForm.dispatchEvent(new Event("submit"));
});

// ========== 11. CALL INITIAL SETUP ==========
// Initialize UI on page load
updatePreviewContainer();