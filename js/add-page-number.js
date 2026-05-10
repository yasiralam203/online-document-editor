// ========================================
// ADD PAGE NUMBER - JAVASCRIPT
// ========================================

// ========== 1. SELECT HTML ELEMENTS ==========

// File input
const pdfInput = document.getElementById("pdfInput");

// Sections
const addPageNumberMainSection = document.querySelector(".add-page-number");
const uploadSection = document.querySelector(".upload-section");
const toolSection = document.querySelector(".tool-page");
const previewContainer = document.getElementById("previewContainer");

const positionSelect = document.getElementById("position");

// Buttons
const addPageNumberBtn = document.getElementById("addPageNumberBtn");
const addPdfBtns = document.querySelectorAll(".add-pdf");

// Download button
const downloadBtn = document.getElementById("downloadBtn");

// ========== 2. GLOBAL VARIABLES ==========

let selectedPdf = null;
let processedFileData = null;

// ========== 2.5. DOWNLOAD HELPER FUNCTION ==========

const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
};

// ========== 3. UPLOAD AREA SETUP ==========

addPdfBtns.forEach(btn => {
  btn.addEventListener("click", (e) => {
    // Prevent double-triggering if the user clicked the input itself
    if (e.target.id !== "pdfInput") {
      pdfInput.click();
    }
  });
});

// ========== 4. HANDLE FILE SELECTION ==========

pdfInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  selectedPdf = file;
  processedFileData = null;

  // Reset UI
  previewContainer.innerHTML = "";
  downloadBtn?.classList.add("hidden");

  renderPreview();
  updateUI();

  // allow reselect same file
  pdfInput.value = "";
});

// ========== 5. UPDATE UI VISIBILITY ==========

const updateUI = () => {
  if (selectedPdf) {
    uploadSection.classList.add("hidden");
    previewContainer.classList.remove("hidden");
    toolSection.classList.remove("hidden");

    addPageNumberBtn.removeAttribute("disabled");
  } else {
    uploadSection.classList.remove("hidden");
    previewContainer.classList.add("hidden");
    toolSection.classList.add("hidden");

    addPageNumberBtn.setAttribute("disabled", true);
  }
};

// ========== 6. RENDER PDF PREVIEW CARD ==========

const renderPreview = () => {
  previewContainer.innerHTML = "";

  const pdfUrl = URL.createObjectURL(selectedPdf);

  const iframe = document.createElement("iframe");
  iframe.src = pdfUrl;
  iframe.width = "100%";
  iframe.height = "100%";
  iframe.style.minHeight = "500px";
  iframe.style.border = "none";
  iframe.title = "PDF Preview";

  previewContainer.appendChild(iframe);
};

// ========== 7. REMOVE PDF ==========

const removePdf = () => {
  selectedPdf = null;
  processedFileData = null;
  positionSelect.value = "Bottom-Center";
  previewContainer.innerHTML = "";
  updateUI();
};

[addPageNumberBtn].forEach(btn => {
  if (!btn) return;

  btn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!selectedPdf) return;

    // Basic validation
    if (!selectedPdf) return;

    btn.disabled = true;
    btn.textContent = "Processing…";

    const formData = new FormData();
    formData.append("file", selectedPdf);
    formData.append("position", positionSelect.value);

    try {
      const response = await fetch(`${API_URL}/pdf/add-page-number`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Failed to add page numbers");
      }

      processedFileData = await response.blob();

      downloadBtn?.classList.remove("hidden");

    } catch (err) {
      console.error(err);
      alert("Failed to add page numbers");
    } finally {
      btn.disabled = false;
      btn.textContent = "Add Page Numbers";
    }
  });
});

if (positionSelect) {
  positionSelect.addEventListener("change", () => {
    downloadBtn?.classList.add("hidden");
  });
}

// ========== 9. DOWNLOAD HANDLERS ==========

downloadBtn?.addEventListener("click", () => {
  if (processedFileData) {
    downloadFile(processedFileData, "numbered.pdf");
  }
});

// ========== 10. INITIAL UI STATE ==========
updateUI();
