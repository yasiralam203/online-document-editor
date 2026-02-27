
const startPage = document.getElementById("startPage");
const endPage = document.getElementById("endPage");
const splitBtn = document.getElementById("splitBtn");
const pdfInput = document.getElementById("pdfInput");
const splitStatus = document.getElementById("splitStatus");
const pdfViewer = document.getElementById("pdfViewer");


let selectedFile = null;
let currentPreviewURL = null;
let splitFileData = null;

// ========== DOWNLOAD HELPER FUNCTION ==========
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

const UpdateSplitBtnState = () => {
    if(selectedFile === null) {
        splitBtn.disabled = true;
    } else {
        splitBtn.disabled = false;
    } 
};

const clearSplitStatus = (delay = 5000) => {
    setTimeout(() => {
        splitStatus.textContent = "";
    }, delay);
};

pdfInput.addEventListener("change", () => {
    if(pdfInput.files.length === 0) return;
    selectedFile = pdfInput.files[0];
    UpdateSplitBtnState();

    //pdf preview
    currentPreviewURL = URL.createObjectURL(selectedFile);
    pdfViewer.innerHTML = `
        <iframe src = "${currentPreviewURL}" id="viewer" width="100%" height="100%" frameborder="0"></iframe>
        `;
});


//backend integration
splitBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("file",selectedFile);
    formData.append("start", startPage.value);
    formData.append("end", endPage.value);

    if(startPage.value ==="" || endPage.value === "") {
        splitStatus.textContent = "choose start page and end page";
        clearSplitStatus(6000);
        return;
    } else if (startPage.value == 0 || endPage.value < startPage.value) {
        splitStatus.textContent = "add correct page number";
        clearSplitStatus(6000);
        return;
    }

    try {
        splitBtn.disabled = true;
        splitBtn.textContent = "Splitting…";
        
        const response = await fetch("/pdf/split", {
            method: "POST",
            body: formData
        });

        if(!response.ok) {
            throw new Error("split Failed");
        }

        const fileData = await response.blob();
        splitFileData = fileData;
        const url = window.URL.createObjectURL(fileData);
        
        // Show download button
        const downloadBtn = document.getElementById("downloadSplitBtn");
        if (downloadBtn) downloadBtn.classList.remove("hidden");
        
        // Open in new tab
        window.open(url, "_blank");
        splitStatus.textContent = "Split Successful. Opened in new tab!";
        clearSplitStatus();
            
    } catch (error) {
        console.log(error);
        splitStatus.textContent = "Failed to split PDF";
        clearSplitStatus(6000);
        
    } finally {
        splitBtn.disabled = selectedFile === null;
        splitBtn.textContent = "Split PDF";
    }
});

// ========== DOWNLOAD BUTTON HANDLER ==========
const downloadSplitBtn = document.getElementById("downloadSplitBtn");
if (downloadSplitBtn) {
  downloadSplitBtn.addEventListener("click", () => {
    if (splitFileData) {
      downloadFile(splitFileData, "split.pdf");
    }
  });
}
