var express = require('express');
var router = express.Router();

const formationController = require('../Controllers/formationController');
const {verifyToken} = require('../Middleware/authMiddleware');
const recommendationController = require('../Controllers/recommendationController');

router.get('/getAllFormations', formationController.getAllFormations);
router.get('/getFormation/:id', formationController.getFormation);
router.post('/addFormation', formationController.addFormation);
router.put('/updateFormation/:id', formationController.updateFormation);
router.delete('/deleteFormation/:id', formationController.deleteFormation);
router.put('/acceptFormation/:id', formationController.acceptFormation);
router.put('/rejectFormation/:id', formationController.rejectFormation);
router.get('/getRecommendedFormations', verifyToken, recommendationController.getRecommendedFormations);

module.exports = router;