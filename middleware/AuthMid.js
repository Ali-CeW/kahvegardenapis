const jwt = require('jsonwebtoken');
const Enums = require('../config/enum'); // HTTP_CODES burada tanımlı
const User = require('../Database/Db/Admins');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(Enums.HTTP_CODES.UNAUTHORIZED).json({ message: 'Token bulunamadı' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Burada id ve user_type gelir
    next();
  } catch (err) {
    return res.status(Enums.HTTP_CODES.UNAUTHORIZED).json({ message: 'Geçersiz Oturum / Oturum süreniz doldu' });
  }
};

module.exports = authenticateToken;
