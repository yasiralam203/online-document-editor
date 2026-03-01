import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pdfRoutes from "./routes/pdf.routes.js";

const app = express();
const port = 3000;

/* 🔹 ES module dirname fix */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


//middleware
app.use(express.json());

/* ✅ SERVE FRONTEND CORRECTLY */
app.use(express.static(path.join(__dirname, "..", "frontend")));


// connect PDF routes API routes
app.use("/pdf", pdfRoutes);

app.get("/", (req, res) => {
    res.send("Hello from ES6 backend 🚀");
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
