const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'ged',
  password: process.env.PG_PASSWORD || 'hadjer',
  port: process.env.PG_PORT || 5432,
});

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

async function initialize() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255),
      description TEXT,
      due_date DATE,
      priority VARCHAR(50),
      file_path TEXT,
      notify BOOLEAN DEFAULT false,
      assigned_to INTEGER[],
      assigned_by INTEGER,
      assignment_note TEXT,
      assigned_at TIMESTAMP,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('Table tasks prête.');
}
initialize();

// ➕ Ajouter une tâche
router.post('/', upload.single('file'), async (req, res) => {
  const { title, description, due_date, priority, notify } = req.body;
  const file_path = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const result = await pool.query(
      `INSERT INTO tasks 
        (title, description, due_date, priority, file_path, notify) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description, due_date, priority, file_path, notify === 'true']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: err.message });
  }
});

// 🔁 Assigner une tâche
router.post('/assign-task', upload.single('file'), async (req, res) => {
  const { note, notify, assigned_to } = req.body;
  let userIds;
  try {
    userIds = JSON.parse(assigned_to);
    if (!Array.isArray(userIds)) throw new Error();
  } catch {
    return res.status(400).json({ error: 'assigned_to doit être un tableau JSON.' });
  }
  const file_path = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const result = await pool.query(
      `INSERT INTO tasks 
        (title, description, due_date, priority, file_path, notify, assigned_to, assignment_note, assigned_at, status)
       VALUES 
        ('Tâche assignée', $1, NOW()::date + INTERVAL '7 days', 'Normale', $2, $3, $4, $1, NOW(), 'assigned')
       RETURNING *`,
      [note, file_path, notify === 'true', userIds]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: err.message });
  }
});

// 📥 Récupérer toutes les tâches
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
