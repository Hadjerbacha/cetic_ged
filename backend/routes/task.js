// routes/task.js
const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const router = express.Router();
const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'ged',
  password: process.env.PG_PASSWORD || 'hadjer',
  port: process.env.PG_PORT || 5432,
});

// Configuration du stockage des fichiers
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Initialisation de la base de données
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date DATE NOT NULL,
        priority VARCHAR(50) NOT NULL,
        file_path VARCHAR(255),
        notify BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Tables de la base de données initialisées');
  } catch (err) {
    console.error('Erreur d\'initialisation de la base:', err.stack);
  }
}

// Routes
router.post('/', upload.single('file'), async (req, res) => {
  const { title, description, due_date, priority, notify } = req.body;
  const file_path = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const query = `
      INSERT INTO tasks (title, description, due_date, priority, file_path, notify)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [title, description, due_date, priority, file_path, notify];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erreur lors de l\'ajout de la tâche:', err.stack);
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ 
      error: 'Erreur lors de l\'ajout de la tâche',
      details: err.message 
    });
  }
});

router.get('/', async (req, res) => {
  console.log('Tentative de récupération des tâches...');
  try {
    const result = await pool.query(`
      SELECT 
        id,
        title,
        description,
        due_date,
        priority,
        file_path,
        notify,
        created_at
      FROM tasks 
      ORDER BY created_at DESC
    `);
    console.log('Résultats de la requête:', result.rows);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('ERREUR COMPLÈTE:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: err.message,
      fullError: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Ajoutez cette route à votre fichier task.js
router.post('/assign', auth, async (req, res) => {
  const { taskId, userIds, note } = req.body;
  
  try {
    // Vérifier que l'utilisateur existe
    const userCheck = await pool.query('SELECT id FROM users WHERE id = ANY($1::int[])', [userIds]);
    if (userCheck.rows.length !== userIds.length) {
      return res.status(400).json({ error: 'Un ou plusieurs utilisateurs non trouvés' });
    }

    // Assigner la tâche
    const query = `
      UPDATE tasks 
      SET assigned_to = $1, 
          assigned_by = $2,
          assignment_note = $3,
          assigned_at = NOW()
      WHERE id = $4
      RETURNING *;
    `;
    const values = [userIds, req.user.id, note, taskId];
    const result = await pool.query(query, values);

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Erreur assignation:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
// Initialisation au chargement du module
initializeDatabase();

module.exports = router;