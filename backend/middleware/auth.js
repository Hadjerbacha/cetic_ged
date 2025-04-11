const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'votreSecretSuperSecret'
    );

    req.user = decoded;
    next();
  } catch (err) {
    console.error('Erreur d\'authentification:', err);
    res.status(401).json({ message: 'Authentification invalide' });
  }
};

module.exports = { auth };