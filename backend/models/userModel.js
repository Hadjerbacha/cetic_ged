const pool = require("../config/db");

const findUserByEmail = async (email) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0];
};

module.exports = { findUserByEmail };

// Créer un utilisateur
const createUser = async ({ name, email, password, role }) => {
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, email, password, role]
  );
  return result.rows[0];
};

// Fonction pour récupérer tous les utilisateurs
const getUsers = async () => {
  try {
    const result = await pool.query("SELECT * FROM users");
    return result.rows;
  } catch (err) {
    console.error('Error in database query:', err); // Log l'erreur liée à la base de données
    throw new Error('Database query failed'); // Rejette l'erreur pour qu'elle soit captée par le contrôleur
  }
};


module.exports = { findUserByEmail, createUser, getUsers };