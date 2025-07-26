const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer token

  if (!token) return res.status(401).json({ msg: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // same secret used when signing
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ msg: 'Invalid or expired token.' });
  }
}

module.exports = verifyToken;
