const router = require("express").Router();

const inscriptionController = require("../Controllers/inscriptionController");
const { verifyToken } = require("../Middleware/authMiddleware");

router.post("/createInscription", verifyToken, inscriptionController.createInscription);

router.get("/getMyInscriptions", verifyToken, inscriptionController.getMyInscriptions);

router.put("/acceptInscription/:id", verifyToken, inscriptionController.acceptInscription);

router.put("/cancelInscription/:id",  verifyToken, inscriptionController.cancelInscription);

// Routes Centre
router.get("/byCentre/:centreName",   verifyToken, inscriptionController.getInscriptionsByCentre);
router.put("/rejectInscription/:id",  verifyToken, inscriptionController.rejectInscription);
router.delete("/delete/:id",          verifyToken, inscriptionController.deleteInscription);

module.exports = router;