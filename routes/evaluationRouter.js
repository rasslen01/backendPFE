var express = require('express');
var router  = express.Router();

const ctrl            = require('../Controllers/evaluationController');
const { verifyToken, verifyRole } = require('../Middleware/authMiddleware');

// Étudiant
router.post('/',                      verifyToken, ctrl.createOrUpdate);
router.get('/my/:formationId',        verifyToken, ctrl.getMyEvaluation);
router.delete('/:id',                 verifyToken, ctrl.deleteEvaluation);

// Public (affichage des avis)
router.get('/formation/:id',          ctrl.getByFormation);

// Admin
router.get('/admin/all', verifyToken, verifyRole('ADMIN'), ctrl.getAllAdmin);

module.exports = router;