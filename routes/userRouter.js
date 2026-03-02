var express = require('express');
var router = express.Router();

const os = require('os');

router.use("/preferences", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
  next();
});

/* GET home page. */
const userController = require('../Controllers/userController');
const {verifyToken} = require('../Middleware/authMiddleware');
router.get('/getAllUsers', verifyToken, userController.getAllUsers); 
router.get('/getUserById/:id', verifyToken, userController.getUserById);
router.post('/addUser', userController.addUser);
router.put('/updateUser/:id', userController.updateUser);
router.delete('/deleteUser/:id', userController.deleteUser);
router.put('/preferences', verifyToken, userController.savePreferences);
router.get('/preferences', verifyToken, userController.getPreferences);
module.exports = router;
