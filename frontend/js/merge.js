const addPdfBtn = document.getElementById("addPdfBtn");
const pdfInput = document.getElementById("pdfInput");
const pdfGrid = document.getElementById("pdfGrid");
const mergeBtn = document.getElementById("mergeBtn");
const mergeStatus = document.getElementById("mergeStatus");

let selectedFiles = [];
let draggedIndex = null;

const isDuplicate = file => {
  return selectedFiles.some(f => f.name === f.name && f.size === file.size);
};

function updateMergeButtonState() {
  if (selectedFiles.length < 2) {
    mergeBtn.disabled = true;
  } else {
    mergeBtn.disabled = false;
  }
}

const clearMergeStatus = (delay = 5000) => {
  setTimeout(() => {
    mergeStatus.textContent = "";
    mergeStatus.className = "merge-status";
  }, delay);
};

/* Open file picker */
addPdfBtn.addEventListener("click", () => {
  pdfInput.click();
  clearMergeStatus(0);
});

/* Add files */
pdfInput.addEventListener("change", () => {
  const files = Array.from(pdfInput.files);

  files.forEach(file => {
    if (isDuplicate(file)) {
      return;
    }
      selectedFiles.push(file);
  });

  renderPdfList();
  pdfInput.value = "";

  updateMergeButtonState();

});

/* Render PDF list */
function renderPdfList() {
  pdfGrid.innerHTML = "";

  selectedFiles.forEach((file, index) => {
    const card = document.createElement("div");
    card.className = "pdf-card";
    card.draggable = true;
    card.dataset.index = index;

    card.innerHTML = `
      <div class="pdf-thumbnail">📄</div>
      <div class="pdf-name">${file.name}</div>
      <button class="remove-btn" title="Remove PDF">✖</button>
    `;

    addDragEvents(card);

    // Remove logic
    card.querySelector(".remove-btn").addEventListener("click", () => {
      selectedFiles.splice(index, 1);
      renderPdfList();
    });

    pdfGrid.appendChild(card);

    updateMergeButtonState();
    clearMergeStatus(0);
  });
}


/* Drag logic */
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

//backend integration
const mergeForm = document.getElementById("mergeForm");

mergeForm.addEventListener("submit", async (e) => {
  e.preventDefault();//prevent reload event(e)

  if (selectedFiles.length < 2) return;

  const formData = new FormData(); //object stored in formData
  

  // IMPORTANT: order is preserved
  selectedFiles.forEach(file => {
    formData.append("files", file); // 👈 must match multer field
  });

  try {
    mergeBtn.disabled = true;
    mergeBtn.textContent = "merging...";

    mergeStatus.textContent = "Merging PDFs…";
    mergeStatus.className = "merge-status loading";

    mergeBtn.textContent = "Merging…";


    const response = await fetch("http://localhost:3000/pdf/merge", {
      method: "POST",
      body: formData
    });


    if (!response.ok) {
      throw new Error("Merge failed");
      clearMergeStatus();
    }

    const fileData = await response.blob();//raw binary data
    const url = window.URL.createObjectURL(fileData);// create a temporary URL

    //open in New tab
    window.open(url, "_blank");

    mergeStatus.textContent = "Merged successfully. Opened in new tab.";
    mergeStatus.className = "merge-status success";


  } catch (error) {
    alert("Failed to merge PDFs");
    console.log(error);
    mergeStatus.textContent = "Failed to merge PDFs.";
    mergeStatus.className = "merge-status error";
  } finally {
    mergeBtn.disabled = false;
    mergeBtn.textContent = "Merge PDFs";
  }

});