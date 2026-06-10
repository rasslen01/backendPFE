var express = require('express');
var router = express.Router();
const { verifyToken } = require('../Middleware/authMiddleware');
const centreController = require('../Controllers/centreController');

// ========== ROUTES PUBLIQUES ==========
router.get('/getAllCentres', centreController.getAllCentres);
router.get('/getCentre/:id', centreController.getCentre);
router.get('/searchCentres', centreController.searchCentres);
router.get('/getAcceptedCentres', centreController.getAcceptedCentres);

// ========== ROUTES PROTÉGÉES ==========
router.get('/me', verifyToken, centreController.getMyCentreProfile);
router.put('/me', verifyToken, centreController.updateMyCentreProfile);
router.get('/me/formations', verifyToken, centreController.getMyCentreFormations);

// ✅ ROUTE MANQUANTE — upload logo ou coverImage
router.post(
    '/me/upload',
    verifyToken,
    centreController.upload.single('image'),  // 'image' = form-data field name
    centreController.uploadCentreImage
);

// ========== ROUTES ADMIN ==========
router.post('/addCentre', verifyToken, centreController.addCentre);
router.put('/updateCentre/:id', verifyToken, centreController.updateCentre);
router.delete('/deleteCentre/:id', verifyToken, centreController.deleteCentre);
router.put('/acceptCentre/:id', verifyToken, centreController.acceptCentre);
router.put('/rejectCentre/:id', verifyToken, centreController.rejectCentre);

module.exports = router;