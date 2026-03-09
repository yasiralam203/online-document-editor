import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pdfRoutes from "./routes/pdf.routes.js";
import { requestIdMiddleware } from "./middlewares/requestId.js";
import { startAutoCleanup } from "./utils/cleanup.js";

const app = express();
// const port = 3000;
const port = process.env.PORT || 3000;

/* 🔹 ES module dirname fix */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


//middleware
app.use(express.json());
app.use(requestIdMiddleware);

// Start auto cleanup (runs exactly every 10 min, cleans files older than 1 hr)
startAutoCleanup(10 * 60 * 1000, 60 * 60 * 1000);

/* ✅ SERVE FRONTEND CORRECTLY */
app.use(express.static(path.join(__dirname, "..", "frontend")));


// connect PDF routes API routes
app.use("/pdf", pdfRoutes);

// app.get("/", (req, res) => {
//     res.send("Hello from ES6 backend 🚀");
// });

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
