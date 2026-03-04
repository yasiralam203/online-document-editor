// include.js
// Loads header and footer dynamically on every page

document.addEventListener("DOMContentLoaded", () => {
  loadComponent("header", "components/header.html");
  loadComponent("footer", "components/footer.html");
});

function loadComponent(id, componentPath) {
  const container = document.getElementById(id);
  if (!container) return;

  const root = document.body.getAttribute("data-root") || "";
  const path = root ? `${root}/${componentPath}` : componentPath;

  fetch(path)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load ${componentPath}`);
      }
      return response.text();
    })
    .then(html => {
      container.innerHTML = html;
      fixLinks(container, root);
    })
    .catch(error => {
      console.error(error);
    });
}

function fixLinks(container, root) {
  const links = container.querySelectorAll("[data-link]");

  links.forEach(link => {
    const type = link.getAttribute("data-link");

    switch (type) {
      case "home":
        link.href = root ? `${root}/index.html` : "index.html";
        break;

      case "merge":
        link.href = root ? `${root}/pages/merge.html` : "pages/merge.html";
        break;

      case "split":
        link.href = root ? `${root}/pages/split.html` : "pages/split.html";
        break;

      case "image-to-pdf":
        link.href = root ? `${root}/pages/image-to-pdf.html` : "pages/image-to-pdf.html";
        break;

      case "pdf-to-image":
        link.href = root ? `${root}/pages/pdf-to-image.html` : "pages/pdf-to-image.html";
        break;

      case "add-page-number":
        link.href = root ? `${root}/pages/add-page-number.html` : "pages/add-page-number.html";
        break;

      case "compress":
        link.href = root ? `${root}/pages/compress-pdf.html` : "pages/compress-pdf.html";
        break;

      case "login":
        link.href = root ? `${root}/pages/auth/login.html` : "pages/auth/login.html";
        break;

      case "signup":
        link.href = root ? `${root}/pages/auth/signup.html` : "pages/auth/signup.html";
        break;
    }
  });
}

// Mobile menu toggle
document.addEventListener("click", (e) => {
  if (e.target.id === "menuToggle") {
    const menu = document.getElementById("navMenu");
    if (menu) {
      menu.classList.toggle("active");
    }
  }
});
