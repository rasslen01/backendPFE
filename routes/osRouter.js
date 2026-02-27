var express = require('express');
var router = express.Router();

const os = require('os');

/* GET home page. */
const osController = require('../Controllers/osController');
router.get('/getOsInformation', osController.getOsInformation); 
module.exports = router;
