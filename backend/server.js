require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const workflowsRoutes = require("./routes/workflow");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", workflowsRoutes);

// Lancement du serveur
app.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));
