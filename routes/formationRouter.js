var express = require('express');
var router = express.Router();

const formationController = require('../Controllers/formationController');

router.get('/getAllFormations', formationController.getAllFormations);
router.get('/getFormation/:id', formationController.getFormation);
router.post('/addFormation', formationController.addFormation);
router.put('/updateFormation/:id', formationController.updateFormation);
router.delete('/deleteFormation/:id', formationController.deleteFormation);
router.put('/acceptFormation/:id', formationController.acceptFormation);
router.put('/rejectFormation/:id', formationController.rejectFormation);

module.exports = router;