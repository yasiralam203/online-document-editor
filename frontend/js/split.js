
// ========================================
// SPLIT PDF - JAVASCRIPT
// ========================================

// ========== 1. SELECT HTML ELEMENTS ==========

// File input
const pdfInput = document.getElementById("pdfInput");

// Sections
const splitMainSection = document.querySelector(".split-pdf");
const uploadSection = document.querySelector(".upload-section");
const toolSection = document.querySelector(".tool-page");
const previewContainer = document.getElementById("previewContainer");

// Inputs
const startPage = document.getElementById("startPage");
const endPage = document.getElementById("endPage");

const startPageMobile = document.getElementById("startPageMobile");
const endPageMobile = document.getElementById("endPageMobile");

// Buttons
const splitBtn = document.getElementById("splitBtn");
const addPdfBtns = document.querySelectorAll(".add-pdf");

// Download buttons
const downloadBtn = document.getElementById("downloadSplitBtn");

// ========== 2. GLOBAL VARIABLES ==========

let selectedPdf = null;
let splitFileData = null;

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
  splitFileData = null;

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

    splitBtn.removeAttribute("disabled");
  } else {
    uploadSection.classList.remove("hidden");
    previewContainer.classList.add("hidden");
    toolSection.classList.add("hidden");

    splitBtn.setAttribute("disabled", true);
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
  splitFileData = null;
  startPage.value = "";
  endPage.value = "";
  previewContainer.innerHTML = "";
  updateUI();
};

// ========== 8. SPLIT PDF (BACKEND INTEGRATION) ==========

[splitBtn].forEach(btn => {
  if (!btn) return;

  btn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!selectedPdf) return;

    // Basic validation
    if (startPage.value === "" || endPage.value === "") {
      alert("Please enter start and end page");
      return;
    }

    if (Number(startPage.value) < 1 || Number(endPage.value) < Number(startPage.value)) {
      alert("Invalid page range");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Splitting…";

    const formData = new FormData();
    formData.append("file", selectedPdf);
    formData.append("start", startPage.value);
    formData.append("end", endPage.value);

    try {
      const response = await fetch(`${API_URL}/pdf/split`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Split failed");
      }

      splitFileData = await response.blob();

      downloadBtn?.classList.remove("hidden");

    } catch (err) {
      console.error(err);
      alert("Failed to split PDF");
    } finally {
      btn.disabled = false;
      btn.textContent = "Split PDF";
    }
  });
});

// ========== 9. DOWNLOAD HANDLERS ==========

[startPage, endPage, startPageMobile, endPageMobile].forEach(input => {
  if (input) {
    input.addEventListener("input", () => {
      downloadBtn?.classList.add("hidden");
    });
  }
});

downloadBtn?.addEventListener("click", () => {
  if (splitFileData) {
    downloadFile(splitFileData, "split.pdf");
  }
});

// ========== 10. INITIAL UI STATE ==========
updateUI();
