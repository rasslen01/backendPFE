var express = require('express');
var router  = express.Router();

const logController = require('../Controllers/logController');
const { verifyToken, verifyRole } = require('../Middleware/authMiddleware');

// verifyToken suffit — la page est déjà dans le layout Admin protégé
router.get('/',         verifyToken, logController.getLogs);
router.get('/recent',   verifyToken, logController.getRecentLogs);
router.get('/stats',    verifyToken, logController.getLogStats);
router.delete('/clear', verifyToken, logController.clearLogs);

module.exports = router;