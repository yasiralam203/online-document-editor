
const startPage = document.getElementById("startPage");
const endPage = document.getElementById("endPage");
const splitBtn = document.getElementById("splitBtn");
const pdfInput = document.getElementById("pdfInput");
const splitStatus = document.getElementById("splitStatus");

let selectedFile = null;

const UpdateSplitBtnState = () => {
    if(selectedFile === null) {
        splitBtn.disabled = true;
    } else {
        splitBtn.disabled = false;
    } 
};

pdfInput.addEventListener("change", () => {
    if(pdfInput.files.length === 0) return;
    selectedFile = pdfInput.files[0];
    UpdateSplitBtnState();
});

//backend integration
splitBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("file",selectedFile);
    formData.append("start", startPage.value);
    formData.append("end", endPage.value);

    try {
        const response = await fetch("/pdf/split", {
            method: "POST",
            body: formData
        });

        if(!response.ok) {
            throw new Error("split Failed");
        }
        const fileData = await response.blob();
        const url = window.URL.createObjectURL(fileData);

        //open in New tab
        window.open(url, "_blank");
            
    } catch {
        alert("Failed to split PDFs");
        console.log(error);
    }
});
