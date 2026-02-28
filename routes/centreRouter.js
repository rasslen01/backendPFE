var express = require('express');
var router = express.Router();

const centreController = require('../Controllers/centreController');

router.get('/getAllCentres', centreController.getAllCentres);
router.get('/getCentre/:id', centreController.getCentre);
router.post('/addCentre', centreController.addCentre);
router.put('/updateCentre/:id', centreController.updateCentre);
router.delete('/deleteCentre/:id', centreController.deleteCentre);
router.put('/acceptCentre/:id', centreController.acceptCentre);
router.put('/rejectCentre/:id', centreController.rejectCentre);
router.get('/searchCentres', centreController.searchCentres);

module.exports = router;