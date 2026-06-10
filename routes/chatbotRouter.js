var express = require('express');
var router  = express.Router();

const chatbotController = require('../Controllers/chatbotController');
const { verifyToken }   = require('../Middleware/authMiddleware');

// Optionnel : si connecté on enrichit avec le profil user
// Si non connecté, on répond quand même (token optionnel)
const optionalAuth = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return next();
    const token = header.split(' ')[1];
    try {
        const jwt     = require('jsonwebtoken');
        req.user      = jwt.verify(token, process.env.JWT_SECRET || 'mySecretKey');
    } catch {}
    next();
};

router.post('/message', optionalAuth, chatbotController.sendMessage);

module.exports = router;