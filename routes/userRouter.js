var express = require('express');
var router = express.Router();

const os = require('os');

/* GET home page. */
const userController = require('../Controllers/userController');
router.get('/getAllUsers', userController.getAllUsers); 
router.get('/getUserById/:id', userController.getUserById);
router.post('/addUser', userController.addUser);
router.put('/updateUser/:id', userController.updateUser);
router.delete('/deleteUser/:id', userController.deleteUser);
module.exports = router;
