const jwt = require('jsonwebtoken');
const localStorage = require('localStorage');

const secret = 'your-secret-key';

const authMiddleware = (req, res, next) => {
  // Get the token from localStorage
  const token = localStorage.getItem('token')
  
  // If there is no token stored in localStorage, the request is unauthorized
  if (!token) {
    return res.redirect('/users/login');
  }
  
  // Verify the token and get the user 
  jwt.verify(token, secret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });

};

const notAuthMiddleware = (req, res, next) => {
  // Get the token from localStorage
  const token = localStorage.getItem('token')

  if (token) {
    return res.redirect('/');
  }

  next();
};

module.exports = { authMiddleware, notAuthMiddleware, secret };
