// ========================================
// PDF COMPRESS - JAVASCRIPT
// ========================================

// ========== 1. SELECT HTML ELEMENTS ==========
const pdfInput = document.getElementById("pdfInput");
const uploadSection = document.getElementById("uploadSection");
const previewContainer = document.getElementById("previewContainer");
const compressForm = document.getElementById("compressForm");
const compressBtn = document.getElementById("compressBtn");
const downloadCompressedBtn = document.getElementById("downloadCompressedBtn");
const levelOptions = document.querySelectorAll(".level-option");

// ========== 2. GLOBAL VARIABLES ==========
let selectedFile = null;
let compressedFileData = null;

// ========== 3. DOWNLOAD HELPER FUNCTION ==========
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

// ========== 4. HANDLE FILE SELECTION ==========
pdfInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
        selectedFile = e.target.files[0]; // Restrict to single file
        updateUI();
    }
});

// Note: When the upload button uses a `<label>`, clicking it naturally opens the file picker 
// without needing any Javascript wrapper. Adding an explicit `click()` listener triggers 
// a double dialog.

// ========== 5. UPDATE UI VISIBILITY ==========
const updateUI = () => {
    if (selectedFile) {
        // User has PDF: Show preview and compress form
        uploadSection.classList.add('hidden');
        previewContainer.classList.remove('hidden');
        compressForm.classList.remove('hidden');
        compressBtn.removeAttribute("disabled");
        renderPreview();
    } else {
        // No PDF: Show upload area, hide compress form
        uploadSection.classList.remove('hidden');
        previewContainer.classList.add('hidden');
        compressForm.classList.add('hidden');
        compressBtn.setAttribute("disabled", true);
        pdfInput.value = ""; // Reset file input
    }
};

// ========== 6. RENDER PDF PREVIEW ==========
const renderPreview = () => {
    previewContainer.innerHTML = "";
    
    const card = document.createElement("div");
    card.className = "pdf-card";
    
    card.innerHTML = `
      <div class="pdf-thumbnail">📄</div>
      <div class="pdf-name">${selectedFile.name}</div>
      <button class="compress-remove-btn" type="button" title="Remove PDF">✖</button>
    `;
    
    // Remove logic
    card.querySelector(".compress-remove-btn").addEventListener("click", (e) => {
        e.preventDefault();
        selectedFile = null;
        updateUI();
    });
    
    previewContainer.appendChild(card);
};

// ========== 7. COMPRESSION LEVELS UI TOGGLE ==========
levelOptions.forEach(option => {
    option.addEventListener("click", function() {
        levelOptions.forEach(opt => opt.classList.remove("selected"));
        this.classList.add("selected");
        // internal radio button gets checked automatically because input is nested in label
        
        // Hide download button when compression level is changed
        if (downloadCompressedBtn) {
            downloadCompressedBtn.classList.add("hidden");
        }
    });
});

// ========== 8. COMPRESS PDF SUBMISSION ==========
compressForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    
    // Get chosen compression level
    const checkedRadio = document.querySelector('input[name="compressionLevel"]:checked');
    const compressionLevel = checkedRadio ? checkedRadio.value : 'recommended';
    formData.append("level", compressionLevel);

    try {
        compressBtn.disabled = true;
        compressBtn.textContent = "Compressing…";

        const response = await fetch(`${API_URL}/pdf/compress`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error("Compression failed");
        }

        const fileData = await response.blob();
        compressedFileData = fileData;
        
        // Show download button
        if (downloadCompressedBtn) downloadCompressedBtn.classList.remove("hidden");
        
        // Output compressed size logic could go here if server provided it via headers

    } catch (error) {
        console.error("Error compressing PDF:", error);
        alert("Failed to compress PDF. Please assure the backend endpoint exists.");
    } finally {
        compressBtn.disabled = !selectedFile;
        compressBtn.textContent = "Compress PDF";
    }
});

// ========== 9. DOWNLOAD BUTTON HANDLER ==========
if (downloadCompressedBtn) {
    downloadCompressedBtn.addEventListener("click", () => {
        if (compressedFileData) {
            downloadFile(compressedFileData, `compressed_${selectedFile?.name || 'document.pdf'}`);
        }
    });
}

// ========== 10. CALL INITIAL SETUP ==========
updateUI();